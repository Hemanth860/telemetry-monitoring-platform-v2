"""
Telemetry Ingestion Router (/api/telemetry/*)
----------------------------------------------
Ingests real-time telemetry batches and persists records to SQLite telemetry_logs table.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import TelemetryRecord
from schemas import TelemetryResponse
from routers.devices import sim_service

router = APIRouter(prefix="/api/telemetry", tags=["Telemetry Stream & Storage"])


@router.get("", response_model=List[TelemetryResponse])
def get_live_telemetry(db: Session = Depends(get_db)):
    batch = sim_service.generate_tick()
    db_records = []

    for item in batch:
        record = TelemetryRecord(
            device_id=item["device_id"],
            timestamp=item["timestamp"],
            cpu_percent=item["cpu_percent"],
            ram_percent=item["ram_percent"],
            temperature_celsius=item["temperature_celsius"],
            signal_strength_dbm=item["signal_strength_dbm"],
            packet_loss_percent=item["packet_loss_percent"],
            latency_ms=item["latency_ms"],
            battery_percent=item["battery_percent"],
            status=item["status"]
        )
        db.add(record)
        db_records.append(record)

    db.commit()
    for r in db_records:
        db.refresh(r)

    return db_records


@router.get("/history/{device_id}", response_model=List[TelemetryResponse])
def get_telemetry_history(
    device_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    records = db.query(TelemetryRecord)\
        .filter(TelemetryRecord.device_id == device_id)\
        .order_by(TelemetryRecord.timestamp.desc())\
        .limit(limit)\
        .all()
    
    return list(reversed(records))
