import React from 'react';
import type { ExplainabilityReason, RiskLevel } from '../types';
import { HelpCircle, CheckCircle2, AlertOctagon, Info } from 'lucide-react';

interface ExplainabilityCardProps {
  wardName: string;
  riskLevel: RiskLevel;
  htsiScore: number;
  reasons: ExplainabilityReason[];
}

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({
  wardName,
  riskLevel,
  htsiScore,
  reasons
}) => {
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300 font-bold';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300 font-semibold';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-600" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Explainability Engine: Rationale Roster
          </h2>
        </div>
        <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-mono font-bold">
          {wardName}
        </span>
      </div>

      <p className="text-xs text-slate-600">
        Algorithmic decomposition of key environmental and demographic drivers contributing to the <span className="font-bold text-slate-900">{riskLevel} ({htsiScore}/100)</span> stress level:
      </p>

      <div className="space-y-2">
        {reasons && reasons.length > 0 ? (
          reasons.map((r, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-start gap-2.5">
              {r.severity === 'CRITICAL' ? (
                <AlertOctagon className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{r.factor}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono ${getSeverityBadge(r.severity)}`}>
                    {r.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">{r.detail}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-500 italic p-3 text-center bg-slate-50 rounded-lg border border-slate-200">
            No critical thermal stress anomalies detected for this location.
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
        <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        <span>Feature importances derived from NCMRWF epidemiological random forest regressor.</span>
      </div>
    </div>
  );
};
