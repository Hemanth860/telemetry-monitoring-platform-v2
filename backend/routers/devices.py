"""
Device Fleet Router (/api/devices/*)
------------------------------------
Manages satellite and ground station fleet inventory and anomaly injection.

ARCHITECTURE NOTE:
  The shared sim_service singleton has been REMOVED from this module.
  Previously, devices.py held a global TelemetrySimulatorService instance
  that was imported by alerts.py, telemetry.py, and predictions.py to
  call generate_tick() on every API request.

  The new architecture eliminates that coupling:
  - Telemetry enters through POST /api/telemetry (from the simulator runner).
  - Alert evaluation happens inside the telemetry ingestion endpoint.
  - Predictions are persisted at ingestion time and read from the DB.

  Anomaly injection still works but now targets the standalone simulator
  runner process via the shared anomaly state tracked in this router.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Device
from schemas import DeviceResponse
from auth import get_current_user, require_admin
from models import User

router = APIRouter(prefix="/api/devices", tags=["Devices & Fleet"])

# In-memory anomaly state shared with the simulator runner via this endpoint.
# The simulator runner polls GET /api/devices/anomalies to check for injected faults.
_active_anomalies: dict[str, str] = {}


@router.get(
    "",
    response_model=List[DeviceResponse],
    summary="Get all devices",
    description="Returns the complete device fleet inventory from the database.",
)
def get_devices(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    return devices


@router.get(
    "/anomalies",
    summary="Get active anomaly injections (used by simulator runner)",
    description="Returns the current in-memory anomaly injection map. The simulator runner polls this endpoint.",
)
def get_anomalies():
    """
    The standalone simulator runner polls this endpoint so it can replicate
    injected anomalies in its telemetry generation without direct DB coupling.
    """
    return _active_anomalies


@router.post(
    "/anomaly/inject",
    summary="Inject a fault anomaly into a device (admin only)",
)
def inject_anomaly(
    device_id: str,
    anomaly_type: str = "THERMAL_RUNAWAY",
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device ID not found")

    _active_anomalies[device_id] = anomaly_type
    print(f"[API] Anomaly '{anomaly_type}' injected into {device_id} by {current_user.username}")
    return {
        "status": "success",
        "message": f"Injected {anomaly_type} into {device_id} by {current_user.username}",
    }


@router.post(
    "/anomaly/resolve",
    summary="Resolve an active anomaly injection (admin only)",
)
def resolve_anomaly(
    device_id: str,
    current_user: User = Depends(require_admin),
):
    if device_id in _active_anomalies:
        del _active_anomalies[device_id]
        print(f"[API] Anomaly resolved for {device_id} by {current_user.username}")

    return {
        "status": "success",
        "message": f"Resolved anomaly for {device_id} by {current_user.username}",
    }
