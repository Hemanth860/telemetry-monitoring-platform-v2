/**
 * Operational Alert Rule Engine
 * ------------------------------
 * Evaluates real-time telemetry metrics against operational limits.
 */

export class AlertEngine {
  constructor() {
    this.alerts = [];
  }

  evaluate(devices, timestamp) {
    devices.forEach(dev => {
      if (dev.currentTemp > 80) {
        this.addAlert({
          id: `ALT-${dev.id}-TEMP`,
          nodeId: dev.id,
          nodeName: dev.name,
          severity: "CRITICAL",
          category: "Thermal",
          message: `Thermal Overheat: Core temperature reached ${dev.currentTemp}°C (Limit: 80°C)`,
          timestamp
        });
      } else if (dev.currentTemp > 68) {
        this.addAlert({
          id: `ALT-${dev.id}-TEMP-WARN`,
          nodeId: dev.id,
          nodeName: dev.name,
          severity: "WARNING",
          category: "Thermal",
          message: `Elevated Temperature: Core temperature at ${dev.currentTemp}°C`,
          timestamp
        });
      }

      if (dev.currentSignal < -90) {
        this.addAlert({
          id: `ALT-${dev.id}-SIG`,
          nodeId: dev.id,
          nodeName: dev.name,
          severity: "CRITICAL",
          category: "RF Link",
          message: `RF Link Degraded: Signal dropped to ${dev.currentSignal} dBm (Limit: -90 dBm)`,
          timestamp
        });
      }

      if (dev.currentPacketLoss > 5.0) {
        this.addAlert({
          id: `ALT-${dev.id}-LOSS`,
          nodeId: dev.id,
          nodeName: dev.name,
          severity: dev.currentPacketLoss > 10.0 ? "CRITICAL" : "WARNING",
          category: "Network",
          message: `Packet Loss Spike: Transmission loss at ${dev.currentPacketLoss}%`,
          timestamp
        });
      }
    });
  }

  addAlert(alertData) {
    const existingIndex = this.alerts.findIndex(a => a.id === alertData.id && !a.resolved);
    if (existingIndex !== -1) {
      this.alerts[existingIndex].timestamp = alertData.timestamp;
      this.alerts[existingIndex].message = alertData.message;
    } else {
      this.alerts.unshift({
        ...alertData,
        resolved: false
      });
    }
  }

  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
    }
  }

  resolveAllForNode(nodeId) {
    this.alerts.forEach(a => {
      if (a.nodeId === nodeId) {
        a.resolved = true;
        a.resolvedAt = new Date().toISOString();
      }
    });
  }

  getAlerts(filter = "ACTIVE") {
    if (filter === "ACTIVE") return this.alerts.filter(a => !a.resolved);
    if (filter === "CRITICAL") return this.alerts.filter(a => a.severity === "CRITICAL" && !a.resolved);
    if (filter === "WARNING") return this.alerts.filter(a => a.severity === "WARNING" && !a.resolved);
    return this.alerts;
  }

  getActiveCount() {
    return this.alerts.filter(a => !a.resolved).length;
  }
}
