# Smart Infrastructure Monitoring Platform v2 🛰️⚡

A real-time telemetry processing, fleet monitoring, alert rule evaluation, and AI predictive failure platform for orbital satellite networks and earth ground stations.

Built with **React.js (Vite)**, **HTML5 2D Canvas**, **Python 3**, **FastAPI**, **SQLite**, and **SQLAlchemy ORM**.

---

## 🌟 Key Technical Features

1. **React.js Component Architecture & 2D Canvas Graphics**:
   - Component-driven frontend layout (`ChartCanvas.jsx`, `FleetGrid.jsx`, `AlertFeed.jsx`, `PredictionPanel.jsx`).
   - High-performance, zero-dependency HTML5 2D Canvas graph renderer plotting 50-sample sliding telemetry windows at 60 FPS.

2. **Real-Time Telemetry Physics Engine**:
   - Generates correlated physics metrics for 10 nodes (Satellites & Earth Ground Stations).
   - Exponential Moving Average (EMA) thermal drift ($T_{\text{target}} = 40 + 0.35 \times \text{CPU}$), RF signal attenuation $\rightarrow$ exponential packet loss.

3. **Operational Alert Rule Engine**:
   - Evaluates thermal overheat ($>80^\circ\text{C}$), RF degradation ($<-90\text{ dBm}$), and packet loss ($>5\%$).
   - Real-time incident notification stream with one-click resolution.

4. **AI Predictive Failure Risk Engine**:
   - Calculates predictive risk scores ($0-100\%$), Estimated Time to Failure (ETTF), primary failure modes, and automated risk mitigation actions.

5. **Modular FastAPI REST Backend & SQLite Persistence**:
   - Decoupled backend architecture (`routers/`, `services/`, `models.py`, `schemas.py`, `database.py`).
   - Pre-seeded SQLite database (`telemetry.db`) using SQLAlchemy ORM.
   - Interactive Swagger API Documentation at `/docs`.

6. **JWT Authentication & Role-Based Access Control (RBAC)**:
   - Pre-seeded demo accounts: `admin` (`admin123`) for write/mitigation access and `operator` (`operator123`) for observability monitoring.

---

## 🚀 Quick Start Guide

### 1. Frontend Development Server (React + Vite)
```bash
# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

### 2. Backend Server (FastAPI + SQLite)
```bash
# Navigate to backend folder
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run FastAPI server
python -m uvicorn main:app --reload --port 8000
```
Open **`http://127.0.0.1:8000/docs`** for interactive Swagger API documentation.

---

## 📁 Project Structure

```
smart-infrastructure-monitoring/
├── index.html                # Root HTML5 entry point
├── package.json              # React & Vite dependencies
├── vite.config.js            # Vite configuration with React plugin
├── README.md                 # Project documentation
├── INTERVIEW_PREP_GUIDE.md   # Dedicated interview study guide & Q&As
├── src/
│   ├── index.css             # Glassmorphic dark theme stylesheet
│   ├── main.jsx              # React mounting entry point
│   ├── App.jsx               # Main React state & telemetry coordinator
│   ├── simulator.js          # Telemetry simulator class
│   ├── charts.js             # HTML5 2D Canvas line chart renderer class
│   ├── alerts.js             # Alert rule evaluator class
│   ├── prediction.js         # Heuristic rate-of-change risk predictor
│   └── components/
│       ├── Navbar.jsx        # Top header & JWT status badge
│       ├── MetricBanner.jsx  # Overview metrics cards
│       ├── PredictionPanel.jsx # Failure risk meters
│       ├── ChartCanvas.jsx   # 2D Canvas React wrapper component
│       ├── AlertFeed.jsx     # Live incident stream
│       ├── FleetGrid.jsx     # Node cards & table view
│       ├── LoginModal.jsx    # JWT authentication modal
│       └── ArchModal.jsx     # System architecture guide modal
└── backend/
    ├── requirements.txt      # Python dependencies
    ├── database.py           # SQLite connection & SessionLocal factory
    ├── models.py             # SQLAlchemy ORM models (User, Device, Telemetry, Alert)
    ├── schemas.py            # Pydantic schemas for OpenAPI docs
    ├── auth.py               # JWT encoding, hashing, & RBAC dependencies
    ├── services/
    │   ├── simulator.py      # Python telemetry simulator service
    │   └── predictor.py      # Heuristic failure predictor service
    ├── routers/              # Modular REST routers
    └── main.py               # FastAPI entry point & SQLite pre-seeding
```
