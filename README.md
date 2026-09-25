# Smart Infrastructure Monitoring Platform v2 🛰

A real-time telemetry processing, fleet monitoring, alert rule evaluation, and heuristic predictive failure platform for orbital satellite networks and earth ground stations.

Built with **React.js (Vite)**, **HTML5 2D Canvas**, **Python 3**, **FastAPI**, **SQLite**, and **SQLAlchemy ORM**.

---

## 🏗 Architecture Overview

```
Python Telemetry Simulator
        │
        │  HTTP POST /api/telemetry (every 2 seconds)
        ▼
FastAPI Backend (Single Source of Truth)
        │
        ├── Pydantic Validation  (schemas.py)
        ├── Alert Engine         (services/alert_engine.py)
        ├── Heuristic Prediction (services/predictor.py)
        └── SQLAlchemy ORM       (models.py)
                │
                ▼
           SQLite Database
                │
        ┌───────┼───────────┐
        │       │           │
GET /api/telemetry  GET /api/alerts  GET /api/predictions
        │       │           │
        └───────┴───────────┘
                │
                ▼
        React Frontend
   (Visualisation Layer Only)
        │
        ├── Charts (ChartCanvas)
        ├── Fleet Status (FleetGrid)
        ├── Alerts (AlertFeed)
        └── Predictions (PredictionPanel)
```

**React generates NO telemetry. React evaluates NO alert rules. React computes NO predictions.**
All authoritative data originates from the FastAPI backend.

---

## 🚀 Quick Start

### Step 1: Start FastAPI Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Open **`http://127.0.0.1:8000/docs`** for interactive Swagger API documentation.

### Step 2: Start React Frontend

```bash
# From project root
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.

### Step 3: Start Telemetry Simulator

```bash
cd backend
python simulator_runner.py
```

The simulator authenticates with the backend, then POSTs telemetry for all 10 devices every 2 seconds. You should see the React dashboard update live as data flows through the pipeline.

---

## 🔑 Demo Accounts

| Username   | Password     | Role     | Permissions                                   |
|------------|-------------|----------|-----------------------------------------------|
| `admin`    | `admin123`   | Admin    | Read + Inject anomalies + Resolve alerts       |
| `operator` | `operator123`| Operator | Read-only                                     |

---

## 📡 API Endpoints

| Method | Endpoint                              | Description                                        |
|--------|---------------------------------------|----------------------------------------------------|
| POST   | `/api/auth/login`                     | Login — returns JWT token                          |
| POST   | `/api/auth/register`                  | Register new user                                  |
| GET    | `/api/devices`                        | Fleet device inventory                             |
| POST   | `/api/telemetry`                      | **Ingest telemetry** (simulator → backend)         |
| GET    | `/api/telemetry`                      | Latest telemetry per device (from DB)              |
| GET    | `/api/telemetry/history/{device_id}`  | Historical telemetry (default: last 50 samples)    |
| GET    | `/api/alerts`                         | All alerts (filterable: ACTIVE/CRITICAL/WARNING)   |
| GET    | `/api/alerts/{device_id}`             | Alerts for a specific device                       |
| POST   | `/api/alerts/resolve`                 | Resolve an alert (admin only)                      |
| GET    | `/api/predictions`                    | Latest prediction for all devices                  |
| GET    | `/api/predictions/{device_id}`        | Prediction for a specific device                   |
| POST   | `/api/devices/anomaly/inject`         | Inject fault (admin only)                          |
| POST   | `/api/devices/anomaly/resolve`        | Resolve fault (admin only)                         |

**Full interactive documentation:** `http://127.0.0.1:8000/docs`

---

## 🔐 Authentication Flow

```
React Login Form
      │
      │  POST /api/auth/login
      │  { username, password }
      ▼
FastAPI (auth.py)
      │  Hash password → verify → create JWT
      ▼
JWT Access Token
      │
      │  Stored in React state (src/api.js)
      │  Sent as: Authorization: Bearer <token>
      ▼
Protected Endpoints (anomaly inject, alert resolve)
```

---

## 🌡 Alert Rules

Evaluated by `backend/services/alert_engine.py` on every telemetry ingestion:

| Condition                    | Severity   | Category |
|------------------------------|------------|----------|
| `temperature > 80°C`         | CRITICAL   | Thermal  |
| `temperature > 68°C`         | WARNING    | Thermal  |
| `signal < -90 dBm`           | CRITICAL   | RF Link  |
| `signal < -78 dBm`           | WARNING    | RF Link  |
| `packet_loss > 10%`          | CRITICAL   | Network  |
| `packet_loss > 5%`           | WARNING    | Network  |

