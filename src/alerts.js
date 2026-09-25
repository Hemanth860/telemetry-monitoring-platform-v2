/**
 * alerts.js — DEPRECATED
 * -----------------------
 * This file previously contained the frontend AlertEngine class
 * that evaluated alert rules inside the React browser.
 *
 * ARCHITECTURE CHANGE (v2.1):
 * Alert evaluation has been CENTRALISED in the backend.
 * The authoritative alert engine is: backend/services/alert_engine.py
 * It runs on every POST /api/telemetry ingestion and persists results to SQLite.
 * React fetches alerts through GET /api/alerts via src/api.js.
 *
 * Alert rules (preserved in backend):
 *   - temperature_celsius > 80°C  → CRITICAL Thermal
 *   - temperature_celsius > 68°C  → WARNING  Thermal
 *   - signal_strength_dbm < -90   → CRITICAL RF Link
 *   - signal_strength_dbm < -78   → WARNING  RF Link
 *   - packet_loss_percent > 5%    → WARNING/CRITICAL Network
 *
 * This file is kept as a placeholder. It exports nothing.
 * Do NOT re-add alert evaluation logic to this file.
 */

// No exports — alert evaluation is backend-authoritative.
// See: backend/services/alert_engine.py
