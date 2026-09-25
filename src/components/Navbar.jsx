import React from 'react';

/**
 * Navbar — Top header with connection status and user auth state.
 *
 * Props:
 *   currentUser   — {username, role} or null
 *   backendOnline — boolean
 *   lastUpdated   — Date | null
 *   onOpenLogin   — callback
 *   onOpenArch    — callback
 *   onLogout      — callback
 */
export function Navbar({ currentUser, backendOnline, lastUpdated, onOpenLogin, onOpenArch, onLogout }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">🛰</div>
        <div className="brand-title">
          <h1>Smart Infrastructure Monitoring Platform v2</h1>
          <p>Real-Time Orbital Fleet &amp; Ground Node Observability Engine (React + FastAPI + SQLite)</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {currentUser ? (
          <>
            <span
              className={`badge ${currentUser.role === 'admin' ? 'CRITICAL' : 'HEALTHY'}`}
              style={{ display: 'inline-block' }}
            >
              {currentUser.role === 'admin' ? '🔴 Admin' : '🟢 Operator'}: {currentUser.username}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={onOpenLogin}>
            🔐 Login (JWT)
          </button>
        )}

        <button className="btn btn-secondary btn-sm" onClick={onOpenArch}>
          🏗 Architecture Blueprint
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <span
            className="pulse-dot"
            style={{ background: backendOnline ? 'var(--status-healthy)' : 'var(--status-critical)' }}
          />
          <span>
            {backendOnline
              ? `Backend Live${lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ''}`
              : 'Backend Disconnected'}
          </span>
        </div>
      </div>
    </header>
  );
}
