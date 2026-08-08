"""
Predictive Failure Risk Service
-------------------------------
Calculates mathematical rate-of-change failure risk scores (0-100%) and ETTF projections.
"""


class HeuristicPredictorService:
    def predict_risk(self, telemetry_item: dict) -> dict:
        temp = telemetry_item["temperature_celsius"]
        signal = telemetry_item["signal_strength_dbm"]
        loss = telemetry_item["packet_loss_percent"]
        anomaly = telemetry_item.get("anomaly")

        thermal_component = max(0.0, (temp - 50.0) * 1.5)
        rf_component = max(0.0, (abs(signal) - 65.0) * 1.8)
        loss_component = loss * 3.0

        anomaly_boost = 0.0
        if anomaly == "THERMAL_RUNAWAY":
            anomaly_boost = 55.0
        elif anomaly == "SOLAR_FLARE":
            anomaly_boost = 60.0

        raw_score = (thermal_component * 0.4) + (rf_component * 0.4) + (loss_component * 0.2) + anomaly_boost
        risk_score = min(99, max(2, int(raw_score)))

        if risk_score > 65:
            risk_level = "CRITICAL"
            ettf = "< 8 minutes"
            mode = "Thermal Overheat Runaway" if temp > 75 else "Transponder RF Link Loss"
            action = "Throttle payload & activate auxiliary thermal cooling"
        elif risk_score > 35:
            risk_level = "MEDIUM"
            ettf = "~ 25 minutes"
            mode = "Elevated Thermal Drift" if temp > 65 else "Atmospheric RF Attenuation"
            action = "Monitor solar angle & reduce high-bandwidth processing"
        else:
            risk_level = "LOW"
            ettf = "Stable"
            mode = "Nominal Operations"
            action = "Maintain standard telemetry window"

        return {
            "device_id": telemetry_item["device_id"],
            "name": telemetry_item["name"],
            "risk_score": risk_score,
            "risk_level": risk_level,
            "primary_failure_mode": mode,
            "ettf": ettf,
            "recommended_action": action
        }
