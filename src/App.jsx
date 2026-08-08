import React, { useState, useEffect, useRef } from 'react';
import { TelemetrySimulator } from './simulator.js';
import { AlertEngine } from './alerts.js';
import { FailurePredictor } from './prediction.js';

import { Navbar } from './components/Navbar.jsx';
import { MetricBanner } from './components/MetricBanner.jsx';
import { PredictionPanel } from './components/PredictionPanel.jsx';
import { ChartCanvas } from './components/ChartCanvas.jsx';
import { AlertFeed } from './components/AlertFeed.jsx';
import { FleetGrid } from './components/FleetGrid.jsx';
import { LoginModal } from './components/LoginModal.jsx';
import { ArchModal } from './components/ArchModal.jsx';

export function App() {
  const simulatorRef = useRef(null);
  const alertEngineRef = useRef(null);
  const predictorRef = useRef(null);

  const [devices, setDevices] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('SAT-101');
  const [selectedMetric, setSelectedMetric] = useState('cpu');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [alertFilter, setAlertFilter] = useState('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('GRID');
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    simulatorRef.current = new TelemetrySimulator();
    alertEngineRef.current = new AlertEngine();
    predictorRef.current = new FailurePredictor();

    const unsubscribe = simulatorRef.current.subscribe((updatedDevices, timestamp) => {
      alertEngineRef.current.evaluate(updatedDevices, timestamp);
      setDevices([...updatedDevices]);
    });

    simulatorRef.current.start(2000);

    return () => {
      unsubscribe();
      simulatorRef.current.stop();
    };
  }, []);

  const activeAlerts = alertEngineRef.current ? alertEngineRef.current.getAlerts(alertFilter) : [];
  const activeAlertCount = alertEngineRef.current ? alertEngineRef.current.getActiveCount() : 0;
  const predictions = predictorRef.current ? predictorRef.current.predictFleet(devices) : [];
  const targetDevice = devices.find(d => d.id === selectedNodeId);

  const handleMitigateRisk = (nodeId) => {
    simulatorRef.current.resolveAnomaly(nodeId);
    alertEngineRef.current.resolveAllForNode(nodeId);
    setDevices([...simulatorRef.current.devices]);
  };

  const handleResolveAlert = (alertId, nodeId) => {
    alertEngineRef.current.resolveAlert(alertId);
    simulatorRef.current.resolveAnomaly(nodeId);
    setDevices([...simulatorRef.current.devices]);
  };

  const handleSelectNode = (id) => {
    setSelectedNodeId(id);
    const chartSection = document.getElementById("streaming-chart-section");
    if (chartSection) {
      chartSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleInjectAnomaly = (id, type) => {
    simulatorRef.current.injectAnomaly(id, type);
    setDevices([...simulatorRef.current.devices]);
  };

  const handleResolveAnomaly = (id) => {
    simulatorRef.current.resolveAnomaly(id);
    alertEngineRef.current.resolveAllForNode(id);
    setDevices([...simulatorRef.current.devices]);
  };

  return (
    <div>
      <Navbar 
        currentUser={currentUser} 
        onOpenLogin={() => setIsLoginOpen(true)} 
        onOpenArch={() => setIsArchOpen(true)} 
      />

      <main>
        <MetricBanner devices={devices} />

        <PredictionPanel 
          predictions={predictions} 
          onMitigate={handleMitigateRisk} 
          onSelectNode={handleSelectNode} 
        />

        <ChartCanvas 
          targetDevice={targetDevice}
          selectedMetric={selectedMetric}
          selectedNodeId={selectedNodeId}
          onNodeChange={setSelectedNodeId}
          onMetricChange={setSelectedMetric}
        />

        <AlertFeed 
          alerts={activeAlerts}
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
        onLoginSuccess={setCurrentUser} 
      />

      <ArchModal 
        isOpen={isArchOpen} 
        onClose={() => setIsArchOpen(false)} 
      />
    </div>
  );
}
