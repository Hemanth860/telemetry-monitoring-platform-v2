import React, { useState } from 'react';
import { login as apiLogin } from '../api.js';

/**
 * LoginModal — Authenticates with the FastAPI backend.
 *
 * On success, calls onLoginSuccess(user, token) with the user object
 * and JWT access token returned by POST /api/auth/login.
 *
 * Demo credentials:
 *   admin    / admin123   (admin role — can inject anomalies, resolve alerts)
 *   operator / operator123 (read-only role)
 */
export function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiLogin(username, password);
      onLoginSuccess(data.user, data.access_token);
      onClose();
    } catch (err) {
      if (err.status === 401) {
        setError('Incorrect username or password.');
      } else if (!err.status) {
        setError('Cannot reach backend. Is the FastAPI server running?');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (demoUsername, demoPassword) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiLogin(demoUsername, demoPassword);
      onLoginSuccess(data.user, data.access_token);
      onClose();
    } catch (err) {
      if (!err.status) {
        setError('Cannot reach backend. Is the FastAPI server running?');
      } else {
        setError(err.message || 'Demo login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔐 JWT User Authentication</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Authenticates against <strong>POST /api/auth/login</strong> (FastAPI backend).
            JWT token is stored and included in protected API requests.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={() => handleDemoSelect('admin', 'admin123')}
              disabled={loading}
            >
              Demo Admin
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={() => handleDemoSelect('operator', 'operator123')}
              disabled={loading}
            >
              Demo Operator
            </button>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
              marginBottom: '1rem',
              fontSize: '0.8rem',
              color: 'var(--status-critical)',
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Username
              </label>
              <input
                type="text"
                className="select-dropdown"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Password
              </label>
              <input
                type="password"
                className="select-dropdown"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="btn"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In & Authenticate'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
