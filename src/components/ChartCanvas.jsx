import React, { useRef, useEffect } from 'react';
import { TelemetryChart } from '../charts.js';

export function ChartCanvas({ 
  targetDevice, 
  selectedMetric, 
  selectedNodeId, 
  onNodeChange, 
  onMetricChange 
}) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const METRIC_SPECS = {
    cpu: { label: "CPU Load", unit: "%", color: "#06b6d4", threshold: 80, min: 0, max: 100 },
    temp: { label: "Thermal Temp", unit: "°C", color: "#ef4444", threshold: 80, min: 20, max: 95 },
    signal: { label: "Signal Strength", unit: "dBm", color: "#3b82f6", threshold: -90, min: -110, max: -40 },
    latency: { label: "Latency", unit: "ms", color: "#8b5cf6", threshold: 200, min: 0 },
    packetLoss: { label: "Packet Loss", unit: "%", color: "#f59e0b", threshold: 5, min: 0, max: 25 }
  };

  useEffect(() => {
    if (canvasRef.current) {
      chartInstanceRef.current = new TelemetryChart(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    if (!chartInstanceRef.current || !targetDevice || !targetDevice.history) return;

    const spec = METRIC_SPECS[selectedMetric];
    const chartData = targetDevice.history.map(sample => ({
      val: sample[selectedMetric],
      time: new Date(sample.timestamp).toLocaleTimeString()
    }));

    chartInstanceRef.current.render({
      data: chartData,
      label: spec.label,
      unit: spec.unit,
      color: spec.color,
      thresholdValue: spec.threshold,
      minVal: spec.min,
      maxVal: spec.max
    });
  }, [targetDevice, selectedMetric]);

  const spec = METRIC_SPECS[selectedMetric];
  const history = targetDevice?.history || [];
  const vals = history.map(d => d[selectedMetric]);
  const currentVal = vals.length > 0 ? vals[vals.length - 1] : "--";
  const minVal = vals.length > 0 ? Math.min(...vals) : "--";
  const maxVal = vals.length > 0 ? Math.max(...vals) : "--";
  const avgVal = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "--";

  return (
    <section class="card" id="streaming-chart-section" style={{ marginBottom: '1.5rem' }}>
      <div class="card-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>📈 Real-Time Telemetry Streaming Graph</span>
          <span class="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            50-Sample Window
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Node:</span>
          <select 
            value={selectedNodeId} 
            onChange={(e) => onNodeChange(e.target.value)} 
            class="select-dropdown"
          >
            <option value="SAT-101">SAT-101 (Orbital SatCom Alpha)</option>
            <option value="SAT-102">SAT-102 (Orbital SatCom Beta)</option>
            <option value="SAT-103">SAT-103 (GeoLink Express 1)</option>
            <option value="SAT-104">SAT-104 (SkyBeam Transponder 4)</option>
            <option value="SAT-105">SAT-105 (EMEA Orbital Gateway)</option>
            <option value="SAT-106">SAT-106 (APAC Telemetry Node)</option>
            <option value="GS-CHENN">GS-CHENN (Chennai Earth Station)</option>
            <option value="GS-SINGP">GS-SINGP (Singapore Uplink Station)</option>
            <option value="GS-SYDNY">GS-SYDNY (Sydney Teleport)</option>
            <option value="GS-AMSTR">GS-AMSTR (Amsterdam Gateway)</option>
          </select>
        </div>
      </div>

      <div class="chart-toolbar">
        <div class="metric-select-tabs">
          {Object.keys(METRIC_SPECS).map(metricKey => (
            <button 
              key={metricKey}
              class={`chart-tab-btn ${selectedMetric === metricKey ? 'active' : ''}`}
              onClick={() => onMetricChange(metricKey)}
            >
              {METRIC_SPECS[metricKey].label}
            </button>
          ))}
        </div>

        <div class="chart-stats-group mono">
          <div>Current: <span style={{ color: spec.color, fontWeight: 700 }}>{currentVal} {spec.unit}</span></div>
          <div>Min: <span>{minVal} {spec.unit}</span></div>
          <div>Max: <span>{maxVal} {spec.unit}</span></div>
          <div>Avg: <span>{avgVal} {spec.unit}</span></div>
        </div>
      </div>

      <div class="canvas-wrapper">
        <canvas ref={canvasRef} height="240"></canvas>
      </div>
    </section>
  );
}
