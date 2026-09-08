import React, { useState } from 'react';
import type { SimulationParams, SimulationResult } from '../types';
import { api } from '../services/api';
import { Sliders, Flame, Activity } from 'lucide-react';

interface HeatSimulatorProps {
  onSimulationRun: (result: SimulationResult) => void;
  onResetSimulation: () => void;
  isSimulating: boolean;
}

export const HeatSimulator: React.FC<HeatSimulatorProps> = ({
  onSimulationRun,
  onResetSimulation,
  isSimulating
}) => {
  const [params, setParams] = useState<SimulationParams>({
    temp_offset: 2.5,
    humidity_offset: 15.0,
    wind_offset: -4.0,
    radiation_offset: 200.0
  });

  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

  const handleSliderChange = (field: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await api.runSimulation(params);
      setLastResult(res);
      onSimulationRun(res);
    } catch (e) {
      alert('Failed to execute simulation engine');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setParams({
      temp_offset: 0,
      humidity_offset: 0,
      wind_offset: 0,
      radiation_offset: 0
    });
    setLastResult(null);
    onResetSimulation();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-amber-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Real-Time Interactive Heatwave Scenario Simulator
            </h2>
            <p className="text-xs text-slate-500">
              Perform what-if sensitivity analysis across all 25 city wards by dynamically perturbing meteorological forcing parameters.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSimulating && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs border border-slate-300 font-semibold transition"
            >
              Reset to Baseline
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-amber-700">Temperature Offset</span>
            <span className="font-mono text-slate-900 font-extrabold">+{params.temp_offset.toFixed(1)}°C</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={params.temp_offset}
            onChange={(e) => handleSliderChange('temp_offset', parseFloat(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>+0°C</span>
            <span>+2.5°C</span>
            <span>+5.0°C</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-sky-700">Humidity Offset</span>
            <span className="font-mono text-slate-900 font-extrabold">+{params.humidity_offset.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={params.humidity_offset}
            onChange={(e) => handleSliderChange('humidity_offset', parseFloat(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>+0%</span>
            <span>+15%</span>
            <span>+30%</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-purple-700">Wind Stagnation</span>
            <span className="font-mono text-slate-900 font-extrabold">{params.wind_offset.toFixed(1)} km/h</span>
          </div>
          <input
            type="range"
            min="-10"
            max="0"
            step="0.5"
            value={params.wind_offset}
            onChange={(e) => handleSliderChange('wind_offset', parseFloat(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>-10 km/h</span>
            <span>-5 km/h</span>
            <span>0 km/h</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-orange-700">Solar Radiation Spike</span>
            <span className="font-mono text-slate-900 font-extrabold">+{params.radiation_offset.toFixed(0)} W/m²</span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            step="25"
            value={params.radiation_offset}
            onChange={(e) => handleSliderChange('radiation_offset', parseFloat(e.target.value))}
            className="w-full accent-orange-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>+0 W/m²</span>
            <span>+250 W/m²</span>
            <span>+500 W/m²</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-500 font-medium">
          Adjust sliders to simulate cascading heat wave intensity across all 25 wards.
        </div>

        <button
          onClick={handleRun}
          disabled={loading}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold rounded-lg shadow-md text-xs flex items-center gap-2 transition"
        >
          <Sliders className="w-4 h-4" />
          {loading ? 'Recalculating City Thermal Physics...' : 'Run Real-Time Simulation Engine'}
        </button>
      </div>

      {lastResult && (
        <div className="bg-amber-50/50 border border-amber-300 rounded-xl p-4 space-y-3 font-mono text-xs shadow-sm">
          <div className="flex items-center justify-between text-amber-800 border-b border-amber-200 pb-2">
            <span className="font-bold font-sans text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600" />
              SIMULATION ENGINE OUTPUT SUMMARY
            </span>
            <span className="text-[11px] bg-amber-200/60 px-2 py-0.5 rounded font-bold">
              Recalculated across 25 Wards
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">Simulated Avg Temp:</span>
              <span className="text-lg font-black text-slate-900">{lastResult.kpi_summary.avg_temp_celsius}°C</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Simulated Avg HTSI:</span>
              <span className="text-lg font-black text-amber-700">{lastResult.kpi_summary.avg_htsi_score}/100</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Avg Hosp. Inflow Risk:</span>
              <span className="text-lg font-black text-rose-700">{lastResult.kpi_summary.avg_hospitalization_risk_percent}%</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Avg Mortality Risk:</span>
              <span className="text-lg font-black text-red-700">{lastResult.kpi_summary.avg_mortality_risk_percent}%</span>
            </div>
          </div>

          <div className="border-t border-amber-200 pt-2 flex flex-wrap items-center gap-3 text-[11px]">
            <span className="text-slate-600 font-semibold">Simulated Ward Risk Counts:</span>
            {Object.entries(lastResult.kpi_summary.risk_counts).map(([lvl, count]) => (
              <span key={lvl} className="px-2 py-0.5 bg-white rounded border border-amber-200 text-slate-800 font-bold">
                <span className="text-amber-800">{lvl}:</span> {count} Wards
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
