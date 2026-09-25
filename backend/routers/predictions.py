"""
AI Predictive Failure Risk Router (/api/predictions/*)
------------------------------------------------------
GET /api/predictions          — Returns latest prediction for all devices.
GET /api/predictions/{device_id} — Returns latest prediction for one device.

ARCHITECTURE NOTE:
  Predictions are now computed and persisted by the backend on every
  POST /api/telemetry ingestion (via services/predictor.py).
  This router simply reads the latest PredictionRecord per device from
  the database — no live simulation tick is called here.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from database import get_db
from models import PredictionRecord, Device
from schemas import PredictionResponse

router = APIRouter(prefix="/api/predictions", tags=["Heuristic Failure Risk Prediction"])


@router.get(
    "",
    response_model=List[PredictionResponse],
    summary="Get latest prediction for all devices",
    description=(
        "Returns the most recent heuristic prediction for every device. "
        "Predictions are computed by the backend on telemetry ingestion — "
        "not by the React frontend."
    ),
)
def get_all_predictions(db: Session = Depends(get_db)):
    # Subquery: max id per device (proxy for latest prediction)
    subq = (
        db.query(func.max(PredictionRecord.id).label("max_id"))
        .group_by(PredictionRecord.device_id)
        .subquery()
    )
    records = (
        db.query(PredictionRecord)
        .filter(PredictionRecord.id.in_(subq))
        .all()
    )

    return [
        PredictionResponse(
            device_id=r.device_id,
            name=r.device_name,
            risk_score=r.risk_score,
            risk_level=r.risk_level,
            primary_failure_mode=r.primary_failure_mode,
            ettf=r.ettf,
            recommended_action=r.recommended_action,
        )
        for r in sorted(records, key=lambda x: x.risk_score, reverse=True)
    ]


@router.get(
    "/{device_id}",
    response_model=PredictionResponse,
    summary="Get latest prediction for a specific device",
)
def get_prediction_for_device(device_id: str, db: Session = Depends(get_db)):
    record = (
        db.query(PredictionRecord)
        .filter(PredictionRecord.device_id == device_id)
        .order_by(PredictionRecord.timestamp.desc())
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No prediction found for device '{device_id}'. Ensure the simulator is running.",
        )
    return PredictionResponse(
        device_id=record.device_id,
        name=record.device_name,
        risk_score=record.risk_score,
        risk_level=record.risk_level,
        primary_failure_mode=record.primary_failure_mode,
        ettf=record.ettf,
        recommended_action=record.recommended_action,
    )
