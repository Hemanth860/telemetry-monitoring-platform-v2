"""
Smart Infrastructure Monitoring Platform v2 - Main FastAPI Application
-----------------------------------------------------------------------
Modular, production-ready FastAPI application connecting REST routers,
SQLite database ORM persistence, JWT authentication, and telemetry simulation.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, SessionLocal
from models import User, Device, TelemetryRecord
from auth import hash_password
from services.simulator import INITIAL_DEVICES, TelemetrySimulatorService
from datetime import datetime, timedelta

# Import Routers
from routers.auth import router as auth_router
from routers.devices import router as devices_router
from routers.telemetry import router as telemetry_router
from routers.alerts import router as alerts_router
from routers.predictions import router as predictions_router

app = FastAPI(
    title="Smart Infrastructure Monitoring Platform API v2",
    description="Full-Stack REST API powering orbital telemetry ingestion, SQLite persistence, JWT authentication, and predictive failure analysis.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(devices_router)
app.include_router(telemetry_router)
app.include_router(alerts_router)
app.include_router(predictions_router)


@app.on_event("startup")
def startup_event():
    """
    On Startup: Initializes SQLite tables, seeds initial Admin & Operator users,
    and pre-populates 50 historical telemetry samples into telemetry.db.
    """
    init_db()
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(
                username="admin",
                email="admin@telemetry.io",
                hashed_password=hash_password("admin123"),
                role="admin"
            ))

        if not db.query(User).filter(User.username == "operator").first():
            db.add(User(
                username="operator",
                email="operator@telemetry.io",
                hashed_password=hash_password("operator123"),
                role="operator"
            ))

        if db.query(Device).count() == 0:
            for dev in INITIAL_DEVICES:
                db.add(Device(
                    id=dev["id"],
                    name=dev["name"],
                    type=dev["type"],
                    orbit=dev["orbit"],
                    location=dev["location"],
                    band=dev["band"],
                    base_cpu=dev["base_cpu"],
                    base_temp=dev["base_temp"],
                    base_signal=dev["base_signal"],
                    base_latency=dev["base_latency"],
                    battery=dev["battery"]
                ))

        # Pre-seed 50 historical telemetry ticks if logs are empty
        if db.query(TelemetryRecord).count() == 0:
            sim = TelemetrySimulatorService()
            now = datetime.utcnow()
            for step in range(50, 0, -1):
                timestamp = now - timedelta(seconds=step * 2)
                batch = sim.generate_tick()
                for item in batch:
                    db.add(TelemetryRecord(
                        device_id=item["device_id"],
                        timestamp=timestamp,
                        cpu_percent=item["cpu_percent"],
                        ram_percent=item["ram_percent"],
                        temperature_celsius=item["temperature_celsius"],
                        signal_strength_dbm=item["signal_strength_dbm"],
                        packet_loss_percent=item["packet_loss_percent"],
                        latency_ms=item["latency_ms"],
                        battery_percent=item["battery_percent"],
                        status=item["status"]
                    ))

        db.commit()
    finally:
        db.close()


@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "system": "Smart Infrastructure Monitoring Platform v2",
        "backend": "FastAPI + SQLite (SQLAlchemy ORM)",
        "frontend": "React.js (Vite) + HTML5 2D Canvas",
        "docs": "http://127.0.0.1:8000/docs",
        "demo_accounts": {
            "admin": "admin / admin123",
            "operator": "operator / operator123"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
