import React from 'react';

export function ArchModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div class="modal-overlay" onClick={onClose}>
      <div class="modal-content" style={{ maxWidth: '750px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <div class="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
              🏛️ System Architecture & Engineering Blueprint
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Full-Stack System Design: React.js, Python FastAPI, SQLite ORM, and HTML5 2D Canvas
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        <div class="modal-body" style={{ marginTop: '1.25rem' }}>
          
          {/* Section 1: Visual Architecture Pipeline */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
              1. End-to-End Data Flow Architecture
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.85rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                  1. Simulation Engine
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.2rem', fontWeight: 600 }}>
                  Telemetry Simulator
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Generates correlated CPU, temp, signal & packet loss ticks every 2 seconds.
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '0.85rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
                  2. FastAPI Backend & DB
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.2rem', fontWeight: 600 }}>
                  SQLite + SQLAlchemy ORM
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  JWT Bearer authentication, modular REST routers, & 50-sample log persistence.
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-healthy)', textTransform: 'uppercase' }}>
                  3. React UI & 2D Canvas
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.2rem', fontWeight: 600 }}>
                  60 FPS Canvas Graph
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Direct pixel buffer drawing via useRef without Virtual DOM re-render lag.
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Mathematical Physics Models */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
              2. Physics Telemetry Formulas
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Exponential Moving Average (EMA) Thermal Drift:
                </div>
                <div class="mono" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.35rem', display: 'inline-block', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  T_target = 40 + (0.35 × CPU%) &nbsp;|&nbsp; T_next = (0.8 × T_current) + (0.2 × T_target)
                </div>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  RF Signal Attenuation & Exponential Packet Loss:
                </div>
                <div class="mono" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.35rem', display: 'inline-block', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  Packet Loss (%) = 0.1 + ((|Signal| - 85)^1.4 × 0.5)
                </div>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Sliding-Window Thermal Velocity Risk Score:
                </div>
                <div class="mono" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.35rem', display: 'inline-block', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  Thermal Velocity = (T_latest - T_first) / Δt &nbsp;|&nbsp; Risk Score (0-100%)
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Engineering Principles */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
              3. Core Software Engineering Highlights
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>• React.js Component Architecture:</strong> Decoupled UI components (<code class="mono" style={{ color: 'var(--accent-cyan)' }}>ChartCanvas</code>, <code class="mono" style={{ color: 'var(--accent-cyan)' }}>FleetGrid</code>, <code class="mono" style={{ color: 'var(--accent-cyan)' }}>AlertFeed</code>, <code class="mono" style={{ color: 'var(--accent-cyan)' }}>PredictionPanel</code>).
              </div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>• Modular Python FastAPI Backend:</strong> Decoupled REST routers (<code class="mono" style={{ color: 'var(--accent-purple)' }}>auth</code>, <code class="mono" style={{ color: 'var(--accent-purple)' }}>devices</code>, <code class="mono" style={{ color: 'var(--accent-purple)' }}>telemetry</code>, <code class="mono" style={{ color: 'var(--accent-purple)' }}>alerts</code>, <code class="mono" style={{ color: 'var(--accent-purple)' }}>predictions</code>).
              </div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>• SQLite + SQLAlchemy ORM:</strong> Relational SQL database schemas for device inventories, user security accounts, and historical telemetry streams.
              </div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>• JWT Security & RBAC:</strong> Role-based access control enforcing <code class="mono" style={{ color: 'var(--status-critical)' }}>admin</code> privileges for anomaly injection and mitigation.
              </div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>• HTML5 2D Canvas Graphics:</strong> High-performance 60 FPS pixel buffer rendering bypassing DOM memory overhead.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
