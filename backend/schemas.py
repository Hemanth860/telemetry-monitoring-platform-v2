"""
Pydantic Validation Schemas
----------------------------
Defines input request models and output response DTOs for Swagger OpenAPI docs.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "operator"


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class DeviceResponse(BaseModel):
    id: str
    name: str
    type: str
    orbit: Optional[str]
    location: Optional[str]
    band: Optional[str]
    base_cpu: int
    base_temp: float
    base_signal: float
    base_latency: int
    status: str
    battery: int

    class Config:
        from_attributes = True


class TelemetryResponse(BaseModel):
    id: int
    device_id: str
    timestamp: datetime
    cpu_percent: float
    ram_percent: float
    temperature_celsius: float
    signal_strength_dbm: float
    packet_loss_percent: float
    latency_ms: int
    battery_percent: int
    status: str

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: str
    device_id: str
    severity: str
    category: str
    message: str
    timestamp: datetime
    resolved: bool
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    class Config:
        from_attributes = True


class AlertResolveRequest(BaseModel):
    alert_id: str


class PredictionResponse(BaseModel):
    device_id: str
    name: str
    risk_score: int
    risk_level: str
    primary_failure_mode: str
    ettf: str
    recommended_action: str
