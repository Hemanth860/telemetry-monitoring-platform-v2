import React, { useState } from 'react';

export function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const role = username === 'admin' ? 'admin' : 'operator';
    onLoginSuccess({ username, role });
    onClose();
  };

  const handleDemoSelect = (demoUsername) => {
    const role = demoUsername === 'admin' ? 'admin' : 'operator';
    onLoginSuccess({ username: demoUsername, role });
    onClose();
  };

  return (
    <div class="modal-overlay" onClick={onClose}>
      <div class="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div class="modal-header">
          <h2>👤 JWT User Authentication</h2>
          <button class="btn btn-secondary btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        <div class="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Select a demo account or sign in with your credentials:
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button class="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleDemoSelect('admin')}>
              Demo Admin
            </button>
            <button class="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleDemoSelect('operator')}>
              Demo Operator
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Username</label>
              <input 
                type="text" 
                class="select-dropdown" 
                style={{ width: '100%', boxSizing: 'border-box' }} 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Password</label>
              <input 
                type="password" 
                class="select-dropdown" 
                style={{ width: '100%', boxSizing: 'border-box' }} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
            <button type="submit" class="btn" style={{ width: '100%' }}>Sign In & Authenticate</button>
          </form>
        </div>
      </div>
    </div>
  );
}