---

## 📊 Heuristic Prediction Engine

Located in `backend/services/predictor.py`. **NOT a machine-learning model** — this is a weighted heuristic/rule-based engine.

```
Risk Score = 0.4 × Thermal Component
           + 0.4 × RF Component
           + 0.2 × Loss Component
           + Anomaly Boost

Thermal Component = max(0, (temp - 50) × 1.5)
RF Component      = max(0, (|signal| - 65) × 1.8)
Loss Component    = packet_loss × 3.0
Anomaly Boost     = +55 (THERMAL_RUNAWAY) | +60 (SOLAR_FLARE)
```

| Risk Score | Level    | ETTF           |
|------------|----------|----------------|
| > 65       | CRITICAL | < 8 minutes    |
| > 35       | MEDIUM   | ~ 25 minutes   |
| ≤ 35       | LOW      | Stable         |

---

## 📁 Project Structure

```
smart-infrastructure-monitoring/
├── .env                          # VITE_API_BASE_URL config
├── .env.example                  # Example env file
├── index.html                    # Root HTML5 entry point
├── package.json                  # React & Vite dependencies
├── vite.config.js                # Vite configuration
├── README.md                     # This file
├── INTERVIEW_PREP_GUIDE.md       # Interview Q&A guide
├── src/
│   ├── index.css                 # Glassmorphic dark theme
│   ├── main.jsx                  # React mounting entry point
│   ├── App.jsx                   # Polling orchestration layer
│   ├── api.js                    # Centralised API client (NEW)
│   ├── simulator.js              # DEPRECATED (telemetry → backend)
│   ├── alerts.js                 # DEPRECATED (alerts → backend)
│   ├── prediction.js             # DEPRECATED (predictions → backend)
│   └── components/
│       ├── Navbar.jsx            # Header with backend status
│       ├── MetricBanner.jsx      # Overview metrics cards
│       ├── PredictionPanel.jsx   # Risk prediction display
│       ├── ChartCanvas.jsx       # 2D Canvas telemetry chart
│       ├── AlertFeed.jsx         # Live alert stream
│       ├── FleetGrid.jsx         # Node cards & table view
│       ├── LoginModal.jsx        # Real JWT authentication
│       └── ArchModal.jsx         # Architecture guide modal
└── backend/
    ├── requirements.txt          # Python dependencies
    ├── main.py                   # FastAPI app entry point
    ├── database.py               # SQLite / SQLAlchemy session
    ├── models.py                 # ORM models (User, Device, Telemetry, Alert, Prediction)
    ├── schemas.py                # Pydantic validation schemas
    ├── auth.py                   # JWT encoding & RBAC
    ├── simulator_runner.py       # STANDALONE SIMULATOR (NEW) — the telemetry producer
    ├── services/
    │   ├── simulator.py          # TelemetrySimulatorService (physics engine)
    │   ├── predictor.py          # HeuristicPredictorService
    │   └── alert_engine.py       # AlertEngineService (NEW — centralised)
    └── routers/
        ├── auth.py               # POST /api/auth/*
        ├── devices.py            # GET /api/devices/*
        ├── telemetry.py          # POST & GET /api/telemetry/*
        ├── alerts.py             # GET & POST /api/alerts/*
        └── predictions.py        # GET /api/predictions/*
```

---

## ⚙ Environment Variables

### Frontend (`.env`)
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Backend Simulator Runner (environment variables)
```
API_BASE_URL=http://127.0.0.1:8000
SIM_USERNAME=admin
SIM_PASSWORD=admin123
TICK_INTERVAL=2
```

### Backend CORS (environment variable)
```
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

## 🧪 End-to-End Verification

1. Start backend → `http://127.0.0.1:8000/docs` shows Swagger UI
2. Start frontend → `http://localhost:5173` shows dashboard
3. Start simulator → console shows `[SIMULATOR] → SAT-101: HTTP 201`
4. React dashboard updates every 2 seconds with new data
5. Stop simulator → new telemetry stops arriving
6. Stop backend → React shows "Backend Disconnected" banner
7. Login as admin → anomaly inject and alert resolve buttons work
8. Login as operator → resolve/inject show 403 error

---

## 📚 Swagger API Documentation

`http://127.0.0.1:8000/docs` — Interactive Swagger UI
`http://127.0.0.1:8000/redoc` — ReDoc documentation
