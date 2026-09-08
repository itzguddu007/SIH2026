import React, { useEffect, useState } from 'react';
import type { MlEvaluationMetrics } from '../types';
import { api } from '../services/api';
import { ShieldAlert, Cpu, BookOpen } from 'lucide-react';

export const ModelValidation: React.FC = () => {
  const [metrics, setMetrics] = useState<MlEvaluationMetrics | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await api.getMlMetrics();
        setMetrics(res);
      } catch (e) {
        console.error('ML metrics error', e);
      }
    }
    loadMetrics();
  }, []);

  if (!metrics) {
    return <div className="p-8 text-center text-slate-500 text-xs font-mono">Loading Machine Learning Validation Matrix...</div>;
  }

  const { mortality_model, feature_importance, dataset_status } = metrics;

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-extrabold text-amber-900 uppercase tracking-wider">{dataset_status}</div>
          <p className="text-slate-700 leading-relaxed font-medium">
            Model performance shown on synthetic demonstration data and is not representative of operational performance. Operational deployment requires calibration against historical MoES NCMRWF & Ministry of Health epidemiological registries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Classification Accuracy</span>
          <div className="text-3xl font-black text-emerald-600">{(mortality_model.accuracy * 100).toFixed(1)}%</div>
          <div className="text-[10px] text-slate-400 font-mono font-medium">Binary Red-Alert Threshold</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">F1 Score</span>
          <div className="text-3xl font-black text-sky-600">{mortality_model.f1_score.toFixed(3)}</div>
          <div className="text-[10px] text-slate-400 font-mono font-medium">Harmonic Precision & Recall</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">ROC - AUC Score</span>
          <div className="text-3xl font-black text-purple-600">{mortality_model.roc_auc.toFixed(3)}</div>
          <div className="text-[10px] text-slate-400 font-mono font-medium">Area Under ROC Curve</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Mean Absolute Error (MAE)</span>
          <div className="text-3xl font-black text-amber-600">{mortality_model.mae.toFixed(4)}</div>
          <div className="text-[10px] text-slate-400 font-mono font-medium">Regression Risk Residual</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Cpu className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Scikit-Learn Feature Importance Weights
            </h3>
          </div>

          <div className="space-y-2.5">
            {Object.entries(feature_importance)
              .sort((a, b) => b[1] - a[1])
              .map(([feat, imp]) => (
                <div key={feat} className="space-y-1 text-xs">
                  <div className="flex justify-between font-mono text-slate-700 font-medium">
                    <span className="capitalize">{feat.replace('_', ' ')}</span>
                    <span className="font-bold text-sky-700">{(imp * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-sky-500 to-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, imp * 300)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Scientific Algorithm Documentation Protocol
            </h3>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-amber-800">1. NOAA Rothfusz Heat Index (HI)</div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Evaluates apparent temperature using 9-parameter multivariable polynomial regression derived from Landsberg heat balance models.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-orange-800">2. Wet-Bulb Globe Temperature (WBGT)</div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Calculates environmental heat strain using Stull (2011) natural wet-bulb approximation (T_nw) and Liljegren solar globe temperature (T_g). Formally labeled as <span className="font-mono text-amber-800 font-bold">Estimated WBGT</span>.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-purple-800">3. Universal Thermal Climate Index (UTCI)</div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                6th-order operational multi-variable polynomial model developed by ISB Commission 6 incorporating wind vector at 10m (v10) and vapor pressure (e). Formally labeled as <span className="font-mono text-purple-800 font-bold">Estimated UTCI</span>.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-emerald-800">4. Unified Human Thermal Stress Index (HTSI)</div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Configurable 0–100 unified index loaded dynamically from <span className="font-mono text-sky-700 font-bold">app/config/htsi_weights.json</span>, avoiding arbitrary double counting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
