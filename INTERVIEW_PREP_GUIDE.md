# Software Engineering Interview Preparation Guide 🎓🛰️

Comprehensive study guide, architecture breakdown, and 10 technical interview Q&As for the **Smart Infrastructure Monitoring Platform v2**.

---

## 📌 1. The 30-Second Elevator Pitch

> *"I built a Smart Infrastructure Monitoring Platform that processes real-time telemetry from orbiting satellites and earth ground stations. It ingests metrics like CPU utilization, thermal drift, RF signal strength, and network latency at 2-second intervals. The frontend is built with React.js and an HTML5 2D Canvas engine plotting 60 FPS streaming line graphs. The backend is a modular FastAPI application using SQLite and SQLAlchemy ORM, featuring JWT role-based access control and a sliding-window heuristic failure risk predictor."*

---

## 🏛️ 2. System Architecture Data Flow

```
[ React.js Component UI ] ◄──(Props/State)──► [ ChartCanvas.jsx (2D Canvas) ]
         │
  (HTTP REST / JWT)
         ▼
[ FastAPI Modular Backend ]
   ├── Authentication Router (/api/auth/*)
   ├── Devices & Fleet Router (/api/devices/*)
   ├── Telemetry Ingestion Router (/api/telemetry/*)
   ├── Alert Rule Router (/api/alerts/*)
   └── Predictive Risk Router (/api/predictions/*)
         │
         ▼
[ SQLite Relational Database (SQLAlchemy ORM) ]
```

---

## ❓ 3. Top 10 Technical Interview Q&As

### Q1: Why did you use React.js on the frontend?
**Answer**: I used React.js to organize the user interface into modular, reusable components (`ChartCanvas`, `FleetGrid`, `AlertFeed`, `PredictionPanel`). React's declarative state management (`useState`, `useEffect`) automatically re-renders component UI elements whenever telemetry data updates, keeping the code clean and maintainable.

### Q2: Why HTML5 Canvas instead of Chart.js or Recharts?
**Answer**: DOM-based charting libraries create and update hundreds of SVG/DOM elements on every frame. When rendering high-frequency streaming data every 2 seconds, this leads to heavy DOM memory bloat and garbage collection pauses. By writing a direct HTML5 2D Canvas renderer (`charts.js`), I draw pixel buffers directly to the canvas context, maintaining 60 FPS performance with zero external library overhead.

### Q3: How do you embed HTML5 Canvas inside React without lag?
**Answer**: In `ChartCanvas.jsx`, I used React's `useRef` hook to attach a reference to the `<canvas>` DOM element. The `TelemetryChart` rendering instance is initialized once, and inside a `useEffect` hook listening to telemetry updates, it receives the 50-sample sliding window and draws directly to the pixel buffer without triggering unnecessary React Virtual DOM diffing loops.

### Q4: Why Python + FastAPI instead of Node.js + Express?
**Answer**: In real-world aerospace and telemetry infrastructure (companies like Viasat, SpaceX, Cisco), data processing and physics simulation formulas are standardly written in Python. FastAPI provides automatic interactive Swagger documentation at `/docs`, type validation via Pydantic, and fast asynchronous endpoint execution.

### Q5: Why SQLite / SQLAlchemy ORM instead of MongoDB?
**Answer**: Telemetry logs, device inventories, alert records, and user credentials have strict, structured tabular schemas. Relational SQL databases with SQLAlchemy ORM provide strong schema validation, fast time-series indexing on `device_id` and `timestamp`, and transactional security constraints (`UNIQUE` usernames/emails) that document databases like MongoDB do not enforce out of the box.

### Q6: How does your telemetry physics simulator model temperature?
**Answer**: I implemented an Exponential Moving Average (EMA) thermal drift model. CPU utilization drives a target thermal inertia value ($T_{\text{target}} = 40 + 0.35 \times \text{CPU}$), and current temperature smoothly drifts toward that target with a $0.2$ smoothing factor. This prevents sudden unrealistic temperature jumps.

### Q7: How does your failure prediction module work?
**Answer**: It is a sliding-window rate-of-change heuristic model. It inspects the last 10 telemetry samples to calculate thermal velocity ($\frac{dT}{dt}$) and RF decay velocity. By combining velocity vectors with proximity to safety limits ($80^\circ\text{C}$ and $-90\text{ dBm}$), it computes a composite risk score ($0-100\%$) and projects Estimated Time to Failure (ETTF) before threshold limits are breached.

### Q8: Why use a Heuristic model instead of Machine Learning?
**Answer**: Telemetry streaming requires real-time, deterministic, $O(1)$ time complexity evaluations without the GPU overhead, training latency, or fake synthetic dataset issues associated with heavy ML models. The heuristic model is 100% explainable and reliable.

### Q9: How is security handled in your backend?
**Answer**: I implemented JWT (JSON Web Token) authentication with SHA-256 password hashing. FastAPI dependencies (`get_current_user`, `require_admin`) decode and verify the bearer token on incoming requests, enforcing Role-Based Access Control (RBAC) so only `admin` users can trigger or resolve anomaly incidents.

### Q10: How did you optimize database queries for live charting?
**Answer**: Historical telemetry queries filter by `device_id`, sort descending by `timestamp`, and apply a `.limit(50)` constraint to fetch only the required sliding window size, preventing full-table database scans.
