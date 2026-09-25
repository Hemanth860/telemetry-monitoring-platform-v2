# Interview Preparation Guide — Smart Infrastructure Monitoring Platform v2

---

## Q1: What is the overall data flow in your project?

**Answer:**

"The telemetry simulator (`backend/simulator_runner.py`) generates physics-correlated telemetry for 10 orbital devices and sends it to the FastAPI backend through `HTTP POST /api/telemetry` every 2 seconds. FastAPI validates the incoming payload using Pydantic schemas, runs the alert evaluation engine and the heuristic predictive failure engine, and persists the telemetry, alerts, and predictions using SQLAlchemy into a SQLite database. The React frontend does not generate any telemetry — it periodically fetches processed data from the backend REST APIs every 2 seconds and visualises telemetry history, fleet status, alerts, and predictions."

---

## Q2: Why is the backend the single source of truth?

**Answer:**

"In the original architecture, both React and the backend contained duplicate telemetry simulation, alert evaluation, and prediction logic. This meant the React dashboard was showing its own internally generated data that was never actually stored in the database. In the new architecture, FastAPI is the central processing layer. Only one telemetry pipeline exists: the Python simulator → HTTP POST → FastAPI → SQLite. React is purely a visualisation client that fetches and renders backend state. This eliminates data inconsistency, makes the system testable, and means stopping the simulator actually stops new data from appearing — which is the correct behaviour."

---

## Q3: How does JWT authentication work?

**Answer:**

"When a user clicks 'Login', the React `LoginModal` sends `POST /api/auth/login` with username and password. FastAPI hashes the password using SHA-256 with a salt, verifies it against the stored hash, and if valid, encodes a JWT token using HS256 with a 24-hour expiry. The token is returned to React, stored in module-level state in `src/api.js`, and included as an `Authorization: Bearer <token>` header in all subsequent API requests. Certain endpoints require the admin role — for example, `POST /api/alerts/resolve` and `POST /api/devices/anomaly/inject`. These endpoints use the `require_admin` FastAPI dependency which decodes the JWT and verifies the role claim."

---

## Q4: How does Pydantic validation work in your telemetry ingestion?

**Answer:**

"The `TelemetryIngest` Pydantic schema in `schemas.py` defines all required fields with type annotations and validators: `cpu_percent` must be a float between 0 and 100, `temperature_celsius` between -50 and 150, `signal_strength_dbm` between -120 and 0 (negative dBm), `latency_ms` is a non-negative integer, `status` must be one of HEALTHY/WARNING/CRITICAL. If any field fails validation, FastAPI automatically returns an HTTP 422 response with a detailed error breakdown — the record is never inserted into SQLite. This prevents malformed data from polluting the database."

---

## Q5: How does the alert engine work?

**Answer:**

"The alert engine lives in `backend/services/alert_engine.py` and is called synchronously inside `POST /api/telemetry` on every ingestion. It evaluates three categories of rules against the incoming telemetry: Thermal (temperature > 80°C → CRITICAL, > 68°C → WARNING), RF Link (signal < -90 dBm → CRITICAL, < -78 dBm → WARNING), and Network (packet_loss > 10% → CRITICAL, > 5% → WARNING). For each triggered rule, it upserts an `AlertRecord` into SQLite — if an active alert for that device/rule already exists, it refreshes the timestamp and message rather than creating a duplicate. The `POST /api/telemetry` response includes the generated alerts alongside the telemetry record and prediction."

---

## Q6: How does the prediction engine work?

**Answer:**

"The prediction engine in `backend/services/predictor.py` is a heuristic, rule-based engine — not a machine learning model. For each telemetry sample, it computes three weighted components: a thermal component (temperature above 50°C baseline multiplied by 1.5), an RF component (signal degradation below -65 dBm multiplied by 1.8), and a loss component (packet loss multiplied by 3.0). These are combined as 40% thermal + 40% RF + 20% loss, with deterministic boosts added for injected anomalies (THERMAL_RUNAWAY adds 55 points, SOLAR_FLARE adds 60 points). The resulting risk score (0–99) determines the risk level (LOW/MEDIUM/CRITICAL), estimated time to failure, and recommended mitigation action. The prediction is persisted to SQLite and served through `GET /api/predictions`."

---

## Q7: How does React poll the backend?

**Answer:**

"In `App.jsx`, a single `useEffect` creates an `AbortController` and immediately calls `pollBackend()`, then sets an interval to call it every 2 seconds. The `pollBackend` function makes four parallel `fetch` calls using `Promise.all`: to `/api/devices`, `/api/telemetry`, `/api/alerts`, and `/api/predictions`. It merges the latest telemetry fields into the device records for the `FleetGrid` display. When the component unmounts, the cleanup function calls `controller.abort()` (which cancels any in-flight requests) and `clearInterval()` (which stops the polling). This prevents memory leaks. If the backend is unavailable, the `AbortError` is ignored but other errors set `backendOnline=false`, which shows a 'Backend Disconnected' warning banner while preserving the last valid UI state."

---

## Q8: How does telemetry end up in SQLite?

**Answer:**

