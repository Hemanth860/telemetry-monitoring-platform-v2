import React from 'react';

export function AlertFeed({ 
  alerts, 
  activeCount, 
  alertFilter, 
  onFilterChange, 
  onResolveAlert, 
  onSelectNode 
}) {
  return (
    <section class="card" style={{ marginBottom: '1.5rem' }}>
      <div class="card-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>🚨 Fleet Incident & Alert Stream</span>
          <span class={`badge ${activeCount > 0 ? 'CRITICAL' : 'HEALTHY'}`}>
            {activeCount} Active Alert(s)
          </span>
        </div>

        <div class="alert-filter-tabs">
          {['ACTIVE', 'CRITICAL', 'WARNING', 'ALL'].map(filterOption => (
            <button
              key={filterOption}
              class={`alert-tab-btn ${alertFilter === filterOption ? 'active' : ''}`}
              onClick={() => onFilterChange(filterOption)}
            >
              {filterOption === 'ACTIVE' ? 'Active Incidents' : filterOption}
            </button>
          ))}
        </div>
      </div>

      <div class="alert-feed">
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            ✅ No alert incidents matching current filter view.
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} class={`alert-item ${alert.severity} ${alert.resolved ? 'resolved' : ''}`}>
              <div class="alert-item-content">
                <div class="alert-item-header">
                  <span class={`badge ${alert.severity}`}>{alert.severity}</span>
                  <span class="alert-node-link" onClick={() => onSelectNode(alert.nodeId)}>
                    {alert.nodeId} ({alert.nodeName})
                  </span>
                  <span class="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {alert.message}
                </div>
              </div>
              <div>
                {!alert.resolved ? (
                  <button class="btn btn-secondary btn-sm" onClick={() => onResolveAlert(alert.id, alert.nodeId)}>
                    Acknowledge & Resolve
                  </button>
                ) : (
                  <span class="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Resolved</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
