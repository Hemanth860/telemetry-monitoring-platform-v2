/**
 * simulator.js — DEPRECATED
 * --------------------------
 * This file previously contained the frontend TelemetrySimulator class
 * that generated authoritative telemetry data inside the React browser.
 *
 * ARCHITECTURE CHANGE (v2.1):
 * The frontend no longer generates telemetry.
 * The Python simulator (backend/simulator_runner.py) is the sole telemetry producer.
 * It POSTs data to POST /api/telemetry, which is processed and stored by FastAPI.
 * React fetches stored data through GET APIs via src/api.js.
 *
 * This file is kept as a placeholder to avoid broken imports during migration.
 * It exports nothing and should not be imported by any component.
 *
 * To generate telemetry: run  python simulator_runner.py  (from backend/ directory)
 */

// No exports — this module is intentionally empty.
// All telemetry generation has moved to backend/simulator_runner.py
