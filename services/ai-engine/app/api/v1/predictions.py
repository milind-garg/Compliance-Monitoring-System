from fastapi import APIRouter
from pydantic import BaseModel

from app.inference.compliance_predictor import predict_risk

router = APIRouter(prefix="/predictions", tags=["predictions"])


class PredictRequest(BaseModel):
    overall_score: float = 75
    safety_score: float = 75
    environmental_score: float = 75
    labour_score: float = 75
    open_violations: int = 0
    days_since_last_inspection: int = 30


class PredictResponse(BaseModel):
    risk_score: float
    risk_level: str
    confidence: float


@router.post("/risk", response_model=PredictResponse)
async def predict(body: PredictRequest):
    return predict_risk(body.model_dump())
