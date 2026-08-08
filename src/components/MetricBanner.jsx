import React from 'react';

export function MetricBanner({ devices }) {
  const total = devices.length || 10;
  const healthy = devices.filter(d => d.status === "HEALTHY").length;
  const warnings = devices.filter(d => d.status === "WARNING").length;
  const criticals = devices.filter(d => d.status === "CRITICAL").length;
  const totalIncidents = warnings + criticals;

  const healthScore = Math.round((healthy / total) * 100);
  const avgLatency = Math.round(devices.reduce((acc, d) => acc + (d.currentLatency || 100), 0) / total);
  const avgSignal = Math.round(devices.reduce((acc, d) => acc + (d.currentSignal || -60), 0) / total);

  return (
    <section class="grid-container summary-grid" style={{ marginBottom: '1.5rem' }}>
      <div class="metric-card">
        <div class="metric-header">
          <span>Fleet Health Score</span>
          <span class="metric-icon">💚</span>
        </div>
        <div class="metric-value" style={{ color: healthScore === 100 ? 'var(--status-healthy)' : healthScore > 75 ? 'var(--status-warning)' : 'var(--status-critical)' }}>
          {healthScore}%
        </div>
        <div class="metric-subtext">
          {healthScore === 100 ? `All ${total} nodes operating within limits` : `${totalIncidents} node(s) require operational review`}
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span>Active Fleet Nodes</span>
          <span class="metric-icon">🛰️</span>
        </div>
        <div class="metric-value">
          {total} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {total}</span>
        </div>
        <div class="metric-subtext">6 Satellites • 4 Ground Stations</div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span>Average Network Latency</span>
          <span class="metric-icon">⚡</span>
        </div>
        <div class="metric-value">{avgLatency} ms</div>
        <div class="metric-subtext">SAT GEO ~135ms • GS ~17ms</div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span>RF Signal Index</span>
          <span class="metric-icon">📶</span>
        </div>
        <div class="metric-value">{avgSignal} dBm</div>
        <div class="metric-subtext" style={{ color: 'var(--status-healthy)' }}>Strong RF link telemetry</div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span>Active Fleet Incidents</span>
          <span class="metric-icon">🚨</span>
        </div>
        <div class="metric-value" style={{ color: totalIncidents === 0 ? 'var(--status-healthy)' : criticals > 0 ? 'var(--status-critical)' : 'var(--status-warning)' }}>
          {totalIncidents}
        </div>
        <div class="metric-subtext">
          {totalIncidents === 0 ? 'Zero active warnings' : `${criticals} Critical • ${warnings} Warning`}
        </div>
      </div>
    </section>
  );
}
