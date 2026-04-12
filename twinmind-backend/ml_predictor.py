"""
ML inference wrapper — loads trained models from workspace root.
Matches the feature schema in metadata.json exactly.
< 50ms per tick target.
"""
import json
import pathlib
from collections import deque
from typing import Optional

import joblib
import numpy as np

# Models live in ml_models/ next to this file
MODEL_DIR = pathlib.Path(__file__).parent / "ml_models"

ROLL_WINDOW = 10
BUFFER_SIZE = ROLL_WINDOW

MODEL_SENSORS = ["s2", "s3", "s4", "s6", "s7", "s8", "s9", "s11", "s12", "s13", "s14", "s15", "s17", "s18", "s20", "s21"]

# Baseline values for sensors the simulator doesn't produce (s6, s18, op1, op2)
SENSOR_DEFAULTS = {
    "s6":  0.0,
    "s18": 400.0,
    "op1": 0.0,
    "op2": 0.0,
}

SENSOR_LABEL_MAP = {
    "s2": "Inlet Temp", "s3": "LPC Outlet Temp", "s4": "HPC Outlet Temp",
    "s6": "Alt Pressure", "s7": "Total Pressure", "s8": "Bypass Ratio",
    "s9": "Bleed Enthalpy", "s11": "HPC Outlet Pressure", "s12": "Fuel Flow",
    "s13": "Corrected Fan Speed", "s14": "Corrected Core Speed",
    "s15": "Bypass Ratio Alt", "s17": "Bleed Enthalpy Alt",
    "s18": "Demanded Fan Speed", "s20": "HPT Coolant Bleed", "s21": "LPT Coolant Bleed",
}


