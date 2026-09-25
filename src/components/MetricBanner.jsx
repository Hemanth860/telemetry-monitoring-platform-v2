import React from 'react';

/**
 * MetricBanner — Overview metrics cards at the top of the dashboard.
 *
 * Props:
 *   devices         — device fleet array (with merged telemetry fields)
 *   latestTelemetry — raw telemetry response array from GET /api/telemetry
 *   alerts          — alert array from GET /api/alerts
 *
 * Data comes from the backend via App.jsx polling — NOT generated here.
 */
export function MetricBanner({ devices, latestTelemetry, alerts }) {
  const totalDevices   = devices.length;
  const criticalCount  = devices.filter(d => d.status === 'CRITICAL').length;
  const warningCount   = devices.filter(d => d.status === 'WARNING').length;
  const healthyCount   = devices.filter(d => d.status === 'HEALTHY').length;

  const avgCpu = latestTelemetry.length > 0
    ? (latestTelemetry.reduce((sum, t) => sum + (t.cpu_percent || 0), 0) / latestTelemetry.length).toFixed(1)
    : '--';

  const avgTemp = latestTelemetry.length > 0
    ? (latestTelemetry.reduce((sum, t) => sum + (t.temperature_celsius || 0), 0) / latestTelemetry.length).toFixed(1)
    : '--';

  const activeAlerts = alerts.filter(a => !a.resolved);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL').length;
  const warningAlerts  = activeAlerts.filter(a => a.severity === 'WARNING').length;
  const totalIncidents = activeAlerts.length;

  return (
    <section className="metric-banner">
      <div className="metric-card">
        <div className="metric-label">
          <span>Fleet Status</span>
          <span className="metric-icon">🛰</span>
        </div>
        <div className="metric-value" style={{ color: criticalCount > 0 ? 'var(--status-critical)' : warningCount > 0 ? 'var(--status-warning)' : 'var(--status-healthy)' }}>
          {totalDevices > 0 ? (criticalCount > 0 ? 'CRITICAL' : warningCount > 0 ? 'WARNING' : 'NOMINAL') : '--'}
        </div>
        <div className="metric-subtext">
          {healthyCount} Healthy · {warningCount} Warning · {criticalCount} Critical
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-label">
          <span>Avg CPU Utilisation</span>
          <span className="metric-icon">⚙</span>
        </div>
        <div className="metric-value" style={{ color: parseFloat(avgCpu) > 80 ? 'var(--status-critical)' : parseFloat(avgCpu) > 65 ? 'var(--status-warning)' : 'var(--accent-cyan)' }}>
          {avgCpu}{avgCpu !== '--' ? '%' : ''}
        </div>
        <div className="metric-subtext">Fleet average across {latestTelemetry.length} nodes</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">
          <span>Avg Core Temperature</span>
          <span className="metric-icon">🌡</span>
        </div>
        <div className="metric-value" style={{ color: parseFloat(avgTemp) > 80 ? 'var(--status-critical)' : parseFloat(avgTemp) > 68 ? 'var(--status-warning)' : 'var(--status-healthy)' }}>
          {avgTemp}{avgTemp !== '--' ? '°C' : ''}
        </div>
        <div className="metric-subtext">Thermal limit: 80°C</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">
          <span>Active Fleet Incidents</span>
          <span className="metric-icon">🚨</span>
        </div>
        <div className="metric-value" style={{ color: totalIncidents === 0 ? 'var(--status-healthy)' : criticalAlerts > 0 ? 'var(--status-critical)' : 'var(--status-warning)' }}>
          {totalIncidents}
        </div>
        <div className="metric-subtext">
          {totalIncidents === 0
            ? 'Zero active warnings'
            : `${criticalAlerts} Critical · ${warningAlerts} Warning`}
        </div>
      </div>
    </section>
  );
}
