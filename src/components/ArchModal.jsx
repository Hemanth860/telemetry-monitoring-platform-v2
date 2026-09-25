import React from 'react';

/**
 * ArchModal — System Architecture Blueprint modal.
 * Updated to reflect the new backend-first architecture.
 */
export function ArchModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>🏗 System Architecture Blueprint</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Full-Stack System Design: React.js, Python FastAPI, SQLite ORM, and HTML5 2D Canvas
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        <div className="modal-body" style={{ marginTop: '1.25rem' }}>

          {/* Section 1: End-to-End Data Flow */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
              1. End-to-End Data Flow (Backend-First Architecture)
            </h3>

            <div className="mono-block" style={{ lineHeight: '1.8' }}>
              {`Python Telemetry Simulator
      │
      │  HTTP POST /api/telemetry
      ▼
FastAPI Backend
      │
      ├── Pydantic Validation (schemas.py)
      │
      ├── Alert Engine  (services/alert_engine.py)
      │       temperature > 80°C  → CRITICAL Thermal
      │       signal < -90 dBm    → CRITICAL RF Link
      │       packet_loss > 5%    → WARNING/CRITICAL Network
      │
      ├── Heuristic Prediction Engine (services/predictor.py)
      │       Weighted thermal + RF + loss scoring
      │       Risk score 0–100%, ETTF, Failure Mode
      │
      └── SQLAlchemy → SQLite
              telemetry_logs / alert_logs / prediction_logs
                      │
                      │  HTTP GET /api/telemetry | /api/alerts | /api/predictions
                      ▼
            React Frontend (visualisation only)
                      │
                      ├── Charts (ChartCanvas)
                      ├── Fleet Status (FleetGrid)
                      ├── Alerts (AlertFeed)
                      └── Predictions (PredictionPanel)`}
            </div>
          </div>

          {/* Section 2: Key Design Principles */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
              2. Architecture Principles
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.85rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                  1. Python Simulator
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.2rem', fontWeight: 600 }}>
                  Telemetry Producer
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  simulator_runner.py POSTs correlated telemetry every 2 seconds via HTTP.
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '0.85rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
                  2. FastAPI + SQLite
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.2rem', fontWeight: 600 }}>
                  Single Source of Truth
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  All business logic lives here. Validation, alerts, predictions, persistence.
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-healthy)', textTransform: 'uppercase' }}>
                  3. React Frontend
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.2rem', fontWeight: 600 }}>
                  Visualisation Layer Only
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Polls GET APIs every 2s. Renders charts, fleet, alerts, predictions. No data generation.
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Physics Telemetry Models */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
              3. Physics Telemetry Formulas (backend/services/simulator.py)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  EMA Thermal Drift:
                </div>
                <div className="mono" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.35rem', display: 'inline-block', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  T_target = BaseTemp + 0.35 × (CPU − 40)
                </div>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  RF Signal Attenuation → Exponential Packet Loss:
                </div>
                <div className="mono" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.35rem', display: 'inline-block', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  Packet Loss = 0.1 + (|Signal| − 85)^1.4 × 0.5
                </div>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Heuristic Risk Score (backend/services/predictor.py):
                </div>
                <div className="mono" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.35rem', display: 'inline-block', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  Score = 0.4×Thermal + 0.4×RF + 0.2×Loss + AnomalyBoost
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Software Engineering Highlights */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
              4. Core Software Engineering Highlights
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>◆ Backend-First Architecture:</strong> FastAPI is the single source of truth. All telemetry, alerts, and predictions are computed and persisted by the backend.
              </div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>◆ Pydantic Validation:</strong> POST /api/telemetry validates all fields. Invalid payloads return HTTP 422 and are never inserted into SQLite.
              </div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>◆ React Polling:</strong> App.jsx polls <code className="mono" style={{ color: 'var(--accent-cyan)' }}>/api/telemetry</code>, <code className="mono" style={{ color: 'var(--accent-cyan)' }}>/api/alerts</code>, <code className="mono" style={{ color: 'var(--accent-cyan)' }}>/api/predictions</code> every 2 seconds with AbortController cleanup.
              </div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>◆ JWT Security & RBAC:</strong> Role-based access — admin for anomaly injection, alert resolution; operator for read-only.
              </div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>◆ HTML5 2D Canvas:</strong> High-performance pixel buffer rendering for the telemetry history chart.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
