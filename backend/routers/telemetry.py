"""
Telemetry Ingestion & History Router (/api/telemetry/*)
--------------------------------------------------------
POST /api/telemetry      — Accepts one telemetry payload from the simulator.
                           Validates → persists → runs alert engine → runs
                           heuristic prediction engine → returns composite response.

GET  /api/telemetry      — Returns the latest telemetry record per device
                           from the database (no more in-request simulation).

GET  /api/telemetry/history/{device_id}
                         — Returns up to `limit` chronologically-ordered
                           historical records for a specific device.

ARCHITECTURE NOTE:
  The old GET /api/telemetry endpoint called sim_service.generate_tick()
  on every request, meaning a fresh tick was generated instead of reading
  stored data.  This has been replaced: GET now reads from the database.
  Telemetry enters the system ONLY through POST /api/telemetry.
"""

import logging
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime

from database import get_db
from models import TelemetryRecord, Device, PredictionRecord
from schemas import TelemetryIngest, TelemetryResponse, TelemetryIngestResponse
from services.alert_engine import AlertEngineService
from services.predictor import HeuristicPredictorService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/telemetry", tags=["Telemetry Stream & Storage"])

_alert_engine = AlertEngineService()
_predictor = HeuristicPredictorService()


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/telemetry  — Ingest one telemetry sample
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=TelemetryIngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a single telemetry sample",
    description=(
        "Receives one telemetry payload from the Python simulator. "
        "Validates the payload, persists it to SQLite, evaluates alert rules, "
        "runs the heuristic prediction engine, and returns a composite response."
    ),
)
def ingest_telemetry(
    payload: TelemetryIngest,
    db: Session = Depends(get_db),
):
    print(f"[API] Received telemetry for {payload.device_id}")

    # ── 1. Validate device exists (optional but recommended) ──────────────
    device = db.query(Device).filter(Device.id == payload.device_id).first()
    device_name = device.name if device else payload.device_id

    # ── 2. Persist telemetry record ───────────────────────────────────────
    record = TelemetryRecord(
        device_id=payload.device_id,
        timestamp=payload.timestamp,
        cpu_percent=payload.cpu_percent,
        ram_percent=payload.ram_percent,
        temperature_celsius=payload.temperature_celsius,
        signal_strength_dbm=payload.signal_strength_dbm,
        packet_loss_percent=payload.packet_loss_percent,
        latency_ms=payload.latency_ms,
        battery_percent=payload.battery_percent,
        status=payload.status,
    )
    db.add(record)
    db.flush()  # flush to get the auto-generated id before commit
    print(f"[DB] Telemetry stored for {payload.device_id} (id={record.id})")

    # ── 3. Evaluate alert rules ───────────────────────────────────────────
    telemetry_dict = payload.model_dump()
    telemetry_dict["name"] = device_name
    alert_records = _alert_engine.evaluate_and_persist(telemetry_dict, db)

    # ── 4. Run heuristic prediction engine ───────────────────────────────
    prediction_dict = _predictor.predict_risk(telemetry_dict)
    print(f"[PREDICTION] {payload.device_id} risk_score={prediction_dict['risk_score']} level={prediction_dict['risk_level']}")

    # ── 5. Persist / upsert latest prediction ────────────────────────────
    pred_record = (
        db.query(PredictionRecord)
        .filter(PredictionRecord.device_id == payload.device_id)
        .order_by(PredictionRecord.timestamp.desc())
        .first()
    )
    if pred_record:
        pred_record.timestamp = datetime.utcnow()
        pred_record.device_name = device_name
        pred_record.risk_score = prediction_dict["risk_score"]
        pred_record.risk_level = prediction_dict["risk_level"]
        pred_record.primary_failure_mode = prediction_dict["primary_failure_mode"]
        pred_record.ettf = prediction_dict["ettf"]
        pred_record.recommended_action = prediction_dict["recommended_action"]
    else:
        db.add(PredictionRecord(
            device_id=payload.device_id,
            device_name=device_name,
            timestamp=datetime.utcnow(),
            risk_score=prediction_dict["risk_score"],
            risk_level=prediction_dict["risk_level"],
            primary_failure_mode=prediction_dict["primary_failure_mode"],
            ettf=prediction_dict["ettf"],
            recommended_action=prediction_dict["recommended_action"],
        ))

    db.commit()
    db.refresh(record)

    # ── 6. Build and return composite response ────────────────────────────
    from schemas import AlertResponse, PredictionResponse  # local import to avoid circular

    alert_responses = [
        AlertResponse.model_validate(a) for a in alert_records
    ]

    return TelemetryIngestResponse(
        telemetry=TelemetryResponse.model_validate(record),
        alerts=alert_responses,
        prediction=PredictionResponse(**prediction_dict),
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/telemetry  — Latest telemetry per device from database
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=List[TelemetryResponse],
    summary="Get latest telemetry per device",
    description="Returns the most recent telemetry record for each known device from the database.",
)
def get_live_telemetry(db: Session = Depends(get_db)):
    """
    Returns the latest stored telemetry record per device.
    Data comes from SQLite — not from a fresh simulation tick.
    """
    # Subquery: max id per device_id (proxy for latest timestamp)
    subq = (
        db.query(func.max(TelemetryRecord.id).label("max_id"))
        .group_by(TelemetryRecord.device_id)
        .subquery()
    )
    records = (
        db.query(TelemetryRecord)
        .filter(TelemetryRecord.id.in_(subq))
        .all()
    )
    return records


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/telemetry/history/{device_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/history/{device_id}",
    response_model=List[TelemetryResponse],
    summary="Get telemetry history for a device",
    description=(
        "Returns up to `limit` chronologically-ordered telemetry records "
        "for the specified device from SQLite. Default limit is 50."
    ),
)
def get_telemetry_history(
    device_id: str,
    limit: int = Query(50, ge=1, le=200, description="Number of records to return (1–200)"),
    db: Session = Depends(get_db),
):
    records = (
        db.query(TelemetryRecord)
        .filter(TelemetryRecord.device_id == device_id)
        .order_by(TelemetryRecord.timestamp.desc())
        .limit(limit)
        .all()
    )
    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No telemetry history found for device '{device_id}'",
        )
    return list(reversed(records))  # chronological order