"The Python simulator calls `POST /api/telemetry` with a JSON payload. FastAPI's Pydantic schema validates the request. Inside the endpoint, a `TelemetryRecord` ORM object is constructed and added to the SQLAlchemy session. The alert engine and prediction engine are called, adding their own records to the session. Finally, `db.commit()` writes all three records atomically to SQLite. The `TelemetryRecord` table (`telemetry_logs`) has columns for device_id, timestamp, cpu_percent, ram_percent, temperature_celsius, signal_strength_dbm, packet_loss_percent, latency_ms, battery_percent, and status."

---

## Q9: What happens when the simulator is stopped?

**Answer:**

"When the simulator stops, no new `POST /api/telemetry` requests are made. The React frontend continues polling the GET APIs every 2 seconds, but `GET /api/telemetry` only returns the last stored record per device — which doesn't change. So the dashboard shows the last known data with a stale timestamp. The simulator stopping is immediately observable from the simulator console output and from the lack of new database rows in SQLite."

---

## Q10: What happens when the backend is stopped?

**Answer:**

"The React frontend's `pollBackend()` function catches the network error and sets `backendOnline=false`. This causes the Navbar to show a red dot with 'Backend Disconnected', and a warning banner appears below the header explaining that the backend is unreachable. The last valid data remains visible on the dashboard — the state is preserved, not cleared. When the backend comes back online, the next successful poll restores `backendOnline=true` and the banner disappears automatically."

---

## Q11: What is the difference between the old and new architecture?

**Answer:**

| Concern               | Old Architecture (v2.0)                          | New Architecture (v2.1)                                |
|-----------------------|--------------------------------------------------|--------------------------------------------------------|
| Telemetry production  | `TelemetrySimulator` class inside React browser  | `simulator_runner.py` → HTTP POST → FastAPI            |
| Alert evaluation      | `AlertEngine` class inside React browser         | `services/alert_engine.py` in FastAPI, persisted to DB |
| Failure prediction    | `FailurePredictor` class inside React browser    | `services/predictor.py` in FastAPI, persisted to DB    |
| Chart data source     | In-memory device history in React state          | SQLite via `GET /api/telemetry/history/{device_id}`    |
| Alert data source     | In-memory alerts array in React state            | SQLite via `GET /api/alerts`                           |
| Prediction data source| Computed from React device state every render    | SQLite via `GET /api/predictions`                      |
| GET /api/telemetry    | Called `generate_tick()` on every request        | Reads latest records from SQLite                       |
| GET /api/alerts       | Called `generate_tick()` on every request        | Reads from `alert_logs` table                          |
| GET /api/predictions  | Called `generate_tick()` on every request        | Reads from `prediction_logs` table                     |
| LoginModal            | Fake — accepted any username without verifying   | Real — calls `POST /api/auth/login`, JWT validated     |

---

## Q12: What design patterns did you use?

**Answer:**

- **Repository Pattern**: Database access is confined to SQLAlchemy ORM in router endpoints and service functions.
- **Service Layer Pattern**: Business logic (alert evaluation, prediction scoring) lives in `services/` modules, not in routers.
- **Thin Controllers**: FastAPI routers are thin — they delegate to service functions and transform responses.
- **Centralised HTTP Client**: All React API calls go through `src/api.js`, which manages the auth token and error handling in one place.
- **AbortController Pattern**: React polling uses AbortController to prevent stale data races and memory leaks on unmount.
- **Composite Response Pattern**: `POST /api/telemetry` returns `{telemetry, alerts, prediction}` in a single response.

---

## Q13: What are the alert thresholds and why?

**Answer:**

"The thresholds match real-world satellite operational limits:
- Temperature > 80°C is CRITICAL because satellite electronics typically have a maximum operating temperature around 80-85°C. > 68°C is a WARNING (elevated thermal drift) to allow preventive action before reaching critical.
- RF signal < -90 dBm is CRITICAL because at that level, the link margin is insufficient and packet loss increases exponentially (modelled by the formula `loss = 0.1 + (|signal| - 85)^1.4 × 0.5`).
- Packet loss > 5% is WARNING and > 10% is CRITICAL because TCP performance degrades significantly above 1% loss and becomes unusable above 10%."

---

## Q14: How is the system observable / debuggable?

**Answer:**

- **FastAPI Swagger UI** at `/docs` lets you manually test every endpoint.
- **Backend console logging**: `[API]`, `[DB]`, `[ALERT]`, `[PREDICTION]` prefixed log lines trace each ingestion.
- **Simulator console logging**: `[SIMULATOR]` prefixed lines show each tick, HTTP status code, alert count, and risk score.
- **SQLite database** can be inspected directly with any SQLite browser (e.g., `sqlite3 telemetry.db`).
- **React console**: warnings for API errors (no data spam on every render).
- **React UI**: backend disconnected banner, empty-state messages per component.

---

## Q15: What would you improve with more time?

**Answer:**

1. Replace polling with **WebSockets** (`FastAPI WebSocket` + React `useWebSocket`) for true real-time push.
2. Add proper **rate limiting** on `POST /api/telemetry` to prevent simulator flooding.
3. Replace SHA-256 password hashing with **bcrypt** (more secure, already in requirements as `passlib[bcrypt]`).
4. Add **device-level telemetry retention limits** (e.g., keep only last 1000 records per device, delete older ones).
5. Add a proper **ML model** (e.g., LSTM/ARIMA) for time-series anomaly detection to replace the heuristic predictor.
6. **Kubernetes deployment** with separate services for the simulator, backend, and frontend.
