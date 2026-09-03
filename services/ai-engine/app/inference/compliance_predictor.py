"""
XGBoost compliance risk predictor.
Trains on historical compliance records; predicts risk score for next period.
ponytail: synthetic features for now; swap with real feature engineering when data lands.
"""
import os
from pathlib import Path

import joblib
import numpy as np

MODEL_PATH = Path(os.getenv("MODEL_ARTIFACTS_PATH", "/app/model_artifacts")) / "compliance_risk.pkl"

_model = None


def _load_model():
    global _model
    if _model is None and MODEL_PATH.exists():
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_risk(features: dict) -> dict:
    """Return {risk_score: float, risk_level: str, confidence: float}."""
    model = _load_model()
    if model is None:
        # No trained model yet — return rule-based heuristic
        score = float(features.get("overall_score", 75))
        risk = 1.0 - (score / 100.0)
        level = "high" if risk > 0.6 else ("medium" if risk > 0.35 else "low")
        return {"risk_score": round(risk, 3), "risk_level": level, "confidence": 0.5}

    x = np.array([[
        features.get("overall_score", 75),
        features.get("safety_score", 75),
        features.get("environmental_score", 75),
        features.get("labour_score", 75),
        features.get("open_violations", 0),
        features.get("days_since_last_inspection", 30),
    ]])
    prob = float(model.predict_proba(x)[0][1])
    level = "high" if prob > 0.6 else ("medium" if prob > 0.35 else "low")
    return {"risk_score": round(prob, 3), "risk_level": level, "confidence": 0.85}
