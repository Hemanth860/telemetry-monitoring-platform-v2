/**
 * Telemetry Simulator Engine
 * ----------------------------
 * Simulates physical correlated telemetry for orbiting satellites and earth ground stations.
 * Generates Exponential Moving Average (EMA) thermal drift and RF signal attenuation.
 */

export const INITIAL_DEVICES = [
  { id: "SAT-101", name: "Orbital SatCom Alpha", type: "Satellite", orbit: "GEO (35,786 km)", location: "0.0° N, 89.0° W", band: "Ka-Band", baseCpu: 45, baseTemp: 52, baseSignal: -62, baseLatency: 138, status: "HEALTHY", battery: 98 },
  { id: "SAT-102", name: "Orbital SatCom Beta", type: "Satellite", orbit: "GEO (35,786 km)", location: "0.0° N, 69.9° W", band: "Ka-Band", baseCpu: 40, baseTemp: 48, baseSignal: -58, baseLatency: 132, status: "HEALTHY", battery: 95 },
  { id: "SAT-103", name: "GeoLink Express 1", type: "Satellite", orbit: "GEO (35,786 km)", location: "0.0° N, 115.1° W", band: "Ka/Ku-Band", baseCpu: 55, baseTemp: 56, baseSignal: -65, baseLatency: 142, status: "HEALTHY", battery: 91 },
  { id: "SAT-104", name: "SkyBeam Transponder 4", type: "Satellite", orbit: "GEO (35,786 km)", location: "0.0° N, 111.1° W", band: "Ka-Band", baseCpu: 50, baseTemp: 54, baseSignal: -64, baseLatency: 140, status: "HEALTHY", battery: 94 },
  { id: "SAT-105", name: "EMEA Orbital Gateway", type: "Satellite", orbit: "GEO (35,786 km)", location: "0.0° N, 9.0° E", band: "Ka-Band", baseCpu: 62, baseTemp: 61, baseSignal: -68, baseLatency: 148, status: "HEALTHY", battery: 89 },
  { id: "SAT-106", name: "APAC Telemetry Node", type: "Satellite", orbit: "GEO (35,786 km)", location: "0.0° N, 110.0° E", band: "Ka-Band", baseCpu: 38, baseTemp: 46, baseSignal: -60, baseLatency: 135, status: "HEALTHY", battery: 97 },
  { id: "GS-CHENN", name: "Chennai Earth Station", type: "Ground Station", orbit: "Ground Facility", location: "13.08° N, 80.27° E", band: "Fiber & Dish Uplink", baseCpu: 30, baseTemp: 38, baseSignal: -52, baseLatency: 18, status: "HEALTHY", battery: 100 },
  { id: "GS-SINGP", name: "Singapore Uplink Station", type: "Ground Station", orbit: "Ground Facility", location: "1.35° N, 103.81° E", band: "High-Capacity Optical", baseCpu: 35, baseTemp: 40, baseSignal: -50, baseLatency: 15, status: "HEALTHY", battery: 100 },
  { id: "GS-SYDNY", name: "Sydney Teleport", type: "Ground Station", orbit: "Ground Facility", location: "33.86° S, 151.20° E", band: "Ka-Band Ground Gateway", baseCpu: 28, baseTemp: 36, baseSignal: -54, baseLatency: 22, status: "HEALTHY", battery: 100 },
  { id: "GS-AMSTR", name: "Amsterdam Satellite Gateway", type: "Ground Station", orbit: "Ground Facility", location: "52.36° N, 4.90° E", band: "Euro-Fiber Uplink", baseCpu: 42, baseTemp: 41, baseSignal: -53, baseLatency: 16, status: "HEALTHY", battery: 100 }
];

export class TelemetrySimulator {
  constructor(devices = INITIAL_DEVICES) {
    this.devices = devices.map(d => ({
      ...d,
      currentCpu: d.baseCpu,
      currentRam: Math.min(95, d.baseCpu + 10),
      currentTemp: d.baseTemp,
      currentSignal: d.baseSignal,
      currentLatency: d.baseLatency,
      currentPacketLoss: 0.1,
      anomaly: null,
      history: []
    }));

    this.listeners = [];
    this.timer = null;
    this.sampleCount = 0;
  }

