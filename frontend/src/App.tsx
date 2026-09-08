import { useEffect, useState } from 'react';
import type { 
  UserRole, RiskLevel, WeatherForecast, WardGeoJson, 
  Hospital, CoolingCenter, AlertItem, ActionItem, NotificationLog, 
  SimulationResult, WardGeoProperties 
} from './types';
import { api } from './services/api';

import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { GisMapComponent } from './components/GisMapComponent';
import { ForecastWidget } from './components/ForecastWidget';
import { ExplainabilityCard } from './components/ExplainabilityCard';
import { AdvisoriesWidget } from './components/AdvisoriesWidget';
import { MunicipalActionCenter } from './components/MunicipalActionCenter';
import { CoolingCenterMap } from './components/CoolingCenterMap';
import { HeatSimulator } from './components/HeatSimulator';
import { HistoricalAnalytics } from './components/HistoricalAnalytics';
import { ModelValidation } from './components/ModelValidation';

import { 
  LayoutDashboard, MapPin, ShieldAlert, Home, Flame, 
  BarChart3, Cpu
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gis_map' | 'action_center' | 'cooling_hospitals' | 'simulator' | 'analytics' | 'model_val'>('dashboard');
  const [currentRole, setRole] = useState<UserRole>('Municipal Administrator');
  const [horizon, setHorizon] = useState<number>(24);
  const [gisMetric, setGisMetric] = useState<'HTSI' | 'MORTALITY' | 'VULNERABLE' | 'WORKERS'>('HTSI');

  const [currentRisk, setCurrentRisk] = useState<any>(null);
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<WardGeoJson | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [coolingCenters, setCoolingCenters] = useState<CoolingCenter[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);
  const [selectedWardProps, setSelectedWardProps] = useState<WardGeoProperties | null>(null);
  const [selectedWardDetail, setSelectedWardDetail] = useState<any>(null);

  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [riskRes, foreRes, geoRes, hospRes, coolRes, alertRes, actionRes, logRes] = await Promise.all([
        api.getCurrentRisk(),
        api.getWeatherForecast(),
        api.getWardsGeoJson(),
        api.getHospitals(),
        api.getCoolingCenters(),
        api.getAlerts(),
        api.getActionItems(),
        api.getNotificationLogs()
      ]);

      setCurrentRisk(riskRes);
      setForecasts(foreRes);
      setGeoJsonData(geoRes);
      setHospitals(hospRes);
      setCoolingCenters(coolRes);
      setAlerts(alertRes);
      setActions(actionRes);
      setLogs(logRes);

      if (geoRes?.features?.length > 0 && selectedWardId === null) {
        const firstWard = geoRes.features[0].properties;
        setSelectedWardId(firstWard.ward_id);
        setSelectedWardProps(firstWard);
      }
    } catch (e) {
      console.error('Data loading error', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedWardId === null) return;
    const wardIdToFetch = selectedWardId;
    async function loadWardDetail() {
      try {
        const detail = await api.getWardRiskDetail(wardIdToFetch);
        setSelectedWardDetail(detail);
        const fore = await api.getWeatherForecast(wardIdToFetch);
        setForecasts(fore);
      } catch (e) {
        console.error('Ward detail error', e);
      }
    }
    loadWardDetail();
  }, [selectedWardId]);

  const handleSelectWard = (id: number, props: WardGeoProperties) => {
    setSelectedWardId(id);
    setSelectedWardProps(props);
  };

  const handleSimulationRun = (simRes: SimulationResult) => {
    setGeoJsonData(simRes.geojson);
    setIsSimulating(true);
    setCurrentRisk({
      overall_htsi_score: simRes.kpi_summary.avg_htsi_score,
      overall_risk_level: simRes.kpi_summary.overall_risk_level,
      mortality_risk_percentage: simRes.kpi_summary.avg_mortality_risk_percent,
      hospitalization_risk_percentage: simRes.kpi_summary.avg_hospitalization_risk_percent,
      confidence_percentage: 85.0
    });
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    loadData();
  };

  const displayTemp = selectedWardDetail?.current_weather?.temp_celsius ?? selectedWardProps?.temp_celsius ?? 41.2;
  const displayHum = selectedWardDetail?.current_weather?.relative_humidity ?? selectedWardProps?.relative_humidity ?? 68.0;
  const displayHi = selectedWardDetail?.current_weather?.heat_index ?? selectedWardProps?.heat_index ?? 58.0;
  const displayWbgt = selectedWardDetail?.current_weather?.wbgt ?? selectedWardProps?.wbgt ?? 32.8;
  const displayUtci = selectedWardDetail?.current_weather?.utci ?? selectedWardProps?.utci ?? 44.1;
  const displayRiskLevel: RiskLevel = selectedWardDetail?.risk_assessment?.risk_level ?? selectedWardProps?.risk_level ?? currentRisk?.overall_risk_level ?? 'EXTREME';
  const displayHospRisk = selectedWardDetail?.risk_assessment?.hospitalization_risk ? selectedWardDetail.risk_assessment.hospitalization_risk * 100 : currentRisk?.hospitalization_risk_percentage ?? 68.0;
  const displayMortRisk = selectedWardDetail?.risk_assessment?.mortality_risk ? selectedWardDetail.risk_assessment.mortality_risk * 100 : currentRisk?.mortality_risk_percentage ?? 73.0;
  const displayHtsiScore = selectedWardDetail?.risk_assessment?.htsi_score ?? selectedWardProps?.htsi_score ?? 84.0;
  const displayExplainability = selectedWardDetail?.risk_assessment?.explainability ?? selectedWardProps?.explainability ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      <Header
        currentRole={currentRole}
        setRole={setRole}
        horizon={horizon}
        setHorizon={setHorizon}
        overallRiskLevel={displayRiskLevel}
        onRefresh={loadData}
        isSimulating={isSimulating}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Command Dashboard
          </button>

          <button
            onClick={() => setActiveTab('gis_map')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'gis_map'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" /> Interactive GIS Map
          </button>

          <button
            onClick={() => setActiveTab('action_center')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'action_center'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-600" /> Municipal Action Center
          </button>

          <button
            onClick={() => setActiveTab('cooling_hospitals')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'cooling_hospitals'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4 text-sky-600" /> Cooling Centers & Hospitals
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'simulator'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-600" /> What-If Simulator
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Historical Analytics
          </button>

          <button
            onClick={() => setActiveTab('model_val')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'model_val'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-600" /> ML Model Validation
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <KpiCards
              temp={displayTemp}
              humidity={displayHum}
              heatIndex={displayHi}
              wbgt={displayWbgt}
              utci={displayUtci}
              riskLevel={displayRiskLevel}
              hospitalizationRisk={displayHospRisk}
              mortalityRisk={displayMortRisk}
              selectedWardName={selectedWardProps?.name}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <GisMapComponent
                  geoJsonData={geoJsonData}
                  hospitals={hospitals}
                  coolingCenters={coolingCenters}
                  selectedWardId={selectedWardId}
                  onSelectWard={handleSelectWard}
                  activeMetric={gisMetric}
                  setActiveMetric={setGisMetric}
                />

                <AdvisoriesWidget riskLevel={displayRiskLevel} />
              </div>

              <div className="space-y-4">
                <ExplainabilityCard
                  wardName={selectedWardProps?.name || 'Selected Ward'}
                  riskLevel={displayRiskLevel}
                  htsiScore={displayHtsiScore}
                  reasons={displayExplainability}
                />

                <ForecastWidget forecasts={forecasts} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gis_map' && (
          <div className="space-y-6">
            <KpiCards
              temp={displayTemp}
              humidity={displayHum}
              heatIndex={displayHi}
              wbgt={displayWbgt}
              utci={displayUtci}
              riskLevel={displayRiskLevel}
              hospitalizationRisk={displayHospRisk}
              mortalityRisk={displayMortRisk}
              selectedWardName={selectedWardProps?.name}
            />

            <GisMapComponent
              geoJsonData={geoJsonData}
              hospitals={hospitals}
              coolingCenters={coolingCenters}
              selectedWardId={selectedWardId}
              onSelectWard={handleSelectWard}
              activeMetric={gisMetric}
              setActiveMetric={setGisMetric}
            />

            <ExplainabilityCard
              wardName={selectedWardProps?.name || 'Selected Ward'}
              riskLevel={displayRiskLevel}
              htsiScore={displayHtsiScore}
              reasons={displayExplainability}
            />
          </div>
        )}

        {activeTab === 'action_center' && (
          <MunicipalActionCenter
            alerts={alerts}
            actions={actions}
            logs={logs}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'cooling_hospitals' && (
          <CoolingCenterMap
            hospitals={hospitals}
            coolingCenters={coolingCenters}
          />
        )}

        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <HeatSimulator
              onSimulationRun={handleSimulationRun}
              onResetSimulation={handleResetSimulation}
              isSimulating={isSimulating}
            />

            <GisMapComponent
              geoJsonData={geoJsonData}
              hospitals={hospitals}
              coolingCenters={coolingCenters}
              selectedWardId={selectedWardId}
              onSelectWard={handleSelectWard}
              activeMetric={gisMetric}
              setActiveMetric={setGisMetric}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <HistoricalAnalytics />
        )}

        {activeTab === 'model_val' && (
          <ModelValidation />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-auto text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">MoES NCMRWF Operational Prototype</span>
          <span>•</span>
          <span>Disaster Management Problem Statement 26083</span>
        </div>
        <div className="font-mono text-[11px] text-slate-600">
          Formulations: NOAA Rothfusz HI | Stull WBGT | Bröde UTCI | Random Forest Risk Model
        </div>
      </footer>
    </div>
  );
}

export default App;
