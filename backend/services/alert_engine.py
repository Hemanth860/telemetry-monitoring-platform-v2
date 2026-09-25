"""
Alert Engine Service
---------------------
Centralised, backend-authoritative alert evaluation.
Called from the telemetry ingestion endpoint (POST /api/telemetry).

Alert rules preserved from the original README specification:
  - temperature_celsius > 80 °C  → CRITICAL  Thermal
  - temperature_celsius > 68 °C  → WARNING   Thermal
  - signal_strength_dbm < -90    → CRITICAL  RF Link
  - signal_strength_dbm < -78    → WARNING   RF Link
  - packet_loss_percent > 5 %    → WARNING / CRITICAL  Network

The frontend MUST NOT run its own alert engine.
This service is the single authoritative alert evaluator.
"""

from datetime import datetime
from sqlalchemy.orm import Session
from models import AlertRecord


class AlertEngineService:
    """
    Stateless alert evaluator.  Evaluates one telemetry dict and persists
    any triggered alerts to the database.  Returns the list of new/updated
    AlertRecord ORM objects that were touched.
    """

    def evaluate_and_persist(self, telemetry: dict, db: Session) -> list[AlertRecord]:
        """
        Evaluate alert rules against a telemetry dict and persist results.

        Args:
            telemetry: dict with keys matching TelemetryIngest fields.
            db:        SQLAlchemy database session.

        Returns:
            List of AlertRecord objects that were added or updated.
        """
        device_id = telemetry["device_id"]
        temp = telemetry["temperature_celsius"]
        signal = telemetry["signal_strength_dbm"]
        loss = telemetry["packet_loss_percent"]
        ts = telemetry.get("timestamp", datetime.utcnow())
        if not isinstance(ts, datetime):
            ts = datetime.utcnow()

        touched: list[AlertRecord] = []

        # ── Thermal alert rules ──────────────────────────────────────────────
        if temp > 80.0:
            alert = self._upsert_alert(
                db=db,
                alert_id=f"ALT-{device_id}-TEMP",
                device_id=device_id,
                severity="CRITICAL",
                category="Thermal",
                message=f"Thermal Overheat: Core temperature at {temp}°C (Limit: 80°C)",
                timestamp=ts,
            )
            touched.append(alert)
            print(f"[ALERT] CRITICAL Thermal alert for {device_id}: {temp}°C")
        elif temp > 68.0:
            alert = self._upsert_alert(
                db=db,
                alert_id=f"ALT-{device_id}-TEMP-WARN",
                device_id=device_id,
                severity="WARNING",
                category="Thermal",
                message=f"Elevated Temperature: Core temperature at {temp}°C",
                timestamp=ts,
            )
            touched.append(alert)

        # ── RF signal alert rules ────────────────────────────────────────────
        if signal < -90.0:
            alert = self._upsert_alert(
                db=db,
                alert_id=f"ALT-{device_id}-SIG",
                device_id=device_id,
                severity="CRITICAL",
                category="RF Link",
                message=f"RF Link Degraded: Signal dropped to {signal} dBm (Limit: -90 dBm)",
                timestamp=ts,
            )
            touched.append(alert)
            print(f"[ALERT] CRITICAL RF alert for {device_id}: {signal} dBm")
        elif signal < -78.0:
            alert = self._upsert_alert(
                db=db,
                alert_id=f"ALT-{device_id}-SIG-WARN",
                device_id=device_id,
                severity="WARNING",
                category="RF Link",
                message=f"RF Signal Degradation: Signal at {signal} dBm",
                timestamp=ts,
            )
            touched.append(alert)

        # ── Packet loss alert rules ──────────────────────────────────────────
        if loss > 5.0:
            severity = "CRITICAL" if loss > 10.0 else "WARNING"
            alert = self._upsert_alert(
                db=db,
                alert_id=f"ALT-{device_id}-LOSS",
                device_id=device_id,
                severity=severity,
                category="Network",
                message=f"Packet Loss Spike: Transmission loss at {loss}%",
                timestamp=ts,
            )
            touched.append(alert)
            print(f"[ALERT] {severity} Packet Loss alert for {device_id}: {loss}%")

        return touched

    # ────────────────────────────────────────────────────────────────────────
    # Internal helpers
    # ────────────────────────────────────────────────────────────────────────

    def _upsert_alert(
        self,
        db: Session,
        alert_id: str,
        device_id: str,
        severity: str,
        category: str,
        message: str,
        timestamp: datetime,
    ) -> AlertRecord:
        """
        Insert a new alert or refresh the timestamp of an existing active one.
        """
        existing = (
            db.query(AlertRecord)
            .filter(AlertRecord.id == alert_id, AlertRecord.resolved == False)  # noqa: E712
            .first()
        )
        if existing:
            existing.message = message
            existing.timestamp = timestamp
            return existing

        record = AlertRecord(
            id=alert_id,
            device_id=device_id,
            severity=severity,
            category=category,
            message=message,
            timestamp=timestamp,
        )
        db.add(record)
        return record
