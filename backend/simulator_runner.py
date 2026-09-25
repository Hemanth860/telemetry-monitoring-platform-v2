"""
Telemetry Simulator Runner
---------------------------
Standalone process that generates physics-correlated telemetry for all
10 orbital devices and POSTs each sample to POST /api/telemetry.

This is the authoritative telemetry producer.
React frontend does NOT generate telemetry.

Usage (run from the backend/ directory):
    python simulator_runner.py

Environment variables:
    API_BASE_URL   — FastAPI base URL (default: http://127.0.0.1:8000)
    SIM_USERNAME   — Simulator login username (default: admin)
    SIM_PASSWORD   — Simulator login password (default: admin123)
    TICK_INTERVAL  — Seconds between ticks (default: 2)

The simulator:
  1. Authenticates with the backend (JWT).
  2. Fetches active anomaly injections from GET /api/devices/anomalies.
  3. Generates one telemetry tick for all devices.
  4. POSTs each telemetry record to POST /api/telemetry.
  5. Logs the response status.
  6. Waits TICK_INTERVAL seconds.
  7. Repeats until Ctrl+C.
"""

import os
import sys
import time
import json
import datetime
import urllib.request
import urllib.error
import urllib.parse

# ─────────────────────────────────────────────────────────
# Configuration (override via environment variables)
# ─────────────────────────────────────────────────────────
API_BASE_URL  = os.getenv("API_BASE_URL",  "http://127.0.0.1:8000")
SIM_USERNAME  = os.getenv("SIM_USERNAME",  "admin")
SIM_PASSWORD  = os.getenv("SIM_PASSWORD",  "admin123")
TICK_INTERVAL = float(os.getenv("TICK_INTERVAL", "2"))

# ─────────────────────────────────────────────────────────
# Add backend directory to path so we can import the service
# ─────────────────────────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from services.simulator import TelemetrySimulatorService  # noqa: E402


# ─────────────────────────────────────────────────────────
# Minimal HTTP helpers (stdlib only — no requests dependency)
# ─────────────────────────────────────────────────────────

def _post_json(url: str, payload: dict, token: str | None = None) -> tuple[int, dict]:
    data = json.dumps(payload, default=str).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = {}
        try:
            body = json.loads(e.read())
        except Exception:
            pass
        return e.code, body
    except Exception as exc:
        return 0, {"error": str(exc)}


def _get_json(url: str, token: str | None = None) -> tuple[int, dict | list]:
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, {}
    except Exception as exc:
        return 0, {"error": str(exc)}


# ─────────────────────────────────────────────────────────
# Authentication
# ─────────────────────────────────────────────────────────

def authenticate() -> str | None:
    """Login and return the JWT access token, or None on failure."""
    print(f"[SIMULATOR] Authenticating as '{SIM_USERNAME}' at {API_BASE_URL} ...")
    status_code, body = _post_json(
        f"{API_BASE_URL}/api/auth/login",
        {"username": SIM_USERNAME, "password": SIM_PASSWORD},
    )
    if status_code == 200 and "access_token" in body:
        print(f"[SIMULATOR] Authenticated successfully (role={body.get('user', {}).get('role', '?')})")
        return body["access_token"]
    else:
        print(f"[SIMULATOR] Authentication FAILED: HTTP {status_code} - {body}")
        return None


# ---------------------------------------------------------
# Main simulator loop
# ---------------------------------------------------------

def run():
    sim = TelemetrySimulatorService()
    token = None

    # Authenticate on startup
    token = authenticate()
    if not token:
        print("[SIMULATOR] Cannot start without authentication. Is the backend running?")
        print(f"[SIMULATOR] Expected backend at: {API_BASE_URL}")
        sys.exit(1)

    print(f"[SIMULATOR] Starting telemetry loop (interval={TICK_INTERVAL}s, devices={len(sim.devices)})")
    print("[SIMULATOR] Press Ctrl+C to stop.")
    print()

    tick_count = 0

    while True:
        tick_count += 1
        print(f"[SIMULATOR] -- Tick #{tick_count} -------------------------------------------")

        # Fetch active anomaly injections from backend
        _, anomalies = _get_json(f"{API_BASE_URL}/api/devices/anomalies", token)
        if isinstance(anomalies, dict):
            sim.anomalies = anomalies
        else:
            sim.anomalies = {}

        # Generate telemetry tick
        batch = sim.generate_tick()

        # POST each device's telemetry to the backend
        success_count = 0
        for item in batch:
            payload = {
                "device_id":           item["device_id"],
                "timestamp":           item["timestamp"].isoformat(),
                "cpu_percent":         item["cpu_percent"],
                "ram_percent":         item["ram_percent"],
                "temperature_celsius": item["temperature_celsius"],
                "signal_strength_dbm": item["signal_strength_dbm"],
                "packet_loss_percent": item["packet_loss_percent"],
                "latency_ms":          item["latency_ms"],
                "battery_percent":     item["battery_percent"],
                "status":              item["status"],
            }

            print(f"[SIMULATOR] Sending telemetry for {item['device_id']} "
                  f"(temp={item['temperature_celsius']}C, "
                  f"signal={item['signal_strength_dbm']}dBm, "
                  f"loss={item['packet_loss_percent']}%)")

            status_code, response = _post_json(
                f"{API_BASE_URL}/api/telemetry",
                payload,
                token,
            )

            if status_code == 201:
                alert_count = len(response.get("alerts", []))
                risk = response.get("prediction", {}).get("risk_score", "?")
                print(f"[SIMULATOR] -> {item['device_id']}: HTTP {status_code} | alerts={alert_count} | risk={risk}%")
                success_count += 1
            elif status_code == 401:
                print("[SIMULATOR] Token expired -- re-authenticating ...")
                token = authenticate()
                if not token:
                    print("[SIMULATOR] Re-authentication FAILED. Stopping.")
                    sys.exit(1)
            elif status_code == 422:
                print(f"[SIMULATOR] VALIDATION ERROR for {item['device_id']}: {response}")
            elif status_code == 0:
                print(f"[SIMULATOR] BACKEND UNREACHABLE for {item['device_id']}: {response}")
            else:
                print(f"[SIMULATOR] ERROR HTTP {status_code} for {item['device_id']}: {response}")

        print(f"[SIMULATOR] Tick #{tick_count} complete -- {success_count}/{len(batch)} posted successfully")
        print()

        time.sleep(TICK_INTERVAL)


if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        print()
        print("[SIMULATOR] Stopped by user (Ctrl+C). Telemetry generation halted.")

