import React from 'react';
import type { UserRole, RiskLevel, CityLocation } from '../types';
import { AlertTriangle, Shield, Bell, RefreshCw, Building2 } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  horizon: number;
  setHorizon: (h: number) => void;
  overallRiskLevel: RiskLevel;
  onRefresh: () => void;
  isSimulating: boolean;
  onSyncLive?: () => void;
  isLiveSyncing?: boolean;
  syncStatus?: any;
  locations?: CityLocation[];
  selectedLocationId?: number;
  setSelectedLocationId?: (id: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setRole,
  horizon,
  setHorizon,
  overallRiskLevel,
  onRefresh,
  isSimulating,
  onSyncLive,
  isLiveSyncing = false,
  syncStatus,
  locations = [],
  selectedLocationId,
  setSelectedLocationId
}) => {
  const getRiskBadgeColor = (level: RiskLevel) => {
    switch (level) {
      case 'LOW': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'MODERATE': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'VERY HIGH': return 'bg-red-100 text-red-800 border-red-300';
      case 'EXTREME': return 'bg-red-600 text-white border-red-700 animate-pulse font-extrabold';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      {/* Top MoES Government Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-amber-400 tracking-wide flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            GOVERNMENT OF INDIA • MINISTRY OF EARTH SCIENCES (MoES)
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-slate-300">
            National Centre for Medium Range Weather Forecasting (NCMRWF)
          </span>
          <span className="hidden lg:inline bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
            Problem Statement ID: 26083
          </span>
        </div>
        <div className="flex items-center gap-3">
          {syncStatus?.is_live ? (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              LIVE OPEN-METEO WEATHER FEED ACTIVE
            </span>
          ) : (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
              DEMONSTRATION & PROTOTYPE MODE
            </span>
          )}

          {onSyncLive && (
            <button
              onClick={onSyncLive}
              disabled={isLiveSyncing}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                isLiveSyncing 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
              title="Fetch Real-Time Live Weather from Open-Meteo API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-spin' : ''}`} />
              <span>{isLiveSyncing ? 'Syncing Weather...' : 'Sync Live Weather'}</span>
            </button>
          )}

          <button 
            onClick={onRefresh}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors ml-1"
            title="Refresh Dashboard View"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
      </div>


      {/* Main Command Header */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-red-600 to-amber-600 rounded-lg shadow-md">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Extreme Heatwave Early Warning System
              {isSimulating && (
                <span className="text-xs bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full font-sans font-medium">
                  SIMULATION ACTIVE
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500">
              Localized Human Thermal Stress Index & 3–5 Day Predictive Health Risk Dispatch
            </p>
          </div>
        </div>

        {/* Status & Control Panel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* City Selector Dropdown */}
          {locations && locations.length > 0 && setSelectedLocationId && (
            <div className="flex items-center bg-slate-900 text-white p-1.5 rounded-md border border-slate-700 text-xs shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-amber-400 mr-1.5 ml-1" />
              <span className="text-slate-400 font-semibold mr-1.5 hidden sm:inline">City:</span>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                className="bg-slate-800 text-white font-bold py-1 px-2 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.state})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Overall Danger Level Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-bold shadow-sm ${getRiskBadgeColor(overallRiskLevel)}`}>
            <Bell className="w-4 h-4" />
            <span>CITY RISK: {overallRiskLevel}</span>
          </div>

          {/* Forecast Horizon Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
            <span className="text-slate-500 px-2 font-semibold">Horizon:</span>
            {[24, 48, 72, 96, 120].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  horizon === h
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {h}h ({h / 24}d)
              </button>
            ))}
          </div>

          {/* Role-Based Access Control Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
            <span className="text-slate-500 px-2 font-semibold">Role:</span>
            {(['Public User', 'Health Official', 'Municipal Administrator'] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setRole(role)}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  currentRole === role
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

