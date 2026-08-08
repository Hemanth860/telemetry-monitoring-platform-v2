"""
Telemetry Simulator Service
---------------------------
Encapsulates physics-correlated telemetry generation equations.
"""

import random
from datetime import datetime

INITIAL_DEVICES = [
    {"id": "SAT-101", "name": "Orbital SatCom Alpha", "type": "Satellite", "orbit": "GEO (35,786 km)", "location": "0.0° N, 89.0° W", "band": "Ka-Band", "base_cpu": 45, "base_temp": 52.0, "base_signal": -62.0, "base_latency": 138, "battery": 98},
    {"id": "SAT-102", "name": "Orbital SatCom Beta", "type": "Satellite", "orbit": "GEO (35,786 km)", "location": "0.0° N, 69.9° W", "band": "Ka-Band", "base_cpu": 40, "base_temp": 48.0, "base_signal": -58.0, "base_latency": 132, "battery": 95},
    {"id": "SAT-103", "name": "GeoLink Express 1", "type": "Satellite", "orbit": "GEO (35,786 km)", "location": "0.0° N, 115.1° W", "band": "Ka/Ku-Band", "base_cpu": 55, "base_temp": 56.0, "base_signal": -65.0, "base_latency": 142, "battery": 91},
    {"id": "SAT-104", "name": "SkyBeam Transponder 4", "type": "Satellite", "orbit": "GEO (35,786 km)", "location": "0.0° N, 111.1° W", "band": "Ka-Band", "base_cpu": 50, "base_temp": 54.0, "base_signal": -64.0, "base_latency": 140, "battery": 94},
    {"id": "SAT-105", "name": "EMEA Orbital Gateway", "type": "Satellite", "orbit": "GEO (35,786 km)", "location": "0.0° N, 9.0° E", "band": "Ka-Band", "base_cpu": 62, "base_temp": 61.0, "base_signal": -68.0, "base_latency": 148, "battery": 89},
    {"id": "SAT-106", "name": "APAC Telemetry Node", "type": "Satellite", "orbit": "GEO (35,786 km)", "location": "0.0° N, 110.0° E", "band": "Ka-Band", "base_cpu": 38, "base_temp": 46.0, "base_signal": -60.0, "base_latency": 135, "battery": 97},
    {"id": "GS-CHENN", "name": "Chennai Earth Station", "type": "Ground Station", "orbit": "Ground Facility", "location": "13.08° N, 80.27° E", "band": "Fiber & Dish Uplink", "base_cpu": 30, "base_temp": 38.0, "base_signal": -52.0, "base_latency": 18, "battery": 100},
    {"id": "GS-SINGP", "name": "Singapore Uplink Station", "type": "Ground Station", "orbit": "Ground Facility", "location": "1.35° N, 103.81° E", "band": "High-Capacity Optical", "base_cpu": 35, "base_temp": 40.0, "base_signal": -50.0, "base_latency": 15, "battery": 100},
    {"id": "GS-SYDNY", "name": "Sydney Teleport", "type": "Ground Station", "orbit": "Ground Facility", "location": "33.86° S, 151.20° E", "band": "Ka-Band Ground Gateway", "base_cpu": 28, "base_temp": 36.0, "base_signal": -54.0, "base_latency": 22, "battery": 100},
    {"id": "GS-AMSTR", "name": "Amsterdam Satellite Gateway", "type": "Ground Station", "orbit": "Ground Facility", "location": "52.36° N, 4.90° E", "band": "Euro-Fiber Uplink", "base_cpu": 42, "base_temp": 41.0, "base_signal": -53.0, "base_latency": 16, "battery": 100}
]


class TelemetrySimulatorService:
    def __init__(self, devices=INITIAL_DEVICES):
        self.devices = [dict(d) for d in devices]
        self.anomalies = {}

    def inject_anomaly(self, device_id: str, anomaly_type: str):
        self.anomalies[device_id] = anomaly_type

    def resolve_anomaly(self, device_id: str):
        if device_id in self.anomalies:
            del self.anomalies[device_id]

    def generate_tick(self):
        timestamp = datetime.utcnow()
        batch = []

        for dev in self.devices:
            dev_id = dev["id"]
            anomaly = self.anomalies.get(dev_id)

            noise = (random.random() - 0.5) * 2

            target_cpu = dev["base_cpu"] + noise * 5
            if anomaly == "THERMAL_RUNAWAY":
                target_cpu = 94 + random.random() * 5

            cpu = max(10, min(99, int(target_cpu)))
            ram = max(15, min(99, int(cpu + 10 + (random.random() - 0.5) * 4)))

            thermal_inertia = (cpu - 40) * 0.35
            target_temp = dev["base_temp"] + thermal_inertia
            if anomaly == "THERMAL_RUNAWAY":
                target_temp = 86 + random.random() * 4

            temp = round(target_temp + random.random() * 1.5, 1)

            target_signal = dev["base_signal"] + noise * 2
            if anomaly == "SOLAR_FLARE":
                target_signal = -96 - random.random() * 6

            signal = max(-110, min(-40, int(target_signal)))

            packet_loss = 0.1
            if signal < -85:
                packet_loss += round((abs(signal) - 85) ** 1.4 * 0.5, 2)
            if anomaly == "PACKET_BURST":
                packet_loss += 14.0

            packet_loss = min(25.0, round(packet_loss, 2))

            latency = max(5, int(dev["base_latency"] + (random.random() - 0.5) * 6 + (packet_loss * 6)))

            status = "HEALTHY"
            if temp > 80 or signal < -90 or packet_loss > 8.0:
                status = "CRITICAL"
            elif temp > 68 or signal < -78 or packet_loss > 3.0:
                status = "WARNING"

            batch.append({
                "device_id": dev_id,
                "name": dev["name"],
                "type": dev["type"],
                "timestamp": timestamp,
                "cpu_percent": cpu,
                "ram_percent": ram,
                "temperature_celsius": temp,
                "signal_strength_dbm": signal,
                "packet_loss_percent": packet_loss,
                "latency_ms": latency,
                "battery_percent": dev["battery"],
                "status": status,
                "anomaly": anomaly
            })

        return batch
