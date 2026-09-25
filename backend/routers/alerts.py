"""
Alert Engine & Incident Router (/api/alerts/*)
-----------------------------------------------
GET  /api/alerts              — Returns alerts stored in the database.
GET  /api/alerts/{device_id}  — Returns alerts for a specific device.
POST /api/alerts/resolve      — Resolves an alert (admin only).

ARCHITECTURE NOTE:
  Alert records are created exclusively by the backend alert engine
  (services/alert_engine.py) when telemetry is ingested via POST /api/telemetry.
  This router ONLY reads and manages existing alert records — it no longer
  calls sim_service.generate_tick() to create telemetry-on-demand.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import AlertRecord
from schemas import AlertResponse, AlertResolveRequest
from auth import get_current_user, require_admin
from models import User

router = APIRouter(prefix="/api/alerts", tags=["Alert Engine & Incidents"])


@router.get(
    "",
    response_model=List[AlertResponse],
    summary="Get all alerts",
    description=(
        "Returns alerts from the database. "
        "filter_type: ACTIVE (default) | CRITICAL | WARNING | ALL"
    ),
)
def get_alerts(
    filter_type: Optional[str] = "ACTIVE",
    db: Session = Depends(get_db),
):
    """
    Read alert records from the database.
    Alerts are created by the backend alert engine on telemetry ingestion.
    """
    query = db.query(AlertRecord)

    if filter_type == "ACTIVE":
        query = query.filter(AlertRecord.resolved == False)  # noqa: E712
    elif filter_type == "CRITICAL":
        query = query.filter(AlertRecord.severity == "CRITICAL", AlertRecord.resolved == False)  # noqa: E712
    elif filter_type == "WARNING":
        query = query.filter(AlertRecord.severity == "WARNING", AlertRecord.resolved == False)  # noqa: E712
    # "ALL" → no additional filter

    return query.order_by(AlertRecord.timestamp.desc()).all()


@router.get(
    "/{device_id}",
    response_model=List[AlertResponse],
    summary="Get alerts for a specific device",
)
def get_alerts_for_device(
    device_id: str,
    filter_type: Optional[str] = "ACTIVE",
    db: Session = Depends(get_db),
):
    query = db.query(AlertRecord).filter(AlertRecord.device_id == device_id)

    if filter_type == "ACTIVE":
        query = query.filter(AlertRecord.resolved == False)  # noqa: E712
    elif filter_type == "CRITICAL":
        query = query.filter(AlertRecord.severity == "CRITICAL", AlertRecord.resolved == False)  # noqa: E712
    elif filter_type == "WARNING":
        query = query.filter(AlertRecord.severity == "WARNING", AlertRecord.resolved == False)  # noqa: E712

    return query.order_by(AlertRecord.timestamp.desc()).all()


@router.post(
    "/resolve",
    response_model=AlertResponse,
    summary="Resolve an alert (admin only)",
)
def resolve_alert(
    req: AlertResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    alert = db.query(AlertRecord).filter(AlertRecord.id == req.alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert ID not found")

    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by = current_user.username

    db.commit()
    db.refresh(alert)
    print(f"[ALERT] Alert {req.alert_id} resolved by {current_user.username}")
    return alert
