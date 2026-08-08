/**
 * AI Failure Risk Predictor Engine
 * --------------------------------
 * Calculates mathematical rate-of-change failure risk scores (0-100%) and ETTF projections.
 */

export class FailurePredictor {
  predictFleet(devices) {
    return devices.map(dev => this.predictNode(dev));
  }

  predictNode(dev) {
    const history = dev.history || [];
    const windowSize = Math.min(history.length, 10);

    let thermalVelocity = 0;
    let rfDecayVelocity = 0;

    if (windowSize >= 2) {
      const recent = history.slice(-windowSize);
      const first = recent[0];
      const last = recent[recent.length - 1];
      const timeSpanSec = (new Date(last.timestamp) - new Date(first.timestamp)) / 1000 || 1;

      thermalVelocity = (last.temp - first.temp) / timeSpanSec;
      rfDecayVelocity = (first.signal - last.signal) / timeSpanSec;
    }

    const tempMargin = Math.max(0, dev.currentTemp - 50);
    const signalMargin = Math.max(0, Math.abs(dev.currentSignal) - 65);
    const lossMargin = dev.currentPacketLoss;

    let rawRisk = (tempMargin * 1.5) + (signalMargin * 1.8) + (lossMargin * 3.5);

    if (thermalVelocity > 0.3) rawRisk += thermalVelocity * 30;
    if (rfDecayVelocity > 0.5) rawRisk += rfDecayVelocity * 25;

    if (dev.anomaly === "THERMAL_RUNAWAY") rawRisk += 50;
    if (dev.anomaly === "SOLAR_FLARE") rawRisk += 55;

    const riskScore = Math.min(99, Math.max(3, Math.round(rawRisk)));

    let riskLevel = "NOMINAL";
    let ettf = "Nominal";
    let primaryFailureMode = "None";
    let recommendedAction = "Maintain standard telemetry schedule";

    if (riskScore > 65) {
      riskLevel = "CRITICAL";
      ettf = "< 8 minutes";
      primaryFailureMode = dev.currentTemp > 75 ? "Thermal Overheat Runaway" : "RF Transponder Signal Loss";
      recommendedAction = "Throttle payload & activate auxiliary thermal cooling";
    } else if (riskScore > 35) {
      riskLevel = "WARNING";
      ettf = "~ 25 minutes";
      primaryFailureMode = dev.currentTemp > 65 ? "Elevated Thermal Drift" : "Atmospheric RF Attenuation";
      recommendedAction = "Monitor solar angle & reduce high-bandwidth processing";
    }

    return {
      nodeId: dev.id,
      nodeName: dev.name,
      riskScore,
      riskLevel,
      thermalVelocity: thermalVelocity.toFixed(2),
      rfDecayVelocity: rfDecayVelocity.toFixed(2),
      primaryFailureMode,
      ettf,
      recommendedAction
    };
  }
}
