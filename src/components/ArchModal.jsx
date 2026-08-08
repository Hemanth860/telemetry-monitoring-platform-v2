import React from 'react';

export function ArchModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div class="modal-overlay" onClick={onClose}>
      <div class="modal-content" onClick={e => e.stopPropagation()}>
        <div class="modal-header">
          <h2>🏛️ System Architecture & Project Blueprint</h2>
          <button class="btn btn-secondary btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        <div class="modal-body">
          <h3>1. Data Flow Architecture</h3>
          <p>This platform uses a multi-tier modular architecture designed for high-frequency telemetry stream processing:</p>
          <pre class="mono-block">
[ Telemetry Physics Simulator Engine ]
       │  (Generates correlated CPU, Temp, Signal & Packet Loss every 2s)
       ▼
[ FastAPI Backend + SQLite Database ] ──► [ JWT Authentication & RBAC ]
       │                                         │
       ▼                                         ▼
[ Operational Alert Rule Engine ]        [ Real-Time Canvas Line Graph ]
          </pre>

          <h3 style={{ marginTop: '1rem' }}>2. Telemetry Physics Equations</h3>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Thermal Drift Equation:</strong><br />
              <code class="mono" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.2rem' }}>
                T_target = 40 + (0.35 × CPU%) + SolarRadiation
              </code>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>RF Signal Attenuation:</strong><br />
              <code class="mono" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.2rem' }}>
                Signal (dBm) = BaseSignal + Noise - SolarFlareDrop
              </code>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Packet Loss Scaling:</strong><br />
              <code class="mono" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.2rem' }}>
                PacketLoss (%) = 0.1 + ((|Signal| - 85)^1.4 × 0.5)
              </code>
            </li>
          </ul>

          <h3 style={{ marginTop: '1rem' }}>3. Key Software Engineering Principles</h3>
          <ul style={{ marginLeft: '1.25rem' }}>
            <li><strong>React.js Component UI:</strong> Modular components (`ChartCanvas.jsx`, `FleetGrid.jsx`, `AlertFeed.jsx`).</li>
            <li><strong>Modular FastAPI Backend:</strong> Decoupled routers (`auth`, `devices`, `telemetry`, `alerts`, `predictions`).</li>
            <li><strong>SQLite + SQLAlchemy ORM:</strong> Persistent database schema for device inventory, telemetry logs, and security alerts.</li>
            <li><strong>JWT Authentication:</strong> Role-based permissions distinguishing Admin operations from Operator monitoring.</li>
            <li><strong>Zero-Dependency Canvas Graphics:</strong> Smooth 60 FPS plotting without heavy DOM charting bloat.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
