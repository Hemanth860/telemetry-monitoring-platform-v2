import React from 'react';

/**
 * FleetGrid — Shows device cards/table with live metrics from the backend.
 *
 * Props:
 *   devices          — device array merged with latest telemetry (from App.jsx)
 *   categoryFilter   — 'ALL' | 'Satellite' | 'Ground Station' | 'ATTENTION'
 *   searchQuery      — string filter
 *   viewMode         — 'GRID' | 'TABLE'
 *   selectedChartNodeId
 *   onCategoryChange, onSearchChange, onViewModeChange
 *   onSelectChartNode — callback(deviceId)
 *   onInjectAnomaly   — callback(deviceId, anomalyType) → calls backend API (admin only)
 *   onResolveAnomaly  — callback(deviceId) → calls backend API (admin only)
 *
 * Device data comes from GET /api/devices merged with GET /api/telemetry in App.jsx.
 * This component only renders — it does not compute metrics.
 */
export function FleetGrid({
  devices,
  categoryFilter,
  searchQuery,
  viewMode,
  selectedChartNodeId,
  onCategoryChange,
  onSearchChange,
  onViewModeChange,
  onSelectChartNode,
  onInjectAnomaly,
  onResolveAnomaly,
}) {
  const allDevices = devices || [];

  const filteredDevices = allDevices.filter(dev => {
    if (categoryFilter === 'Satellite'     && dev.type !== 'Satellite')      return false;
    if (categoryFilter === 'Ground Station' && dev.type !== 'Ground Station') return false;
    if (categoryFilter === 'ATTENTION'     && dev.status === 'HEALTHY')      return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !dev.id.toLowerCase().includes(q) &&
        !dev.name.toLowerCase().includes(q) &&
        !(dev.location || '').toLowerCase().includes(q)
      ) return false;
    }

    return true;
  });

  const countAll  = allDevices.length;
  const countSat  = allDevices.filter(d => d.type === 'Satellite').length;
  const countGs   = allDevices.filter(d => d.type === 'Ground Station').length;
  const countAtt  = allDevices.filter(d => d.status !== 'HEALTHY').length;

  return (
    <div className="card">
      <div className="toolbar">
        <div className="filter-tabs">
          <button className={`tab-btn ${categoryFilter === 'ALL' ? 'active' : ''}`} onClick={() => onCategoryChange('ALL')}>
            All Nodes ({countAll})
          </button>
          <button className={`tab-btn ${categoryFilter === 'Satellite' ? 'active' : ''}`} onClick={() => onCategoryChange('Satellite')}>
            Satellites ({countSat})
          </button>
          <button className={`tab-btn ${categoryFilter === 'Ground Station' ? 'active' : ''}`} onClick={() => onCategoryChange('Ground Station')}>
            Ground Stations ({countGs})
          </button>
          <button className={`tab-btn ${categoryFilter === 'ATTENTION' ? 'active' : ''}`} onClick={() => onCategoryChange('ATTENTION')}>
            Needs Attention ({countAtt})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search Node ID, Name, Location..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>

          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'GRID' ? 'active' : ''}`} onClick={() => onViewModeChange('GRID')}>
              ⊞ Grid
            </button>
            <button className={`view-btn ${viewMode === 'TABLE' ? 'active' : ''}`} onClick={() => onViewModeChange('TABLE')}>
              ≡ Table
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'GRID' ? (
        <div className="device-grid">
          {filteredDevices.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              🔭 No orbital nodes match your current filter query.
            </div>
          ) : (
            filteredDevices.map(dev => {
              const cpu    = dev.currentCpu   ?? 0;
              const temp   = dev.currentTemp  ?? 0;
              const signal = dev.currentSignal ?? 0;
              const loss   = dev.currentPacketLoss ?? 0;
              const latency = dev.currentLatency ?? 0;
              const status = dev.status || 'HEALTHY';
              const isSelected = dev.id === selectedChartNodeId;

              const cpuColor    = cpu    > 80  ? 'var(--status-critical)' : cpu   > 65  ? 'var(--status-warning)' : 'var(--accent-cyan)';
              const tempColor   = temp   > 78  ? 'var(--status-critical)' : temp  > 65  ? 'var(--status-warning)' : 'var(--status-healthy)';
              const signalColor = signal < -88 ? 'var(--status-critical)' : signal < -75 ? 'var(--status-warning)' : 'var(--accent-blue)';

              return (
                <div
                  key={dev.id}
                  className="node-card"
                  style={{
                    borderColor: isSelected ? 'var(--accent-cyan)' : undefined,
                    boxShadow:   isSelected ? '0 0 15px rgba(6, 182, 212, 0.2)' : undefined,
                  }}
                >
                  <div>
                    <div className="node-card-header">
                      <div>
                        <div className="node-id">{dev.id}</div>
                        <div className="node-title">{dev.name}</div>
                        <div className="node-location">{dev.type} · {dev.location}</div>
                      </div>
                      <span className={`badge ${status}`}>{status}</span>
                    </div>

                    <div className="metric-bar-group">
                      <div className="metric-bar-header">
                        <span>CPU Usage</span>
                        <span className="mono">{cpu}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${cpu}%`, background: cpuColor }} />
                      </div>
                    </div>

                    <div className="metric-bar-group">
                      <div className="metric-bar-header">
                        <span>Thermal Temp</span>
                        <span className="mono" style={{ color: tempColor }}>{typeof temp === 'number' ? temp.toFixed(1) : temp}°C</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${Math.min(100, (temp / 90) * 100)}%`, background: tempColor }} />
                      </div>
                    </div>

                    <div className="metric-bar-group">
                      <div className="metric-bar-header">
                        <span>Signal Link (dBm)</span>
                        <span className="mono">{signal} dBm</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${Math.max(10, Math.min(100, ((signal + 110) / 70) * 100))}%`, background: signalColor }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }} className="mono">
                      <span>Latency: {latency}ms</span>
                      <span>Loss: {typeof loss === 'number' ? loss.toFixed(2) : loss}%</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => onSelectChartNode(dev.id)}>
                      {isSelected ? '📈 Viewing Graph' : '📈 View Graph'}
                    </button>

                    <button className="btn btn-secondary btn-sm" onClick={() => onInjectAnomaly(dev.id, 'THERMAL_RUNAWAY')}>
                      Overload
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Node ID</th>
                <th>Name &amp; Type</th>
                <th>Status</th>
                <th>CPU %</th>
                <th>RAM %</th>
                <th>Temp (°C)</th>
                <th>Signal (dBm)</th>
                <th>Packet Loss</th>
                <th>Latency</th>
                <th>Battery</th>
                <th>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map(dev => (
                <tr key={dev.id}>
                  <td className="mono" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{dev.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{dev.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{dev.type} · {dev.band}</div>
                  </td>
                  <td><span className={`badge ${dev.status || 'HEALTHY'}`}>{dev.status || 'HEALTHY'}</span></td>
                  <td className="mono">{dev.currentCpu ?? '--'}%</td>
                  <td className="mono">{dev.currentRam ?? '--'}%</td>
                  <td className="mono" style={{ color: (dev.currentTemp ?? 0) > 75 ? 'var(--status-critical)' : 'inherit' }}>
                    {typeof dev.currentTemp === 'number' ? dev.currentTemp.toFixed(1) : '--'}°C
                  </td>
                  <td className="mono" style={{ color: (dev.currentSignal ?? 0) < -88 ? 'var(--status-critical)' : 'inherit' }}>
                    {dev.currentSignal ?? '--'} dBm
                  </td>
                  <td className="mono" style={{ color: (dev.currentPacketLoss ?? 0) > 5 ? 'var(--status-critical)' : 'inherit' }}>
                    {typeof dev.currentPacketLoss === 'number' ? dev.currentPacketLoss.toFixed(2) : '--'}%
                  </td>
                  <td className="mono">{dev.currentLatency ?? '--'} ms</td>
                  <td className="mono">{dev.type === 'Satellite' ? (dev.battery ?? '--') + '%' : 'N/A'}</td>
                  <td style={{ display: 'flex', gap: '0.35rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => onSelectChartNode(dev.id)}>Graph</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => onInjectAnomaly(dev.id, 'THERMAL_RUNAWAY')}>Overload</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
