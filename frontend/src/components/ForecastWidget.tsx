import React from 'react';
import type { WeatherForecast, RiskLevel } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';

interface ForecastWidgetProps {
  forecasts: WeatherForecast[];
}

export const ForecastWidget: React.FC<ForecastWidgetProps> = ({ forecasts }) => {
  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'LOW': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'MODERATE': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'VERY HIGH': return 'bg-red-100 text-red-800 border-red-300';
      case 'EXTREME': return 'bg-red-600 text-white border-red-700 font-bold';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const chartData = forecasts.map((f) => ({
    horizon: `+${f.horizon_hours}h`,
    temp: f.temp_celsius,
    wbgt: f.wbgt,
    utci: f.utci,
    humidity: f.relative_humidity
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            5-Day Predictive Thermal Forecast Horizon (NCMRWF)
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-mono font-medium">3–5 Day Predictive Horizon</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5">Horizon</th>
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">Temp (°C)</th>
              <th className="px-3 py-2.5">Humidity (%)</th>
              <th className="px-3 py-2.5">WBGT (°C)</th>
              <th className="px-3 py-2.5">UTCI (°C)</th>
              <th className="px-3 py-2.5 text-center">Predicted Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {forecasts.map((f) => (
              <tr key={f.horizon_hours} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2.5 font-bold text-sky-700">+{f.horizon_hours} Hours</td>
                <td className="px-3 py-2.5 text-slate-500">{f.forecast_date}</td>
                <td className="px-3 py-2.5 font-bold text-slate-900">{f.temp_celsius}°C</td>
                <td className="px-3 py-2.5 text-sky-600">{f.relative_humidity}%</td>
                <td className="px-3 py-2.5 text-orange-600 font-bold">{f.wbgt}°C</td>
                <td className="px-3 py-2.5 text-purple-700 font-bold">{f.utci}°C</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-block px-2.5 py-1 rounded text-[10px] uppercase border ${getRiskBadge(f.risk_level)}`}>
                    {f.risk_level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span>Thermal Indices Trend Trajectory (24h to 120h)</span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="horizon" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.5rem', fontSize: '12px', color: '#0f172a' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line type="monotone" dataKey="temp" name="Air Temp (°C)" stroke="#d97706" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="wbgt" name="WBGT (°C)" stroke="#ea580c" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="utci" name="UTCI (°C)" stroke="#9333ea" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#0284c7" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
