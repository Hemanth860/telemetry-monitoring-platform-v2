/**
 * HTML5 2D Canvas Line Chart Engine
 * ----------------------------------
 * Direct 2D pixel buffer context renderer for 60 FPS streaming telemetry graphs.
 */

export class TelemetryChart {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.setupDpi();
  }

  setupDpi() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  render(options) {
    const {
      data = [],
      label = "Metric",
      unit = "",
      color = "#06b6d4",
      thresholdValue = null,
      minVal = null,
      maxVal = null
    } = options;

    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Awaiting Telemetry Data...", width / 2, height / 2);
      return;
    }

    const vals = data.map(d => d.val);
    let dataMin = minVal !== null ? minVal : Math.min(...vals);
    let dataMax = maxVal !== null ? maxVal : Math.max(...vals);

    if (thresholdValue !== null) {
      dataMin = Math.min(dataMin, thresholdValue);
      dataMax = Math.max(dataMax, thresholdValue);
    }

    const margin = (dataMax - dataMin) * 0.1 || 5;
    const yMin = dataMin - margin;
    const yMax = dataMax + margin;
    const range = yMax - yMin;

    const padding = { top: 25, right: 35, bottom: 30, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const getX = (index) => padding.left + (index / (data.length - 1 || 1)) * chartW;
    const getY = (val) => padding.top + chartH - ((val - yMin) / range) * chartH;

    // Grid lines
    const steps = 4;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter, sans-serif";

    for (let i = 0; i <= steps; i++) {
      const y = padding.top + (i / steps) * chartH;
      const val = (yMax - (i / steps) * (yMax - yMin)).toFixed(0);

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(`${val}${unit}`, 5, y + 3);
    }

    // Limit Threshold Line
    if (thresholdValue !== null && thresholdValue >= yMin && thresholdValue <= yMax) {
      const threshY = getY(thresholdValue);
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.moveTo(padding.left, threshY);
      ctx.lineTo(width - padding.right, threshY);
      ctx.stroke();

      ctx.fillStyle = "#ef4444";
      ctx.font = "10px monospace";
      ctx.fillText(`Limit: ${thresholdValue}${unit}`, width - padding.right - 70, threshY - 4);
      ctx.restore();
    }

    // Gradient Fill
    const fillGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    fillGradient.addColorStop(0, `${color}44`);
    fillGradient.addColorStop(1, `${color}00`);

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(data[0].val));

    for (let i = 1; i < data.length; i++) {
      const xc = (getX(i) + getX(i - 1)) / 2;
      const yc = (getY(data[i].val) + getY(data[i - 1].val)) / 2;
      ctx.quadraticCurveTo(getX(i - 1), getY(data[i - 1].val), xc, yc);
    }
    ctx.lineTo(getX(data.length - 1), getY(data[data.length - 1].val));
    ctx.lineTo(getX(data.length - 1), height - padding.bottom);
    ctx.lineTo(getX(0), height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = fillGradient;
    ctx.fill();

    // Main Line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";

    ctx.moveTo(getX(0), getY(data[0].val));
    for (let i = 1; i < data.length; i++) {
      const xc = (getX(i) + getX(i - 1)) / 2;
      const yc = (getY(data[i].val) + getY(data[i - 1].val)) / 2;
      ctx.quadraticCurveTo(getX(i - 1), getY(data[i - 1].val), xc, yc);
    }
    ctx.lineTo(getX(data.length - 1), getY(data[data.length - 1].val));
    ctx.stroke();

    // Pulse dot
    const lastX = getX(data.length - 1);
    const lastY = getY(data[data.length - 1].val);

    ctx.save();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }
}
