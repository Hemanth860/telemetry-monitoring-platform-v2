"""
SQLAlchemy ORM Data Models
---------------------------
Defines database table schemas for Users, Devices, Telemetry Logs, and Alerts.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="operator")  # 'admin' or 'operator'
    created_at = Column(DateTime, default=datetime.utcnow)


class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    orbit = Column(String)
    location = Column(String)
    band = Column(String)
    base_cpu = Column(Integer, default=40)
    base_temp = Column(Float, default=50.0)
    base_signal = Column(Float, default=-60.0)
    base_latency = Column(Integer, default=100)
    status = Column(String, default="HEALTHY")
    battery = Column(Integer, default=100)


class TelemetryRecord(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    cpu_percent = Column(Float, nullable=False)
    ram_percent = Column(Float, nullable=False)
    temperature_celsius = Column(Float, nullable=False)
    signal_strength_dbm = Column(Float, nullable=False)
    packet_loss_percent = Column(Float, nullable=False)
    latency_ms = Column(Integer, nullable=False)
    battery_percent = Column(Integer, default=100)
    status = Column(String, nullable=False)


class AlertRecord(Base):
    __tablename__ = "alert_logs"

    id = Column(String, primary_key=True, index=True)
    device_id = Column(String, index=True, nullable=False)
    severity = Column(String, nullable=False)
    category = Column(String, nullable=False)
    message = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String, nullable=True)
