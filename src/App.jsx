import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as api from './api.js';

import { Navbar }          from './components/Navbar.jsx';
import { MetricBanner }    from './components/MetricBanner.jsx';
import { PredictionPanel } from './components/PredictionPanel.jsx';
import { ChartCanvas }     from './components/ChartCanvas.jsx';
import { AlertFeed }       from './components/AlertFeed.jsx';
import { FleetGrid }       from './components/FleetGrid.jsx';
import { LoginModal }      from './components/LoginModal.jsx';
import { ArchModal }       from './components/ArchModal.jsx';

/**
 * App — Main orchestration & data-fetching layer.
 *
 * Architecture: React is the visualisation/client layer only.
 *   - No telemetry is generated inside React.
 *   - No alert rules are evaluated inside React.
 *   - No predictions are computed inside React.
 *   - All data is fetched from FastAPI via polling.
 *
 * Polling interval: every 2 seconds (matches simulator tick rate).
 * AbortController is used to clean up in-flight requests on unmount.
 */

const POLL_INTERVAL_MS = 2000;

export function App() {
  // ── UI state ────────────────────────────────────────────────────────────
  const [selectedNodeId,  setSelectedNodeId]  = useState('SAT-101');
  const [selectedMetric,  setSelectedMetric]  = useState('cpu');
  const [categoryFilter,  setCategoryFilter]  = useState('ALL');
  const [alertFilter,     setAlertFilter]     = useState('ACTIVE');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [viewMode,        setViewMode]        = useState('GRID');
  const [isLoginOpen,     setIsLoginOpen]     = useState(false);
  const [isArchOpen,      setIsArchOpen]      = useState(false);
  const [currentUser,     setCurrentUser]     = useState(null);

  // ── Backend data state ───────────────────────────────────────────────────
  const [devices,         setDevices]         = useState([]);      // from GET /api/devices
  const [latestTelemetry, setLatestTelemetry] = useState([]);     // from GET /api/telemetry
  const [historyData,     setHistoryData]     = useState([]);     // from GET /api/telemetry/history/{id}
  const [alerts,          setAlerts]          = useState([]);     // from GET /api/alerts
  const [predictions,     setPredictions]     = useState([]);     // from GET /api/predictions

  // ── Connection status ────────────────────────────────────────────────────
  const [backendOnline,   setBackendOnline]   = useState(true);
  const [lastUpdated,     setLastUpdated]     = useState(null);

  // ── Polling ref to avoid stale closure / multiple intervals ─────────────
  const pollRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Core polling function — fetches all required data from the backend
  // ─────────────────────────────────────────────────────────────────────────
  const pollBackend = useCallback(async (signal) => {
    try {
      // Fetch devices, telemetry, alerts, and predictions in parallel
      const [devicesData, telemetryData, alertsData, predictionsData] = await Promise.all([
        api.fetchDevices(signal),
        api.fetchLatestTelemetry(signal),
        api.fetchAlerts(alertFilter, signal),
        api.fetchPredictions(signal),
      ]);

      // Merge latest telemetry metrics into device records for FleetGrid display
      const mergedDevices = devicesData.map(dev => {
        const telRecord = telemetryData.find(t => t.device_id === dev.id);
        if (telRecord) {
          return {
            ...dev,
            currentCpu:        telRecord.cpu_percent,
            currentRam:        telRecord.ram_percent,
            currentTemp:       telRecord.temperature_celsius,
            currentSignal:     telRecord.signal_strength_dbm,
            currentPacketLoss: telRecord.packet_loss_percent,
            currentLatency:    telRecord.latency_ms,
            battery:           telRecord.battery_percent,
            status:            telRecord.status,
          };
        }
        return dev;
      });

      setDevices(mergedDevices);
      setLatestTelemetry(telemetryData);
      setAlerts(alertsData);
      setPredictions(predictionsData);
      setBackendOnline(true);
      setLastUpdated(new Date());
    } catch (err) {
      if (err.name === 'AbortError') return; // component unmounted — ignore
      console.warn('[API] Poll error:', err.message || err);
      setBackendOnline(false);
      // Preserve last valid UI state — do not clear data
    }
  }, [alertFilter]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch telemetry history when the selected node changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      try {
        const data = await api.fetchTelemetryHistory(selectedNodeId, 50, controller.signal);
        setHistoryData(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[API] History fetch error:', err.message);
          setHistoryData([]);
        }
      }
    }

    loadHistory();
    return () => controller.abort();
  }, [selectedNodeId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Polling setup — runs every POLL_INTERVAL_MS, cleaned up on unmount
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();

    // Initial fetch immediately
    pollBackend(controller.signal);

    // Then poll on interval
    pollRef.current = setInterval(() => {
      pollBackend(controller.signal);
      // Also refresh history for the selected node
      api.fetchTelemetryHistory(selectedNodeId, 50, controller.signal)
        .then(data => setHistoryData(data))
        .catch(err => { if (err.name !== 'AbortError') console.warn('[API] History poll error:', err.message); });
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearInterval(pollRef.current);
    };
  }, [pollBackend, selectedNodeId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Re-fetch alerts when the filter changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    api.fetchAlerts(alertFilter, controller.signal)
      .then(data => setAlerts(data))
      .catch(err => { if (err.name !== 'AbortError') console.warn('[API] Alerts fetch error:', err.message); });
    return () => controller.abort();
  }, [alertFilter]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived data
  // ─────────────────────────────────────────────────────────────────────────
  const activeAlertCount = alerts.filter(a => !a.resolved).length;
  const targetDevice     = devices.find(d => d.id === selectedNodeId);

  // ─────────────────────────────────────────────────────────────────────────
  // Event handlers — backend API calls
  // ─────────────────────────────────────────────────────────────────────────
  const handleLoginSuccess = (userData, token) => {
    setCurrentUser(userData);
    if (token) api.setAuthToken(token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    api.logout();
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await api.resolveAlert(alertId);
      // Refresh alerts immediately
      const updated = await api.fetchAlerts(alertFilter);
      setAlerts(updated);
    } catch (err) {
      console.warn('[API] Resolve alert error:', err.message);
      if (err.status === 401 || err.status === 403) {
        alert('You must be logged in as admin to resolve alerts.');
      }
    }
  };

  const handleMitigateRisk = async (nodeId) => {
    try {
      await api.resolveAnomaly(nodeId);
    } catch (err) {
      console.warn('[API] Mitigate risk error:', err.message);
      if (err.status === 401 || err.status === 403) {
        alert('You must be logged in as admin to mitigate risk.');
      }
    }
  };

  const handleInjectAnomaly = async (deviceId, anomalyType) => {
    try {
      await api.injectAnomaly(deviceId, anomalyType);
    } catch (err) {
      console.warn('[API] Inject anomaly error:', err.message);
      if (err.status === 401 || err.status === 403) {
        alert('You must be logged in as admin to inject anomalies.');
      }
    }
  };

  const handleResolveAnomaly = async (deviceId) => {
    try {
      await api.resolveAnomaly(deviceId);
    } catch (err) {
      console.warn('[API] Resolve anomaly error:', err.message);
    }
  };

  const handleSelectNode = (id) => {
    setSelectedNodeId(id);
    const chartSection = document.getElementById('streaming-chart-section');
    if (chartSection) {
      chartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <Navbar
        currentUser={currentUser}
        backendOnline={backendOnline}
        lastUpdated={lastUpdated}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenArch={() => setIsArchOpen(true)}
        onLogout={handleLogout}
      />

      {/* Backend connection warning banner */}
      {!backendOnline && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--status-critical)',
          borderRadius: '8px',
          padding: '0.75rem 1.5rem',
          margin: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.85rem',
          color: 'var(--status-critical)',
        }}>
          <span>⚠</span>
          <span>
            <strong>Backend Disconnected</strong> — Cannot reach FastAPI at{' '}
            <code>{import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}</code>.
            Displaying last known data. Ensure the backend is running.
          </span>
        </div>
      )}

      <main>
        <MetricBanner
          devices={devices}
          latestTelemetry={latestTelemetry}
          alerts={alerts}
        />

        <PredictionPanel
          predictions={predictions}
          onMitigate={handleMitigateRisk}
          onSelectNode={handleSelectNode}
        />

        <ChartCanvas
          historyData={historyData}
          selectedMetric={selectedMetric}
          selectedNodeId={selectedNodeId}
          devices={devices}
          onNodeChange={setSelectedNodeId}
          onMetricChange={setSelectedMetric}
        />

        <AlertFeed
          alerts={alerts}
          activeCount={activeAlertCount}
          alertFilter={alertFilter}
          onFilterChange={setAlertFilter}
          onResolveAlert={handleResolveAlert}
          onSelectNode={handleSelectNode}
        />

        <FleetGrid
          devices={devices}
          categoryFilter={categoryFilter}
          searchQuery={searchQuery}
          viewMode={viewMode}
          selectedChartNodeId={selectedNodeId}
          onCategoryChange={setCategoryFilter}
          onSearchChange={setSearchQuery}
          onViewModeChange={setViewMode}
          onSelectChartNode={handleSelectNode}
          onInjectAnomaly={handleInjectAnomaly}
          onResolveAnomaly={handleResolveAnomaly}
        />
      </main>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <ArchModal
        isOpen={isArchOpen}
        onClose={() => setIsArchOpen(false)}
      />
    </div>
  );
}