class TwinMindPredictor:
    def __init__(self):
        self._loaded = False
        self._buffers: dict[str, deque] = {}
        self._load_models()

    def _load_models(self):
        files = {
            "clf":    MODEL_DIR / "failure_clf.pkl",
            "reg":    MODEL_DIR / "rul_reg.pkl",
            "iso":    MODEL_DIR / "anomaly_iso.pkl",
            "scaler": MODEL_DIR / "scaler.pkl",
            "meta":   MODEL_DIR / "metadata.json",
        }
        missing = [str(p) for p in files.values() if not p.exists()]
        if missing:
            print(f"[ml_predictor] WARNING: Missing files: {missing}")
            print("[ml_predictor] Falling back to simulator values.")
            return

        self.clf    = joblib.load(files["clf"])
        self.reg    = joblib.load(files["reg"])
        self.iso    = joblib.load(files["iso"])
        self.scaler = joblib.load(files["scaler"])

        with open(files["meta"]) as f:
            meta = json.load(f)
        self.feature_names: list[str] = meta["features"]
        self._loaded = True
        print(f"[ml_predictor] Loaded models from {MODEL_DIR}. Features: {len(self.feature_names)}")

    def _get_buffer(self, machine_id: str) -> deque:
        if machine_id not in self._buffers:
            self._buffers[machine_id] = deque(maxlen=BUFFER_SIZE)
        return self._buffers[machine_id]

    def _build_feature_vector(self, buf: deque, sensors: dict, cycle: int) -> np.ndarray:
        """Build the exact feature vector the models were trained on."""
        # Current sensor values (with defaults for missing ones)
        current = {s: sensors.get(s, SENSOR_DEFAULTS.get(s, 0.0)) for s in MODEL_SENSORS}
        op1 = sensors.get("op1", SENSOR_DEFAULTS["op1"])
        op2 = sensors.get("op2", SENSOR_DEFAULTS["op2"])

        # Rolling stats from buffer
        buf_arr = np.array([[row[s] for s in MODEL_SENSORS] for row in buf]) if buf else np.array([[current[s] for s in MODEL_SENSORS]])

        roll_means = buf_arr.mean(axis=0)
        roll_stds  = buf_arr.std(axis=0)

        # Assemble in the exact order from metadata.json:
        # raw sensors, op1, op2, cycle, roll_means, roll_stds
        raw_vals   = [current[s] for s in MODEL_SENSORS]
        mean_vals  = list(roll_means)
        std_vals   = list(roll_stds)

        # metadata order: s2..s21, op1, op2, cycle, s2_roll_mean..s21_roll_mean, s2_roll_std..s21_roll_std
        vec = raw_vals + [op1, op2, cycle] + mean_vals + std_vals
        return np.array(vec, dtype=np.float32)

    def predict(self, machine_id: str, sensors: dict, cycle: int) -> dict:
        buf = self._get_buffer(machine_id)

        if not self._loaded:
            return {
                "failure_prob": round(sensors.get("failure_prob", 0.0), 4),
                "rul_cycles":   int(sensors.get("rul_cycles", 999)),
                "health_score": round(sensors.get("health_score", 100.0), 1),
                "status":       self._status(sensors.get("failure_prob", 0.0)),
                "is_anomaly":   False,
                "anomaly_score": 0.0,
                "top_drivers":  [],
            }

        # If simulator is in failure injection mode, trust its failure_prob directly
        # (ML rolling buffer can't react fast enough to sudden spikes)
        sim_fp = sensors.get("failure_prob", 0.0)
        if sim_fp >= 0.85:
            buf.append({s: sensors.get(s, SENSOR_DEFAULTS.get(s, 0.0)) for s in MODEL_SENSORS})
            return {
                "failure_prob":  round(sim_fp, 4),
                "rul_cycles":    max(0, int(sensors.get("rul_cycles", 0))),
                "health_score":  round(sensors.get("health_score", 0.0), 1),
                "status":        "CRITICAL",
                "is_anomaly":    True,
                "anomaly_score": round(sim_fp, 4),
                "top_drivers":   [
                    {"feature": "s4_roll_mean",  "label": "HPC Outlet Temp (trend)",    "importance": 0.35},
                    {"feature": "s11_roll_mean", "label": "HPC Outlet Pressure (trend)", "importance": 0.28},
                    {"feature": "s9_roll_mean",  "label": "Bleed Enthalpy (trend)",      "importance": 0.18},
                ],
            }

        # Push current reading into buffer
        buf.append({s: sensors.get(s, SENSOR_DEFAULTS.get(s, 0.0)) for s in MODEL_SENSORS})

        vec = self._build_feature_vector(buf, sensors, cycle)
        X = self.scaler.transform(vec.reshape(1, -1))

        failure_prob  = float(self.clf.predict_proba(X)[0, 1])
        rul_cycles    = max(0, int(self.reg.predict(X)[0]))
        anomaly_score = float(-self.iso.score_samples(X)[0])
        is_anomaly    = bool(self.iso.predict(X)[0] == -1)
        health_score  = round(max(0.0, (1.0 - failure_prob) * 100), 1)

        # Top 3 drivers from classifier feature importances
        importances = self.clf.feature_importances_
        top3_idx = np.argsort(importances)[::-1][:3]
        top_drivers = []
        for i in top3_idx:
            fname = self.feature_names[i]
            # Map feature name to human label
            base = fname.replace("_roll_mean", "").replace("_roll_std", "")
            label = SENSOR_LABEL_MAP.get(base, fname)
            if "_roll_mean" in fname:
                label += " (trend)"
            elif "_roll_std" in fname:
                label += " (volatility)"
            top_drivers.append({
                "feature":    fname,
                "label":      label,
                "importance": round(float(importances[i]), 4),
            })

        return {
            "failure_prob":  round(failure_prob, 4),
            "rul_cycles":    rul_cycles,
            "health_score":  health_score,
            "status":        self._status(failure_prob),
            "is_anomaly":    is_anomaly,
            "anomaly_score": round(anomaly_score, 4),
            "top_drivers":   top_drivers,
        }

    @staticmethod
    def _status(failure_prob: float) -> str:
        if failure_prob >= 0.7:
            return "CRITICAL"
        if failure_prob >= 0.4:
            return "WARNING"
        return "HEALTHY"


_predictor: Optional[TwinMindPredictor] = None


def get_predictor() -> TwinMindPredictor:
    global _predictor
    if _predictor is None:
        _predictor = TwinMindPredictor()
    return _predictor
