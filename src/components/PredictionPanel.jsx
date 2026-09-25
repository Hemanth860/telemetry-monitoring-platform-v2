import React from 'react';

/**
 * PredictionPanel — Displays heuristic failure risk predictions.
 *
 * Props:
 *   predictions  — array from GET /api/predictions (backend-computed)
 *   onMitigate   — callback(nodeId) — calls POST /api/devices/anomaly/resolve
 *   onSelectNode — callback(nodeId)
 *
 * Data is backend-authoritative. This component only visualises.
 * The prediction engine is in backend/services/predictor.py.
 */
export function PredictionPanel({ predictions, onMitigate, onSelectNode }) {
  if (!predictions || predictions.length === 0) {
    return (
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">
          <span>📊 Heuristic Failure Risk Engine</span>
        </div>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
          Awaiting predictions from backend...
        </p>
      </section>
    );
  }

  return (
    <section className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>📊 Heuristic Failure Risk Engine</span>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', background: 'rgba(139, 92, 246, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            Backend-Computed
          </span>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Model: Weighted Thermal + RF + Loss Components (backend/services/predictor.py)
        </span>
      </div>

      <div className="prediction-grid">
        {predictions.slice(0, 6).map(pred => {
          // Backend uses 'device_id' and 'name'; handle both old and new key names
          const nodeId   = pred.device_id || pred.nodeId;
          const nodeName = pred.name || pred.nodeName;
          const riskScore = pred.risk_score ?? pred.riskScore ?? 0;
          const riskLevel = pred.risk_level || pred.riskLevel || 'LOW';
          const failureMode = pred.primary_failure_mode || pred.primaryFailureMode || 'Unknown';
          const ettf = pred.ettf || 'Unknown';
          const action = pred.recommended_action || pred.recommendedAction || '';

          let barColor = 'var(--status-healthy)';
          if (riskScore > 60) barColor = 'var(--status-critical)';
          else if (riskScore > 30) barColor = 'var(--status-warning)';

          return (
            <div key={nodeId} className={`prediction-card ${riskLevel === 'CRITICAL' ? 'HIGH_RISK' : ''}`}>
              <div>
                <div className="risk-header">
                  <div>
                    <span
                      className="mono"
                      style={{ fontWeight: 700, color: 'var(--accent-cyan)', cursor: 'pointer' }}
                      onClick={() => onSelectNode(nodeId)}
                    >
                      {nodeId}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      {nodeName}
                    </span>
                  </div>
                  <span className="risk-score-value" style={{ color: barColor }}>{riskScore}%</span>
                </div>

                <div className="risk-track">
                  <div className="risk-fill" style={{ width: `${riskScore}%`, background: barColor }} />
                </div>

                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem', color: riskScore > 50 ? 'var(--status-critical)' : 'var(--text-main)' }}>
                  Failure Mode: {failureMode}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} className="mono">
                  Est. Time to Failure: <span style={{ color: '#fff' }}>{ettf}</span>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{action}</span>
                {riskScore > 30 ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => onMitigate(nodeId)}>
                    Mitigate Risk
                  </button>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--status-healthy)' }}>Nominal</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
