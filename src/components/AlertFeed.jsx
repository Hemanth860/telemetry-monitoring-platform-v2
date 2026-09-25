import React from 'react';

/**
 * AlertFeed — Displays alerts fetched from GET /api/alerts.
 *
 * Props:
 *   alerts       — alert array from backend
 *   activeCount  — number of active alerts
 *   alertFilter  — 'ACTIVE' | 'CRITICAL' | 'WARNING' | 'ALL'
 *   onFilterChange — callback(filter)
 *   onResolveAlert — callback(alertId) — calls POST /api/alerts/resolve
 *   onSelectNode   — callback(nodeId)
 *
 * Alert rules are evaluated by backend/services/alert_engine.py.
 * This component ONLY displays the backend state — it does not evaluate rules.
 */
export function AlertFeed({ alerts, activeCount, alertFilter, onFilterChange, onResolveAlert, onSelectNode }) {
  const displayAlerts = alerts || [];

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString();
    } catch (_) {
      return ts;
    }
  };

  return (
    <section className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>🚨 Alert Feed</span>
          {activeCount > 0 && (
            <span style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: 'var(--status-critical)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '4px',
              padding: '0.1rem 0.4rem',
              fontSize: '0.7rem',
              fontWeight: 700,
            }}>
              {activeCount} Active
            </span>
          )}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Source: GET /api/alerts (backend-evaluated)
          </span>
        </div>

        <div className="alert-filter-tabs">
          {['ACTIVE', 'CRITICAL', 'WARNING', 'ALL'].map(f => (
            <button
              key={f}
              className={`alert-tab-btn ${alertFilter === f ? 'active' : ''}`}
              onClick={() => onFilterChange(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="alert-feed">
        {displayAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {alertFilter === 'ACTIVE' ? '✅ No active alerts — all systems nominal' : 'No alerts matching this filter'}
          </div>
        ) : (
          displayAlerts.map(alert => {
            // Support both backend field names and legacy names
            const id       = alert.id;
            const nodeId   = alert.device_id || alert.nodeId;
            const nodeName = alert.device_name || alert.nodeName || nodeId;
            const severity = alert.severity;
            const category = alert.category;
            const message  = alert.message;
            const ts       = alert.timestamp;
            const resolved = alert.resolved;

            return (
              <div key={id} className={`alert-item ${severity} ${resolved ? 'resolved' : ''}`}>
                <div>
                  <div className="alert-item-header">
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: severity === 'CRITICAL' ? 'var(--status-critical)' : 'var(--status-warning)',
                      display: 'inline-block',
                      flexShrink: 0,
                    }} />
                    <span className="alert-node-link" onClick={() => onSelectNode(nodeId)}>
                      {nodeId}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                      [{category}]
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: severity === 'CRITICAL' ? 'var(--status-critical)' : 'var(--status-warning)',
                      background: severity === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      border: `1px solid ${severity === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      borderRadius: '3px',
                      padding: '0.05rem 0.35rem',
                    }}>
                      {severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {message}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    {formatTimestamp(ts)}
                    {resolved && alert.resolved_by && ` · Resolved by ${alert.resolved_by}`}
                  </div>
                </div>

                {!resolved && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0 }}
                    onClick={() => onResolveAlert(id)}
                    title="Requires admin role"
                  >
                    Resolve
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
