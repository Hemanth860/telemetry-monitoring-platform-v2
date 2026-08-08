import React from 'react';

export function Navbar({ currentUser, onOpenLogin, onOpenArch }) {
  return (
    <header class="app-header">
      <div class="brand">
        <div class="brand-icon">🛰️</div>
        <div class="brand-title">
          <h1>Smart Infrastructure Monitoring Platform v2</h1>
          <p>Real-Time Orbital Fleet & Ground Node Observability Engine (React + FastAPI + SQLite)</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button class="btn btn-secondary btn-sm" onClick={onOpenLogin}>
          👤 Login (JWT)
        </button>

        <span 
          class={`badge ${currentUser?.role === 'admin' ? 'CRITICAL' : 'HEALTHY'}`} 
          style={{ display: 'inline-block' }}
        >
          {currentUser 
            ? `${currentUser.role === 'admin' ? '👑 Admin' : '👤 Operator'}: ${currentUser.username}` 
            : '👤 Guest Mode'}
        </span>

        <button class="btn btn-secondary btn-sm" onClick={onOpenArch}>
          🏛️ Architecture Blueprint
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <span class="pulse-dot HEALTHY"></span>
          <span>Engine Running (2s tick)</span>
        </div>
      </div>
    </header>
  );
}
