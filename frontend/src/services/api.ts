import type { 
  WeatherForecast, WardRiskDetail, WardGeoJson, 
  Hospital, CoolingCenter, AlertItem, ActionItem, NotificationLog, 
  SimulationParams, SimulationResult, MlEvaluationMetrics 
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Weather
  getCurrentWeather: (wardId?: number) => 
    fetchJson<any>(`${API_BASE_URL}/weather/current${wardId ? `?ward_id=${wardId}` : ''}`),
  
  getWeatherForecast: (wardId?: number) => 
    fetchJson<WeatherForecast[]>(`${API_BASE_URL}/weather/forecast${wardId ? `?ward_id=${wardId}` : ''}`),

  // Risk
  getCurrentRisk: (zoneId?: number) => 
    fetchJson<any>(`${API_BASE_URL}/risk/current${zoneId ? `?zone_id=${zoneId}` : ''}`),
  
  getWardRiskDetail: (wardId: number) => 
    fetchJson<WardRiskDetail>(`${API_BASE_URL}/risk/ward/${wardId}`),

  // GIS
  getWardsGeoJson: () => 
    fetchJson<WardGeoJson>(`${API_BASE_URL}/map/wards`),
  
  getHospitals: () => 
    fetchJson<Hospital[]>(`${API_BASE_URL}/map/hospitals`),
  
  getCoolingCenters: () => 
    fetchJson<CoolingCenter[]>(`${API_BASE_URL}/map/cooling-centers`),

  // Alerts & Notifications
  getAlerts: () => 
    fetchJson<AlertItem[]>(`${API_BASE_URL}/alerts`),
  
  sendNotification: (payload: { ward_id: number; channel: string; recipient: string; custom_message?: string }) => 
    fetchJson<any>(`${API_BASE_URL}/alerts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),

  getNotificationLogs: () => 
    fetchJson<NotificationLog[]>(`${API_BASE_URL}/alerts/logs`),

  // Action Items
  getActionItems: () => 
    fetchJson<ActionItem[]>(`${API_BASE_URL}/actions`),
  
  assignAction: (action_id: number, assigned_to: string, notes?: string) => 
    fetchJson<any>(`${API_BASE_URL}/actions/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id, assigned_to, notes })
    }),

  completeAction: (action_id: number, notes?: string) => 
    fetchJson<any>(`${API_BASE_URL}/actions/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id, notes })
    }),

  // Simulation
  runSimulation: (params: SimulationParams) => 
    fetchJson<SimulationResult>(`${API_BASE_URL}/simulation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    }),

  // Analytics
  getHistoricalAnalytics: (wardId: number = 1) => 
    fetchJson<any>(`${API_BASE_URL}/analytics/historical?ward_id=${wardId}`),
  
  getCorrelations: () => 
    fetchJson<any[]>(`${API_BASE_URL}/analytics/correlations`),

  // ML Evaluation
  getMlMetrics: () => 
    fetchJson<MlEvaluationMetrics>(`${API_BASE_URL}/ml/metrics`),

  // Interactive Thermal Calculations
  calculateHtsi: (payload: { temp_celsius: number; relative_humidity: number; wind_speed_kmh: number; solar_radiation_wm2: number }) => 
    fetchJson<any>(`${API_BASE_URL}/thermal/htsi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
};