  start(intervalMs = 2000) {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), intervalMs);
    this.tick();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  injectAnomaly(deviceId, anomalyType) {
    const dev = this.devices.find(d => d.id === deviceId);
    if (dev) {
      dev.anomaly = anomalyType;
      this.tick();
    }
  }

  resolveAnomaly(deviceId) {
    const dev = this.devices.find(d => d.id === deviceId);
    if (dev) {
      dev.anomaly = null;
      this.tick();
    }
  }

  tick() {
    this.sampleCount++;
    const timestamp = new Date().toISOString();

    this.devices = this.devices.map(dev => {
      let noise = (Math.random() - 0.5) * 2;
      let targetCpu = dev.baseCpu + noise * 5;
      let targetRam = dev.baseCpu + 10 + (Math.random() - 0.5) * 4;

      if (dev.anomaly === "THERMAL_RUNAWAY") {
        targetCpu = 94 + Math.random() * 5;
        targetRam = 88 + Math.random() * 8;
      } else if (dev.anomaly === "SOLAR_FLARE") {
        noise -= 8;
      }

      dev.currentCpu = Math.max(10, Math.min(99, Math.round(dev.currentCpu * 0.7 + targetCpu * 0.3)));
      dev.currentRam = Math.max(15, Math.min(99, Math.round(dev.currentRam * 0.7 + targetRam * 0.3)));

      // EMA Thermal Drift Formula: T_target = BaseTemp + 0.35 * (CPU - 40)
      const thermalInertia = (dev.currentCpu - 40) * 0.35;
      let targetTemp = dev.baseTemp + thermalInertia + (dev.type === "Satellite" ? Math.sin(this.sampleCount * 0.1) * 3 : 0);

      if (dev.anomaly === "THERMAL_RUNAWAY") {
        targetTemp = 86 + Math.random() * 4;
      }

      dev.currentTemp = parseFloat((dev.currentTemp * 0.8 + targetTemp * 0.2).toFixed(1));

      // RF Signal Attenuation
      let targetSignal = dev.baseSignal + noise * 2;
      if (dev.anomaly === "SOLAR_FLARE") {
        targetSignal = -96 - Math.random() * 6;
      }
      dev.currentSignal = Math.max(-110, Math.min(-40, Math.round(targetSignal)));

      // Exponential Packet Loss scaling
      let packetLoss = 0.1 + Math.random() * 0.3;
      if (dev.currentSignal < -85) {
        packetLoss += Math.pow((Math.abs(dev.currentSignal) - 85), 1.4) * 0.5;
      }
      if (dev.anomaly === "PACKET_BURST") {
        packetLoss += 12.5 + Math.random() * 5;
      }
      dev.currentPacketLoss = parseFloat(Math.min(25, packetLoss).toFixed(2));

      // Network Latency jitter
      let latencyJitter = (Math.random() - 0.5) * 6;
      if (dev.currentPacketLoss > 3) {
        latencyJitter += dev.currentPacketLoss * 8;
      }
      dev.currentLatency = Math.max(5, Math.round(dev.baseLatency + latencyJitter));

      if (dev.type === "Satellite") {
        dev.battery = Math.max(75, Math.min(100, Math.round(95 + Math.cos(this.sampleCount * 0.05) * 5)));
      }

      // Operational Limits
      if (dev.currentTemp > 80 || dev.currentSignal < -90 || dev.currentPacketLoss > 8.0) {
        dev.status = "CRITICAL";
      } else if (dev.currentTemp > 68 || dev.currentSignal < -78 || dev.currentPacketLoss > 3.0) {
        dev.status = "WARNING";
      } else {
        dev.status = "HEALTHY";
      }

      const sample = {
        timestamp,
        cpu: dev.currentCpu,
        ram: dev.currentRam,
        temp: dev.currentTemp,
        signal: dev.currentSignal,
        packetLoss: dev.currentPacketLoss,
        latency: dev.currentLatency,
        status: dev.status,
        battery: dev.battery
      };

      dev.history.push(sample);
      if (dev.history.length > 50) {
        dev.history.shift();
      }

      return { ...dev, lastSample: sample };
    });

    this.listeners.forEach(cb => cb(this.devices, timestamp));
  }
}
