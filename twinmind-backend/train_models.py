"""
Train XGBClassifier, XGBRegressor, and IsolationForest on CMAPSS FD001.
Run once: python train_models.py
Saves models to ./ml_models/
"""
import json
import os
import pathlib

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import mean_absolute_error, roc_auc_score
from sklearn.preprocessing import MinMaxScaler
from xgboost import XGBClassifier, XGBRegressor

DATA_PATH = pathlib.Path("cmapss_data/train_FD001.txt")
OUT_DIR = pathlib.Path("ml_models")
OUT_DIR.mkdir(exist_ok=True)

COLS = (
    ["engine_id", "cycle", "op1", "op2", "op3"]
    + [f"s{i}" for i in range(1, 22)]
)
DROP_SENSORS = ["s1", "s5", "s10", "s16", "s19"]
KEEP_SENSORS = [f"s{i}" for i in range(1, 22) if f"s{i}" not in DROP_SENSORS]
RUL_CAP = 125
FAIL_THRESHOLD = 30
WINDOW = 10


def load_data():
    df = pd.read_csv(DATA_PATH, sep=r"\s+", header=None, names=COLS)
    df.drop(columns=DROP_SENSORS + ["op1", "op2", "op3"], inplace=True)
    max_cycle = df.groupby("engine_id")["cycle"].max().rename("max_cycle")
    df = df.join(max_cycle, on="engine_id")
    df["rul"] = (df["max_cycle"] - df["cycle"]).clip(upper=RUL_CAP)
    df["fail_label"] = (df["rul"] <= FAIL_THRESHOLD).astype(int)
    return df


def engineer_features(df):
    feature_cols = []
    for sensor in KEEP_SENSORS:
        roll_mean = (
            df.groupby("engine_id")[sensor]
            .transform(lambda x: x.rolling(WINDOW, min_periods=1).mean())
        )
        roll_std = (
            df.groupby("engine_id")[sensor]
            .transform(lambda x: x.rolling(WINDOW, min_periods=1).std().fillna(0))
        )
        df[f"{sensor}_mean"] = roll_mean
        df[f"{sensor}_std"] = roll_std
        feature_cols += [f"{sensor}_mean", f"{sensor}_std"]
    return df, feature_cols


def main():
    print("Loading data...")
    df = load_data()
    df, feature_cols = engineer_features(df)

    X = df[feature_cols].values
    y_cls = df["fail_label"].values
    y_reg = df["rul"].values

    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    # Class imbalance weight
    neg, pos = np.bincount(y_cls)
    spw = neg / pos

    print(f"Training XGBClassifier (scale_pos_weight={spw:.1f})...")
    clf = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        scale_pos_weight=spw,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_scaled, y_cls)
    auc = roc_auc_score(y_cls, clf.predict_proba(X_scaled)[:, 1])
    print(f"  AUC-ROC: {auc:.4f}")

    print("Training XGBRegressor...")
    reg = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        random_state=42,
        n_jobs=-1,
    )
    reg.fit(X_scaled, y_reg)
    mae = mean_absolute_error(y_reg, reg.predict(X_scaled))
    print(f"  RUL MAE: {mae:.2f} cycles")

    print("Training IsolationForest on healthy samples...")
    healthy_mask = y_cls == 0
    iso = IsolationForest(n_estimators=200, contamination=0.05, random_state=42, n_jobs=-1)
    iso.fit(X_scaled[healthy_mask])

    # Feature importance
    importances = clf.feature_importances_
    top5_idx = np.argsort(importances)[::-1][:5]
    print("Top 5 features:")
    for i in top5_idx:
        print(f"  {feature_cols[i]}: {importances[i]:.4f}")

    # Save
    joblib.dump(clf, OUT_DIR / "failure_classifier.pkl")
    joblib.dump(reg, OUT_DIR / "rul_regressor.pkl")
    joblib.dump(iso, OUT_DIR / "anomaly_detector.pkl")
    joblib.dump(scaler, OUT_DIR / "scaler.pkl")

    metadata = {
        "feature_names": feature_cols,
        "keep_sensors": KEEP_SENSORS,
        "window": WINDOW,
        "rul_cap": RUL_CAP,
        "fail_threshold": FAIL_THRESHOLD,
    }
    with open(OUT_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nAll models saved to {OUT_DIR}/")


if __name__ == "__main__":
    main()
