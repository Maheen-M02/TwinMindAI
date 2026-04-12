"""
Machine simulator — generates realistic sensor streams with degradation.
No ML deps required; testable in isolation.
"""
import math
import random
import time

SENSOR_NAMES = ["s2", "s3", "s4", "s6", "s7", "s8", "s9", "s11", "s12", "s13", "s14", "s15", "s17", "s18", "s20", "s21"]

# Baseline sensor ranges (min, max) derived from CMAPSS dataset statistics
SENSOR_BASELINES = {
    "s2":  (641.0,  644.0),
    "s3":  (1585.0, 1600.0),
    "s4":  (1400.0, 1415.0),
    "s6":  (21.6,   21.6),    # near-constant in CMAPSS
    "s7":  (554.0,  556.0),
    "s8":  (2388.0, 2392.0),
    "s9":  (9045.0, 9065.0),
    "s11": (47.0,   48.5),
    "s12": (521.0,  524.0),
    "s13": (2388.0, 2392.0),
    "s14": (8130.0, 8150.0),
    "s15": (8.4,    8.7),
    "s17": (392.0,  396.0),
    "s18": (2388.0, 2392.0),  # similar range to s13
    "s20": (38.8,   39.2),
    "s21": (23.2,   23.6),
}

# Noise std as fraction of range
NOISE_FRACTION = 0.01

# Degradation sensitivity per sensor (how much each sensor drifts with degradation)
DEGRADATION_SENSITIVITY = {
    "s2":  0.8, "s3":  1.2, "s4":  1.0, "s6":  0.1,
    "s7":  0.5, "s8":  0.3, "s9":  0.6, "s11": 1.5,
    "s12": 0.9, "s13": 0.3, "s14": 0.7, "s15": 1.1,
    "s17": 0.8, "s18": 0.3, "s20": 1.3, "s21": 1.0,
}


class MachineSimulator:
    def __init__(self, machine_id: str, degradation_rate: float = 0.001):
        self.machine_id = machine_id
        self.degradation_rate = degradation_rate
        self.cycle = 0
        self.degradation = 0.0          # 0.0 → 1.0
        self._failure_injection = 0     # remaining failure cycles
        self._rng = random.Random()

    def step(self) -> dict:
        self.cycle += 1

        # Advance degradation
        if self._failure_injection > 0:
            self._failure_injection -= 1
            spike = 0.85   # strong enough to push ML model past CRITICAL threshold
        else:
            spike = 0.0
        self.degradation = min(1.0, self.degradation + self.degradation_rate)

        effective_deg = min(1.0, self.degradation + spike)

        sensors = {}
        for name in SENSOR_NAMES:
            lo, hi = SENSOR_BASELINES[name]
            rng_span = hi - lo
            noise = self._rng.gauss(0, rng_span * NOISE_FRACTION)
            drift = rng_span * DEGRADATION_SENSITIVITY[name] * effective_deg
            sensors[name] = round(lo + drift + noise, 3)

        health_score = round(max(0.0, (1.0 - effective_deg) * 100), 1)
        failure_prob = round(1.0 / (1.0 + math.exp(-10 * (effective_deg - 0.5))), 4)
        rul_cycles = max(0, int((1.0 - self.degradation) / max(self.degradation_rate, 1e-9)))

        return {
            "machine_id": self.machine_id,
            "cycle": self.cycle,
            "timestamp": round(time.time(), 3),
            "health_score": health_score,
            "failure_prob": failure_prob,
            "rul_cycles": rul_cycles,
            **sensors,
        }

    def inject_failure(self, duration: int = 30):
        """Temporarily spike sensors to simulate an imminent failure.
        Also resets the ML predictor buffer for this machine so the spike
        is seen immediately rather than being averaged out over 10 cycles.
        """
        self._failure_injection = duration
        # Clear the ML rolling buffer so the spike hits immediately
        try:
            from ml_predictor import get_predictor
            predictor = get_predictor()
            if machine_id := self.machine_id:
                if machine_id in predictor._buffers:
                    predictor._buffers[machine_id].clear()
        except Exception:
            pass

    def reset(self):
        self.cycle = 0
        self.degradation = 0.0
        self._failure_injection = 0


# --- Module-level singletons ---
def _make(machine_id, rate, pre_advance=0):
    sim = MachineSimulator(machine_id, degradation_rate=rate)
    for _ in range(pre_advance):
        sim.step()
    return sim


MACHINES: dict[str, MachineSimulator] = {
    "M1": _make("M1", rate=0.0005),
    "M2": _make("M2", rate=0.0012, pre_advance=400),
    "M3": _make("M3", rate=0.0020, pre_advance=600),
}
