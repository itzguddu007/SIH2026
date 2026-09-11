import type { 
  WeatherForecast, WardRiskDetail, WardGeoJson, 
  Hospital, CoolingCenter, AlertItem, ActionItem, NotificationLog, 
  SimulationParams, SimulationResult, MlEvaluationMetrics, CityLocation 
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
  // Locations
  getLocations: () =>
    fetchJson<CityLocation[]>(`${API_BASE_URL}/locations`),

  // Weather
  getCurrentWeather: (wardId?: number, locationId?: number) => 
    fetchJson<any>(`${API_BASE_URL}/weather/current?${wardId ? `ward_id=${wardId}&` : ''}${locationId ? `location_id=${locationId}` : ''}`),
  
  getWeatherForecast: (wardId?: number, locationId?: number) => 
    fetchJson<WeatherForecast[]>(`${API_BASE_URL}/weather/forecast?${wardId ? `ward_id=${wardId}&` : ''}${locationId ? `location_id=${locationId}` : ''}`),

  syncLiveWeather: (locationId?: number) =>
    fetchJson<any>(`${API_BASE_URL}/weather/sync-live${locationId ? `?location_id=${locationId}` : ''}`, { method: 'POST' }),

  getSyncStatus: () =>
    fetchJson<any>(`${API_BASE_URL}/weather/sync-status`),

  // Risk
  getCurrentRisk: (zoneId?: number, locationId?: number) => 
    fetchJson<any>(`${API_BASE_URL}/risk/current?${zoneId ? `zone_id=${zoneId}&` : ''}${locationId ? `location_id=${locationId}` : ''}`),
  
  getWardRiskDetail: (wardId: number) => 
    fetchJson<WardRiskDetail>(`${API_BASE_URL}/risk/ward/${wardId}`),

  // GIS
  getWardsGeoJson: (locationId?: number) => 
    fetchJson<WardGeoJson>(`${API_BASE_URL}/map/wards${locationId ? `?location_id=${locationId}` : ''}`),
  
  getHospitals: (locationId?: number) => 
    fetchJson<Hospital[]>(`${API_BASE_URL}/map/hospitals${locationId ? `?location_id=${locationId}` : ''}`),
  
  getCoolingCenters: (locationId?: number) => 
    fetchJson<CoolingCenter[]>(`${API_BASE_URL}/map/cooling-centers${locationId ? `?location_id=${locationId}` : ''}`),

  // Alerts & Notifications
  getAlerts: (locationId?: number) => 
    fetchJson<AlertItem[]>(`${API_BASE_URL}/alerts${locationId ? `?location_id=${locationId}` : ''}`),

  getActionItems: (locationId?: number) => 
    fetchJson<ActionItem[]>(`${API_BASE_URL}/actions${locationId ? `?location_id=${locationId}` : ''}`),

  sendNotification: (payload: { ward_id: number; channel: string; recipient: string; custom_message?: string }) => 
    fetchJson<any>(`${API_BASE_URL}/alerts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),

  getNotificationLogs: () => 
    fetchJson<NotificationLog[]>(`${API_BASE_URL}/alerts/logs`),

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
