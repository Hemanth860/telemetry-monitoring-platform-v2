"""
Pydantic Validation Schemas
----------------------------
Defines input request models and output response DTOs for Swagger OpenAPI docs.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


# ─────────────────────────────────────────────────────────
# Auth schemas
# ─────────────────────────────────────────────────────────

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

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


# ─────────────────────────────────────────────────────────
# Device schemas
# ─────────────────────────────────────────────────────────

class DeviceResponse(BaseModel):
    id: str
    name: str
    type: str
    orbit: Optional[str] = None
    location: Optional[str] = None
    band: Optional[str] = None
    base_cpu: int
    base_temp: float
    base_signal: float
    base_latency: int
    status: str
    battery: int

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────
# Telemetry schemas
# ─────────────────────────────────────────────────────────

class TelemetryIngest(BaseModel):
    """
    Pydantic schema for POST /api/telemetry.
    Used by the Python simulator to push telemetry into the backend.
    All fields are validated; invalid payloads return HTTP 422.
    """
    device_id: str = Field(..., min_length=1, max_length=32, description="Unique device identifier, e.g. SAT-101")
    timestamp: datetime = Field(..., description="UTC ISO-8601 timestamp of measurement")
    cpu_percent: float = Field(..., ge=0.0, le=100.0, description="CPU utilisation 0–100 %")
    ram_percent: float = Field(..., ge=0.0, le=100.0, description="RAM utilisation 0–100 %")
    temperature_celsius: float = Field(..., ge=-50.0, le=150.0, description="Core temperature in °C")
    signal_strength_dbm: float = Field(..., ge=-120.0, le=0.0, description="RF signal strength in dBm (negative)")
    packet_loss_percent: float = Field(..., ge=0.0, le=100.0, description="Packet loss percentage 0–100 %")
    latency_ms: int = Field(..., ge=0, le=60000, description="Network latency in milliseconds")
    battery_percent: int = Field(100, ge=0, le=100, description="Battery charge percentage 0–100 %")
    status: str = Field(..., description="Operational status: HEALTHY | WARNING | CRITICAL")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"HEALTHY", "WARNING", "CRITICAL"}
        if v.upper() not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v.upper()

    @field_validator("device_id")
    @classmethod
    def validate_device_id(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("device_id must not be empty")
        return v


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

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────
# Alert schemas
# ─────────────────────────────────────────────────────────

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

    model_config = {"from_attributes": True}


class AlertResolveRequest(BaseModel):
    alert_id: str


# ─────────────────────────────────────────────────────────
# Prediction schemas
# ─────────────────────────────────────────────────────────

class PredictionResponse(BaseModel):
    device_id: str
    name: str
    risk_score: int
    risk_level: str
    primary_failure_mode: str
    ettf: str
    recommended_action: str


# ─────────────────────────────────────────────────────────
# Telemetry ingestion composite response
# ─────────────────────────────────────────────────────────

class TelemetryIngestResponse(BaseModel):
    """
    Response returned from POST /api/telemetry.
    Contains the stored telemetry record, any generated alerts, and the prediction.
    """
    telemetry: TelemetryResponse
    alerts: List[AlertResponse]
    prediction: PredictionResponse
