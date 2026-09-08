import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

export const HistoricalAnalytics: React.FC = () => {
  const [correlations, setCorrelations] = useState<any[]>([]);
  const [wardData, setWardData] = useState<any>(null);
  const [selectedWardId, setSelectedWardId] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const corrRes = await api.getCorrelations();
        setCorrelations(corrRes);

        const wardRes = await api.getHistoricalAnalytics(selectedWardId);
        setWardData(wardRes);
      } catch (e) {
        console.error('Analytics load error', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedWardId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-xs font-mono">Loading Historical Health Analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-sky-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Historical Heat-Health Correlation Analytics (30-Day Epidemiological Log)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Correlating maximum daily thermal stress index against emergency hospital admissions and mortality.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-semibold">
          <span className="text-slate-600">Select Ward:</span>
          <select
            value={selectedWardId}
            onChange={(e) => setSelectedWardId(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900"
          >
            {Array.from({ length: 25 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Ward {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span>City-Wide Daily Mean HTSI vs. Emergency Heat Hospital Admissions</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={correlations} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis yAxisId="left" stroke="#d97706" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" stroke="#e11d48" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.5rem', fontSize: '12px', color: '#0f172a' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line yAxisId="left" type="monotone" dataKey="avg_htsi" name="Avg HTSI Score (0-100)" stroke="#d97706" strokeWidth={2.5} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="total_hospitalizations" name="Total Daily Hospitalizations" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {wardData && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-600" />
              {wardData.ward_name} — 30-Day Heat Stroke & Mortality Incidence
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardData.trend_data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.5rem', fontSize: '12px', color: '#0f172a' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="heat_stroke_cases" name="Heat Stroke Cases" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mortality_count" name="Mortality Count" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
