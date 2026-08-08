"""
AI Predictive Failure Risk Router (/api/predictions/*)
------------------------------------------------------
Calculates failure risk scores and ETTF projections using sliding-window rate-of-change models.
"""

from fastapi import APIRouter
from typing import List
from schemas import PredictionResponse
from services.predictor import HeuristicPredictorService
from routers.devices import sim_service

router = APIRouter(prefix="/api/predictions", tags=["AI Failure Risk Prediction"])
predictor_service = HeuristicPredictorService()


@router.get("", response_model=List[PredictionResponse])
def get_predictions():
    batch = sim_service.generate_tick()
    predictions = [predictor_service.predict_risk(item) for item in batch]
    predictions.sort(key=lambda x: x["risk_score"], reverse=True)
    return predictions
