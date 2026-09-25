"""
Smart Infrastructure Monitoring Platform v2 - Main FastAPI Application
-----------------------------------------------------------------------
Modular, production-ready FastAPI application connecting REST routers,
SQLite database ORM persistence, JWT authentication, and telemetry simulation.

NEW ARCHITECTURE (v2.1):
  - Telemetry enters ONLY through POST /api/telemetry (from simulator runner).
  - GET /api/telemetry reads from the database — no live simulation tick.
  - Alert evaluation happens inside telemetry ingestion (services/alert_engine.py).
  - Predictions are computed at ingestion and persisted (services/predictor.py).
  - React frontend fetches data only — it generates nothing itself.

Run the backend:
    cd backend
    python -m uvicorn main:app --reload --port 8000

Run the telemetry simulator (separate terminal):
    cd backend
    python simulator_runner.py
"""

import os
import logging
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Smart Infrastructure Monitoring Platform API v2",
    description=(
        "Full-Stack REST API powering orbital telemetry ingestion, SQLite persistence, "
        "JWT authentication, heuristic failure prediction, and alert evaluation.\n\n"
        "**Architecture**: Python Simulator → POST /api/telemetry → FastAPI → "
        "Pydantic Validation → Alert Engine → Prediction Engine → SQLAlchemy → SQLite "
        "→ GET APIs → React Frontend"
    ),
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─────────────────────────────────────────────────────────
# CORS — explicitly allow the React development server.
# Change CORS_ORIGINS in production.
# ─────────────────────────────────────────────────────────
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
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
    On Startup:
    1. Initialises SQLite tables (idempotent — safe on every restart).
    2. Seeds demo Admin & Operator users if not present.
    3. Seeds device fleet inventory if empty.
    4. Pre-populates 50 historical telemetry samples if the table is empty.

    NOTE: Pre-seeding uses TelemetrySimulatorService directly (bypassing the API)
    only on the very first startup when the database is empty.  After that,
    all telemetry enters through POST /api/telemetry from the simulator runner.
    """
    init_db()
    db = SessionLocal()
    try:
        # ── Seed users ────────────────────────────────────────────────────
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(
                username="admin",
                email="admin@telemetry.io",
                hashed_password=hash_password("admin123"),
                role="admin",
            ))
            logger.info("[STARTUP] Admin user seeded")

        if not db.query(User).filter(User.username == "operator").first():
            db.add(User(
                username="operator",
                email="operator@telemetry.io",
                hashed_password=hash_password("operator123"),
                role="operator",
            ))
            logger.info("[STARTUP] Operator user seeded")

        # ── Seed devices ──────────────────────────────────────────────────
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
                    battery=dev["battery"],
                ))
            logger.info(f"[STARTUP] {len(INITIAL_DEVICES)} devices seeded")

        # ── Pre-seed 50 historical telemetry ticks (first-run only) ──────
        if db.query(TelemetryRecord).count() == 0:
            from services.predictor import HeuristicPredictorService
            from models import PredictionRecord, AlertRecord as AR

            sim = TelemetrySimulatorService()
            predictor_svc = HeuristicPredictorService()
            now = datetime.utcnow()

            # Track seeded alert IDs to avoid UNIQUE constraint failures
            seeded_alert_ids: set = set()

            def _seed_alert(alert_id, device_id, severity, category, message, ts):
                if alert_id not in seeded_alert_ids:
                    db.add(AR(id=alert_id, device_id=device_id,
                              severity=severity, category=category,
                              message=message, timestamp=ts))
                    seeded_alert_ids.add(alert_id)

            for step in range(50, 0, -1):
                timestamp = now - timedelta(seconds=step * 2)
                batch = sim.generate_tick()
                for item in batch:
                    item["timestamp"] = timestamp
                    dev_id = item["device_id"]
                    temp   = item["temperature_celsius"]
                    signal = item["signal_strength_dbm"]
                    loss   = item["packet_loss_percent"]

                    db.add(TelemetryRecord(
                        device_id=dev_id, timestamp=timestamp,
                        cpu_percent=item["cpu_percent"], ram_percent=item["ram_percent"],
                        temperature_celsius=temp, signal_strength_dbm=signal,
                        packet_loss_percent=loss, latency_ms=item["latency_ms"],
                        battery_percent=item["battery_percent"], status=item["status"],
                    ))

                    if temp > 80.0:
                        _seed_alert(f"ALT-{dev_id}-TEMP", dev_id, "CRITICAL", "Thermal",
                                    f"Thermal Overheat: {temp}°C", timestamp)
                    elif temp > 68.0:
                        _seed_alert(f"ALT-{dev_id}-TEMP-WARN", dev_id, "WARNING", "Thermal",
                                    f"Elevated Temperature: {temp}°C", timestamp)
                    if signal < -90.0:
                        _seed_alert(f"ALT-{dev_id}-SIG", dev_id, "CRITICAL", "RF Link",
                                    f"RF Link Degraded: {signal} dBm", timestamp)
                    elif signal < -78.0:
                        _seed_alert(f"ALT-{dev_id}-SIG-WARN", dev_id, "WARNING", "RF Link",
                                    f"RF Signal: {signal} dBm", timestamp)
                    if loss > 5.0:
                        _seed_alert(f"ALT-{dev_id}-LOSS", dev_id,
                                    "CRITICAL" if loss > 10 else "WARNING",
                                    "Network", f"Packet Loss: {loss}%", timestamp)

                    pred = predictor_svc.predict_risk(item)
                    db.add(PredictionRecord(
                        device_id=dev_id, device_name=item.get("name", dev_id),
                        timestamp=timestamp, risk_score=pred["risk_score"],
                        risk_level=pred["risk_level"], primary_failure_mode=pred["primary_failure_mode"],
                        ettf=pred["ettf"], recommended_action=pred["recommended_action"],
                    ))

            logger.info("[STARTUP] 50 historical telemetry ticks seeded with alerts & predictions")

        db.commit()
        logger.info("[STARTUP] Database ready")
    finally:
        db.close()


@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "system": "Smart Infrastructure Monitoring Platform v2",
        "architecture": "Python Simulator → POST /api/telemetry → FastAPI → Pydantic → Alert Engine → Prediction Engine → SQLAlchemy → SQLite → GET APIs → React",
        "backend": "FastAPI + SQLite (SQLAlchemy ORM)",
        "frontend": "React.js (Vite) + HTML5 2D Canvas",
        "docs": "http://127.0.0.1:8000/docs",
        "simulator": "python simulator_runner.py  (run from backend/ directory)",
        "demo_accounts": {
            "admin": "admin / admin123",
            "operator": "operator / operator123",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
