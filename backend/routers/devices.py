"""
Device Fleet Router (/api/devices/*)
------------------------------------
Manages satellite and ground station fleet inventory and incident injections.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from schemas import DeviceResponse
from auth import get_current_user, require_admin, User
from services.simulator import TelemetrySimulatorService, INITIAL_DEVICES

router = APIRouter(prefix="/api/devices", tags=["Devices & Fleet"])
sim_service = TelemetrySimulatorService()


@router.get("", response_model=List[DeviceResponse])
def get_devices():
    return sim_service.devices


@router.post("/anomaly/inject")
def inject_anomaly(device_id: str, anomaly_type: str = "THERMAL_RUNAWAY", current_user: User = Depends(require_admin)):
    dev = next((d for d in sim_service.devices if d["id"] == device_id), None)
    if not dev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device ID not found")

    sim_service.inject_anomaly(device_id, anomaly_type)
    return {"status": "success", "message": f"Injected {anomaly_type} into {device_id} by {current_user.username}"}


@router.post("/anomaly/resolve")
def resolve_anomaly(device_id: str, current_user: User = Depends(require_admin)):
    sim_service.resolve_anomaly(device_id)
    return {"status": "success", "message": f"Resolved anomaly for {device_id} by {current_user.username}"}
