"""
Alert Engine & Incident Router (/api/alerts/*)
-----------------------------------------------
Evaluates operational rules, generates incident logs, and handles alert acknowledgment.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import AlertRecord
from schemas import AlertResponse, AlertResolveRequest
from auth import get_current_user, require_admin, User
from routers.devices import sim_service

router = APIRouter(prefix="/api/alerts", tags=["Alert Engine & Incidents"])


@router.get("", response_model=List[AlertResponse])
def get_alerts(filter_type: Optional[str] = "ACTIVE", db: Session = Depends(get_db)):
    batch = sim_service.generate_tick()

    for item in batch:
        device_id = item["device_id"]
        temp = item["temperature_celsius"]
        signal = item["signal_strength_dbm"]

        if temp > 80.0:
            rule_id = f"ALT-{device_id}-TEMP"
            existing = db.query(AlertRecord).filter(AlertRecord.id == rule_id, AlertRecord.resolved == False).first()
            if not existing:
                db.add(AlertRecord(
                    id=rule_id,
                    device_id=device_id,
                    severity="CRITICAL",
                    category="Thermal",
                    message=f"Thermal Overheat: Core temperature at {temp}°C (Limit: 80°C)",
                    timestamp=datetime.utcnow()
                ))

        if signal < -90.0:
            rule_id = f"ALT-{device_id}-SIG"
            existing = db.query(AlertRecord).filter(AlertRecord.id == rule_id, AlertRecord.resolved == False).first()
            if not existing:
                db.add(AlertRecord(
                    id=rule_id,
                    device_id=device_id,
                    severity="CRITICAL",
                    category="RF Link",
                    message=f"RF Link Degraded: Signal dropped to {signal} dBm (Limit: -90 dBm)",
                    timestamp=datetime.utcnow()
                ))

    db.commit()

    query = db.query(AlertRecord)
    if filter_type == "ACTIVE":
        query = query.filter(AlertRecord.resolved == False)
    elif filter_type == "CRITICAL":
        query = query.filter(AlertRecord.severity == "CRITICAL", AlertRecord.resolved == False)
    elif filter_type == "WARNING":
        query = query.filter(AlertRecord.severity == "WARNING", AlertRecord.resolved == False)

    return query.order_by(AlertRecord.timestamp.desc()).all()


@router.post("/resolve", response_model=AlertResponse)
def resolve_alert(
    req: AlertResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    alert = db.query(AlertRecord).filter(AlertRecord.id == req.alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert ID not found")

    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by = current_user.username

    sim_service.resolve_anomaly(alert.device_id)
    db.commit()
    db.refresh(alert)
    return alert
