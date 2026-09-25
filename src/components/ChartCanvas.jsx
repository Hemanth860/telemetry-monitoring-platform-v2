import React, { useRef, useEffect } from 'react';

/**
 * ChartCanvas — HTML5 2D Canvas line chart visualising telemetry history.
 *
 * Props:
 *   historyData   — array of TelemetryResponse records from
 *                   GET /api/telemetry/history/{device_id}
 *                   (fetched and managed by App.jsx, NOT generated here)
 *   selectedMetric — 'cpu' | 'temp' | 'signal' | 'loss' | 'latency'
 *   selectedNodeId — device ID string
 *   devices        — fleet devices array (for node selector dropdown)
 *   onNodeChange   — callback(nodeId)
 *   onMetricChange — callback(metric)
 *
 * This component is PURELY a visualiser. It does not generate data.
 * Data source: SQLite → FastAPI → GET /api/telemetry/history → App.jsx → here.
 */

const METRIC_CONFIG = {
  cpu:     { label: 'CPU %',        key: 'cpu_percent',          min: 0,    max: 100,  unit: '%',   color: '#06b6d4' },
  temp:    { label: 'Temperature',  key: 'temperature_celsius',  min: 20,   max: 100,  unit: '°C',  color: '#f59e0b' },
  signal:  { label: 'RF Signal',    key: 'signal_strength_dbm',  min: -110, max: -40,  unit: ' dBm',color: '#3b82f6' },
  loss:    { label: 'Packet Loss',  key: 'packet_loss_percent',  min: 0,    max: 25,   unit: '%',   color: '#ef4444' },
  latency: { label: 'Latency',      key: 'latency_ms',           min: 0,    max: 500,  unit: ' ms', color: '#8b5cf6' },
};

export function ChartCanvas({ historyData, selectedMetric, selectedNodeId, devices, onNodeChange, onMetricChange }) {
  const canvasRef = useRef(null);

  const metric = METRIC_CONFIG[selectedMetric] || METRIC_CONFIG.cpu;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width  = W;
    canvas.height = H;

    const pad = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    // Clear
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(9, 13, 22, 0.0)';
    ctx.fillRect(0, 0, W, H);

    const data = (historyData || []).map(r => r[metric.key]).filter(v => v !== undefined && v !== null);

    if (data.length < 2) {
      ctx.fillStyle = 'rgba(100,116,139,0.8)';
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        historyData.length === 0
          ? 'Awaiting telemetry from backend...'
          : 'Not enough data points yet',
        W / 2, H / 2
      );
      return;
    }

    const minVal = metric.min;
    const maxVal = metric.max;

    const toX = (i) => pad.left + (i / (data.length - 1)) * chartW;
    const toY = (v) => pad.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + (i / gridLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();

      const val = maxVal - (i / gridLines) * (maxVal - minVal);
      ctx.fillStyle = 'rgba(100,116,139,0.8)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(0) + metric.unit, pad.left - 5, y + 4);
    }

    // Gradient fill under line
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    gradient.addColorStop(0, metric.color + '44');
    gradient.addColorStop(1, metric.color + '00');

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(toX(i), toY(data[i]));
    }
    ctx.lineTo(toX(data.length - 1), pad.top + chartH);
    ctx.lineTo(toX(0), pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = metric.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.moveTo(toX(0), toY(data[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(toX(i), toY(data[i]));
    }
    ctx.stroke();

    // Latest value dot
    const lastX = toX(data.length - 1);
    const lastY = toY(data[data.length - 1]);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = metric.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

  }, [historyData, selectedMetric, metric]);

  // Compute stats from history
  const metricValues = (historyData || []).map(r => r[metric.key]).filter(v => v !== undefined && v !== null);
  const latest  = metricValues.length > 0 ? metricValues[metricValues.length - 1] : null;
  const minStat = metricValues.length > 0 ? Math.min(...metricValues).toFixed(1) : '--';
  const maxStat = metricValues.length > 0 ? Math.max(...metricValues).toFixed(1) : '--';

  return (
    <section className="card" id="streaming-chart-section" style={{ marginBottom: '1.5rem' }}>
      <div className="chart-toolbar">
        <div className="card-title" style={{ margin: 0 }}>
          <span>📈 Telemetry History Stream</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
            Source: SQLite → GET /api/telemetry/history/{selectedNodeId}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="select-dropdown"
            value={selectedNodeId}
            onChange={e => onNodeChange(e.target.value)}
          >
            {(devices || []).map(d => (
              <option key={d.id} value={d.id}>{d.id} — {d.name}</option>
            ))}
          </select>

          <div className="metric-select-tabs">
            {Object.entries(METRIC_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                className={`chart-tab-btn ${selectedMetric === key ? 'active' : ''}`}
                onClick={() => onMetricChange(key)}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-stats-group" style={{ marginBottom: '0.75rem' }}>
        <span>Samples: {metricValues.length}</span>
        <span>Latest: {latest !== null ? latest.toFixed(1) + metric.unit : '--'}</span>
        <span>Min: {minStat}{minStat !== '--' ? metric.unit : ''}</span>
        <span>Max: {maxStat}{maxStat !== '--' ? metric.unit : ''}</span>
      </div>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </section>
  );
}
