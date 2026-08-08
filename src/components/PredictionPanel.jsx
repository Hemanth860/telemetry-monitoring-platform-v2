import React from 'react';

export function PredictionPanel({ predictions, onMitigate, onSelectNode }) {
  return (
    <section class="card" style={{ marginBottom: '1.5rem' }}>
      <div class="card-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>🤖 Heuristic Failure Risk Engine</span>
          <span class="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', background: 'rgba(139, 92, 246, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            10-Sample Sliding Window
          </span>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Model Vector: Thermal Velocity (dT/dt) & RF Decay Rate</span>
      </div>

      <div class="prediction-grid">
        {predictions.slice(0, 6).map(pred => {
          let barColor = 'var(--status-healthy)';
          if (pred.riskScore > 60) barColor = 'var(--status-critical)';
          else if (pred.riskScore > 30) barColor = 'var(--status-warning)';

          return (
            <div key={pred.nodeId} class={`prediction-card ${pred.riskLevel === 'CRITICAL' ? 'HIGH_RISK' : ''}`}>
              <div>
                <div class="risk-header">
                  <div>
                    <span 
                      class="mono" 
                      style={{ fontWeight: 700, color: 'var(--accent-cyan)', cursor: 'pointer' }}
                      onClick={() => onSelectNode(pred.nodeId)}
                    >
                      {pred.nodeId}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      {pred.nodeName}
                    </span>
                  </div>
                  <span class="risk-score-value" style={{ color: barColor }}>{pred.riskScore}%</span>
                </div>

                <div class="risk-track">
                  <div class="risk-fill" style={{ width: `${pred.riskScore}%`, background: barColor }}></div>
                </div>

                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem', color: pred.riskScore > 50 ? 'var(--status-critical)' : 'var(--text-main)' }}>
                  Failure Mode: {pred.primaryFailureMode}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} class="mono">
                  Est. Time to Failure: <span style={{ color: '#fff' }}>{pred.ettf}</span>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{pred.recommendedAction}</span>
                {pred.riskScore > 30 ? (
                  <button class="btn btn-secondary btn-sm" onClick={() => onMitigate(pred.nodeId)}>
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
