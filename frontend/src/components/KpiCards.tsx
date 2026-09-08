import React from 'react';
import type { RiskLevel } from '../types';
import { Thermometer, Droplets, Sun, Wind, Activity, HeartPulse, AlertCircle, ShieldAlert } from 'lucide-react';

interface KpiCardsProps {
  temp: number;
  humidity: number;
  heatIndex: number;
  wbgt: number;
  utci: number;
  riskLevel: RiskLevel;
  hospitalizationRisk: number;
  mortalityRisk: number;
  selectedWardName?: string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  temp,
  humidity,
  heatIndex,
  wbgt,
  utci,
  riskLevel,
  hospitalizationRisk,
  mortalityRisk,
  selectedWardName
}) => {
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'LOW': return 'bg-emerald-50 border-emerald-300 text-emerald-800';
      case 'MODERATE': return 'bg-amber-50 border-amber-300 text-amber-800';
      case 'HIGH': return 'bg-orange-50 border-orange-300 text-orange-800';
      case 'VERY HIGH': return 'bg-red-50 border-red-300 text-red-800';
      case 'EXTREME': return 'bg-red-600 border-red-700 text-white shadow-md';
      default: return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  return (
    <div className="space-y-2">
      {selectedWardName && (
        <div className="text-xs text-sky-700 font-semibold flex items-center gap-1.5 px-1">
          <Activity className="w-3.5 h-3.5" />
          Displaying localized metrics for: <span className="font-extrabold text-slate-900">{selectedWardName}</span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Temp */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{temp.toFixed(1)}°C</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Air Temp (Dry-Bulb)</div>
        </div>

        {/* Humidity */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Humidity</span>
            <Droplets className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 tracking-tight">{humidity.toFixed(1)}%</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Relative Humidity</div>
        </div>

        {/* Heat Index */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Heat Index</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">{heatIndex.toFixed(1)}°C</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">NOAA Rothfusz HI</div>
        </div>

        {/* WBGT */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">WBGT</span>
            <Wind className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-orange-600 tracking-tight">{wbgt.toFixed(1)}°C</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Wet-Bulb Globe (Est)</div>
        </div>

        {/* UTCI */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">UTCI</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 tracking-tight">{utci.toFixed(1)}°C</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Universal Thermal (Est)</div>
        </div>

        {/* Risk Level */}
        <div className={`border rounded-xl p-3 shadow-sm flex flex-col justify-between ${getRiskColor(riskLevel)}`}>
          <div className="flex items-center justify-between mb-1 opacity-90">
            <span className="text-xs font-semibold">Risk Level</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-xl font-black tracking-wider uppercase">{riskLevel}</div>
          <div className="text-[10px] opacity-80 mt-1 font-medium">HTSI Stress Level</div>
        </div>

        {/* Hospitalization Risk */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Hosp. Risk</span>
            <HeartPulse className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">{hospitalizationRisk.toFixed(0)}%</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Predicted Inflow</div>
        </div>

        {/* Mortality Risk */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Mortality</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600 tracking-tight">{mortalityRisk.toFixed(0)}%</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">ML Estimate (MRI)</div>
        </div>
      </div>
    </div>
  );
};
