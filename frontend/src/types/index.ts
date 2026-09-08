export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'EXTREME';
export type UserRole = 'Public User' | 'Health Official' | 'Municipal Administrator';

export interface WeatherData {
  ward_id?: number;
  ward_name?: string;
  temp_celsius: number;
  relative_humidity: number;
  wind_speed_kmh: number;
  solar_radiation_wm2: number;
  heat_index: number;
  wbgt: number;
  utci: number;
  timestamp?: string;
}

export interface WeatherForecast {
  horizon_hours: number;
  forecast_date: string;
  temp_celsius: number;
  relative_humidity: number;
  wbgt: number;
  utci: number;
  risk_level: RiskLevel;
}

export interface ExplainabilityReason {
  factor: string;
  severity: 'LOW' | 'HIGH' | 'CRITICAL';
  detail: string;
}

export interface WardRiskDetail {
  ward_id: number;
  ward_number: number;
  ward_name: string;
  zone_id: number;
  current_weather: {
    temp_celsius: number;
    relative_humidity: number;
    wind_speed_kmh: number;
    solar_radiation_wm2: number;
    heat_index: number;
    wbgt: number;
    utci: number;
  };
  vulnerability: {
    total_population: number;
    elderly_population: number;
    children_population: number;
    outdoor_workers: number;
    population_density: number;
  };
  risk_assessment: {
    htsi_score: number;
    risk_level: RiskLevel;
    mortality_risk: number;
    hospitalization_risk: number;
    confidence: number;
    explainability: ExplainabilityReason[];
  };
}

export interface WardGeoProperties {
  ward_id: number;
  ward_number: number;
  name: string;
  lat: number;
  lng: number;
  temp_celsius: number;
  relative_humidity: number;
  wbgt: number;
  utci: number;
  heat_index: number;
  htsi_score: number;
  risk_level: RiskLevel;
  mortality_risk: number;
  hospitalization_risk: number;
  total_population: number;
  elderly_population: number;
  outdoor_workers: number;
  explainability: ExplainabilityReason[];
}

export interface GeoJsonFeature {
  type: 'Feature';
  id: number;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: WardGeoProperties;
}

export interface WardGeoJson {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface Hospital {
  id: number;
  ward_id: number;
  name: string;
  address: string;
  phone: string;
  total_beds: number;
  available_beds: number;
  icu_beds_total: number;
  icu_beds_available: number;
  heat_admissions_today: number;
  status: 'READY' | 'ELEVATED' | 'CRITICAL';
  lat: number;
  lng: number;
}

export interface CoolingCenter {
  id: number;
  ward_id: number;
  name: string;
  address: string;
  capacity: number;
  occupancy: number;
  hours: string;
  facilities: string;
  contact_person: string;
  contact_phone: string;
  is_active: boolean;
  lat: number;
  lng: number;
}

export interface AlertItem {
  id: number;
  ward_id: number;
  ward_name: string;
  risk_level: RiskLevel;
  title: string;
  message: string;
  expected_start: string;
  expected_duration_hours: number;
  affected_population: number;
  status: string;
  created_at: string;
}

export interface ActionItem {
  id: number;
  alert_id: number;
  ward_id: number;
  ward_name: string;
  action_type: string;
  description: string;
  assigned_to: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: number;
  channel: 'SMS' | 'WHATSAPP';
  recipient: string;
  message_text: string;
  status: string;
  provider: string;
  sent_at: string;
}

export interface SimulationParams {
  temp_offset: number;
  humidity_offset: number;
  wind_offset: number;
  radiation_offset: number;
}

export interface SimulationResult {
  simulation_parameters: {
    temp_offset_celsius: number;
    humidity_offset_percent: number;
    wind_offset_kmh: number;
    radiation_offset_wm2: number;
  };
  kpi_summary: {
    avg_temp_celsius: number;
    avg_humidity_percent: number;
    avg_htsi_score: number;
    overall_risk_level: RiskLevel;
    avg_mortality_risk_percent: number;
    avg_hospitalization_risk_percent: number;
    risk_counts: Record<RiskLevel, number>;
  };
  geojson: WardGeoJson;
}

export interface MlEvaluationMetrics {
  dataset_status: string;
  test_samples: number;
  mortality_model: {
    mae: number;
    rmse: number;
    r2_score: number;
    accuracy: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: number[][];
  };
  feature_importance: Record<string, number>;
}
