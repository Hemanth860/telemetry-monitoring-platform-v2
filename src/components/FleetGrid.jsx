import React from 'react';

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
  onResolveAnomaly 
}) {
  const filteredDevices = devices.filter(dev => {
    if (categoryFilter === "Satellite" && dev.type !== "Satellite") return false;
    if (categoryFilter === "Ground Station" && dev.type !== "Ground Station") return false;
    if (categoryFilter === "ATTENTION" && dev.status === "HEALTHY") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = dev.id.toLowerCase().includes(q);
      const matchName = dev.name.toLowerCase().includes(q);
      const matchLoc = dev.location.toLowerCase().includes(q);
      const matchBand = dev.band.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchLoc && !matchBand) return false;
    }

    return true;
  });

  const countAll = devices.length;
  const countSat = devices.filter(d => d.type === "Satellite").length;
  const countGs = devices.filter(d => d.type === "Ground Station").length;
  const countAtt = devices.filter(d => d.status !== "HEALTHY").length;

  return (
    <div class="card">
      <div class="toolbar">
        <div class="filter-tabs">
          <button class={`tab-btn ${categoryFilter === 'ALL' ? 'active' : ''}`} onClick={() => onCategoryChange('ALL')}>
            All Nodes ({countAll})
          </button>
          <button class={`tab-btn ${categoryFilter === 'Satellite' ? 'active' : ''}`} onClick={() => onCategoryChange('Satellite')}>
            Satellites ({countSat})
          </button>
          <button class={`tab-btn ${categoryFilter === 'Ground Station' ? 'active' : ''}`} onClick={() => onCategoryChange('Ground Station')}>
            Ground Stations ({countGs})
          </button>
          <button class={`tab-btn ${categoryFilter === 'ATTENTION' ? 'active' : ''}`} onClick={() => onCategoryChange('ATTENTION')}>
            Needs Attention ({countAtt})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div class="search-box">
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search Node ID, Name, Location..." 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div class="view-toggle">
            <button class={`view-btn ${viewMode === 'GRID' ? 'active' : ''}`} onClick={() => onViewModeChange('GRID')}>
              🔲 Grid
            </button>
            <button class={`view-btn ${viewMode === 'TABLE' ? 'active' : ''}`} onClick={() => onViewModeChange('TABLE')}>
              ≡ Table
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'GRID' ? (
        <div class="device-grid">
          {filteredDevices.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              🔍 No orbital nodes match your current filter query.
            </div>
          ) : (
            filteredDevices.map(dev => {
              const isAnomaly = !!dev.anomaly;
              const cpuColor = dev.currentCpu > 80 ? 'var(--status-critical)' : dev.currentCpu > 65 ? 'var(--status-warning)' : 'var(--accent-cyan)';
              const tempColor = dev.currentTemp > 78 ? 'var(--status-critical)' : dev.currentTemp > 65 ? 'var(--status-warning)' : 'var(--status-healthy)';
              const signalColor = dev.currentSignal < -88 ? 'var(--status-critical)' : dev.currentSignal < -75 ? 'var(--status-warning)' : 'var(--accent-blue)';
              const isSelected = dev.id === selectedChartNodeId;

              return (
                <div 
                  key={dev.id} 
                  class="node-card" 
                  style={{ borderColor: isSelected ? 'var(--accent-cyan)' : undefined, boxShadow: isSelected ? '0 0 15px rgba(6, 182, 212, 0.2)' : undefined }}
                >
                  <div>
                    <div class="node-card-header">
                      <div>
                        <div class="node-id">{dev.id}</div>
                        <div class="node-title">{dev.name}</div>
                        <div class="node-location">{dev.type} • {dev.location}</div>
                      </div>
                      <span class={`badge ${dev.status}`}>{dev.status}</span>
                    </div>

                    <div class="metric-bar-group">
                      <div class="metric-bar-header">
                        <span>CPU Usage</span>
                        <span class="mono">{dev.currentCpu}%</span>
                      </div>
                      <div class="progress-track">
                        <div class="progress-fill" style={{ width: `${dev.currentCpu}%`, background: cpuColor }}></div>
                      </div>
                    </div>

                    <div class="metric-bar-group">
                      <div class="metric-bar-header">
                        <span>Thermal Temp</span>
                        <span class="mono" style={{ color: tempColor }}>{dev.currentTemp}°C</span>
                      </div>
                      <div class="progress-track">
                        <div class="progress-fill" style={{ width: `${Math.min(100, (dev.currentTemp / 90) * 100)}%`, background: tempColor }}></div>
                      </div>
                    </div>

                    <div class="metric-bar-group">
                      <div class="metric-bar-header">
                        <span>Signal Link (dBm)</span>
                        <span class="mono">{dev.currentSignal} dBm</span>
                      </div>
                      <div class="progress-track">
                        <div class="progress-fill" style={{ width: `${Math.max(10, Math.min(100, ((dev.currentSignal + 110) / 70) * 100))}%`, background: signalColor }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }} class="mono">
                      <span>Latency: {dev.currentLatency}ms</span>
                      <span>Loss: {dev.currentPacketLoss}%</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button class="btn btn-secondary btn-sm" onClick={() => onSelectChartNode(dev.id)}>
                      {isSelected ? '📈 Viewing Graph' : '📊 View Graph'}
                    </button>

                    {isAnomaly ? (
                      <button class="btn btn-danger btn-sm" onClick={() => onResolveAnomaly(dev.id)}>
                        Resolve {dev.anomaly}
                      </button>
                    ) : (
                      <button class="btn btn-secondary btn-sm" onClick={() => onInjectAnomaly(dev.id, 'THERMAL_RUNAWAY')}>
                        Overload
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Node ID</th>
                <th>Name & Type</th>
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
                  <td class="mono" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{dev.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{dev.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{dev.type} • {dev.band}</div>
                  </td>
                  <td><span class={`badge ${dev.status}`}>{dev.status}</span></td>
                  <td class="mono">{dev.currentCpu}%</td>
                  <td class="mono">{dev.currentRam}%</td>
                  <td class="mono" style={{ color: dev.currentTemp > 75 ? 'var(--status-critical)' : 'inherit' }}>{dev.currentTemp}°C</td>
                  <td class="mono" style={{ color: dev.currentSignal < -88 ? 'var(--status-critical)' : 'inherit' }}>{dev.currentSignal} dBm</td>
                  <td class="mono" style={{ color: dev.currentPacketLoss > 5 ? 'var(--status-critical)' : 'inherit' }}>{dev.currentPacketLoss}%</td>
                  <td class="mono">{dev.currentLatency} ms</td>
                  <td class="mono">{dev.type === 'Satellite' ? dev.battery + '%' : 'N/A'}</td>
                  <td style={{ display: 'flex', gap: '0.35rem' }}>
                    <button class="btn btn-secondary btn-sm" onClick={() => onSelectChartNode(dev.id)}>Graph</button>
                    {dev.anomaly ? (
                      <button class="btn btn-danger btn-sm" onClick={() => onResolveAnomaly(dev.id)}>Resolve</button>
                    ) : (
                      <button class="btn btn-secondary btn-sm" onClick={() => onInjectAnomaly(dev.id, 'THERMAL_RUNAWAY')}>Overload</button>
                    )}
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
