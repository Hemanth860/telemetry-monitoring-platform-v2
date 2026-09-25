/**
 * API Client — Centralised HTTP layer for the React frontend.
 * -----------------------------------------------------------
 * All HTTP calls to the FastAPI backend originate from this module.
 * Components MUST NOT call fetch() directly.
 *
 * Base URL is configured via VITE_API_BASE_URL environment variable.
 * Default: http://127.0.0.1:8000
 *
 * Authentication:
 *   Call setAuthToken(token) after login.  All subsequent requests
 *   automatically include the Authorization: Bearer <token> header.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

let _authToken = null;

/**
 * Set the JWT token for authenticated requests.
 * @param {string|null} token
 */
export function setAuthToken(token) {
  _authToken = token;
}

/**
 * Get the current auth token (used for display purposes only).
 */
export function getAuthToken() {
  return _authToken;
}

/**
 * Internal HTTP helper.
 * @param {string} path      - API path, e.g. '/api/telemetry'
 * @param {object} options   - fetch options
 * @param {AbortSignal} [signal] - AbortController signal for cleanup
 */
async function request(path, options = {}, signal = undefined) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    signal,
  });

  if (!response.ok) {
    // Attempt to parse error body
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      errorDetail = errBody.detail || JSON.stringify(errBody);
    } catch (_) {
      // ignore parse error
    }

    const error = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{access_token, user}>}
 */
export async function login(username, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setAuthToken(data.access_token);
  return data;
}

/**
 * Log out — clear the stored token.
 */
export function logout() {
  setAuthToken(null);
}

// ─────────────────────────────────────────────────────────
// Devices / Fleet
// ─────────────────────────────────────────────────────────

/**
 * GET /api/devices — All devices in the fleet.
 * @param {AbortSignal} [signal]
 */
export async function fetchDevices(signal) {
  return request('/api/devices', {}, signal);
}

/**
 * POST /api/devices/anomaly/inject — Inject a fault (admin only).
 * @param {string} deviceId
 * @param {string} anomalyType
 */
export async function injectAnomaly(deviceId, anomalyType = 'THERMAL_RUNAWAY') {
  return request(
    `/api/devices/anomaly/inject?device_id=${encodeURIComponent(deviceId)}&anomaly_type=${encodeURIComponent(anomalyType)}`,
    { method: 'POST' }
  );
}

/**
 * POST /api/devices/anomaly/resolve — Resolve a fault (admin only).
 * @param {string} deviceId
 */
export async function resolveAnomaly(deviceId) {
  return request(
    `/api/devices/anomaly/resolve?device_id=${encodeURIComponent(deviceId)}`,
    { method: 'POST' }
  );
}

// ─────────────────────────────────────────────────────────
// Telemetry
// ─────────────────────────────────────────────────────────

/**
 * GET /api/telemetry — Latest telemetry record per device.
 * @param {AbortSignal} [signal]
 */
export async function fetchLatestTelemetry(signal) {
  return request('/api/telemetry', {}, signal);
}

/**
 * GET /api/telemetry/history/{device_id} — Historical records.
 * @param {string} deviceId
 * @param {number} limit
 * @param {AbortSignal} [signal]
 */
export async function fetchTelemetryHistory(deviceId, limit = 50, signal) {
  return request(
    `/api/telemetry/history/${encodeURIComponent(deviceId)}?limit=${limit}`,
    {},
    signal
  );
}

// ─────────────────────────────────────────────────────────
// Alerts
// ─────────────────────────────────────────────────────────

/**
 * GET /api/alerts — All alerts (filterable).
 * @param {string} filterType  'ACTIVE' | 'CRITICAL' | 'WARNING' | 'ALL'
 * @param {AbortSignal} [signal]
 */
export async function fetchAlerts(filterType = 'ACTIVE', signal) {
  return request(`/api/alerts?filter_type=${encodeURIComponent(filterType)}`, {}, signal);
}

/**
 * POST /api/alerts/resolve — Resolve an alert (admin only).
 * @param {string} alertId
 */
export async function resolveAlert(alertId) {
  return request('/api/alerts/resolve', {
    method: 'POST',
    body: JSON.stringify({ alert_id: alertId }),
  });
}

// ─────────────────────────────────────────────────────────
// Predictions
// ─────────────────────────────────────────────────────────

/**
 * GET /api/predictions — Latest prediction for all devices.
 * @param {AbortSignal} [signal]
 */
export async function fetchPredictions(signal) {
  return request('/api/predictions', {}, signal);
}

/**
 * GET /api/predictions/{device_id} — Prediction for one device.
 * @param {string} deviceId
 * @param {AbortSignal} [signal]
 */
export async function fetchPredictionForDevice(deviceId, signal) {
  return request(`/api/predictions/${encodeURIComponent(deviceId)}`, {}, signal);
}
