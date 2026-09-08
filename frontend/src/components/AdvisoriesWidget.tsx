import React from 'react';
import type { RiskLevel } from '../types';
import { ShieldCheck, AlertTriangle, Users, Hospital, Building2 } from 'lucide-react';

interface AdvisoriesWidgetProps {
  riskLevel: RiskLevel;
}

export const AdvisoriesWidget: React.FC<AdvisoriesWidgetProps> = ({ riskLevel }) => {
  const getAdvisories = (level: RiskLevel) => {
    switch (level) {
      case 'LOW':
        return [
          { icon: Users, category: 'Public Precautions', text: 'Maintain normal daily activities; carry drinking water when outdoors.' },
          { icon: Building2, category: 'Outdoor Labor', text: 'Normal working hours permitted with standard hydration breaks.' },
          { icon: Hospital, category: 'Healthcare', text: 'Routine clinical monitoring; keep standard heat illness protocols ready.' }
        ];
      case 'MODERATE':
        return [
          { icon: Users, category: 'Public Precautions', text: 'Increase daily fluid intake (water, ORS, buttermilk); avoid unshaded direct midday sun.' },
          { icon: Building2, category: 'Outdoor Labor', text: 'Provide shaded rest areas and compulsory 15-min hydration breaks every 2 hours.' },
          { icon: Hospital, category: 'Healthcare', text: 'Alert outpatient departments to monitor vulnerable elderly and pediatric dehydration cases.' }
        ];
      case 'HIGH':
        return [
          { icon: Users, category: 'Public Precautions', text: 'Restrict unnecessary strenuous outdoor activity between 12:00 PM and 04:00 PM.' },
          { icon: Building2, category: 'Outdoor Labor', text: 'Shift heavy physical work to early morning (06:00 AM - 10:30 AM) and late afternoon.' },
          { icon: Hospital, category: 'Healthcare', text: 'Designate dedicated heat-stroke triage beds and verify stock of intravenous rehydration fluids.' }
        ];
      case 'VERY HIGH':
        return [
          { icon: Users, category: 'Public Warnings', text: 'Activate city heat action plan; keep vulnerable elderly indoors in cool or ventilated spaces.' },
          { icon: Building2, category: 'Municipal Action', text: 'Open all primary municipal cooling shelters and launch public misting stations.' },
          { icon: Hospital, category: 'Healthcare Readiness', text: 'Place emergency ambulance services on standby; pre-alert intensive care units.' }
        ];
      case 'EXTREME':
      default:
        return [
          { icon: AlertTriangle, category: 'EMERGENCY RED ALERT', text: 'Deploy municipal emergency heat disaster protocols. Open all emergency cooling sanctuaries.' },
          { icon: Building2, category: 'Mandatory Work Halt', text: 'Enforce mandatory suspension of high-risk outdoor construction & physical labor (11:30 AM - 04:30 PM).' },
          { icon: Hospital, category: 'Hospital Surge Protocol', text: 'Activate hospital emergency surge capacity, deploy mobile medical response teams, and issue mass broadcast alerts.' }
        ];
    }
  };

  const advisories = getAdvisories(riskLevel);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Actionable Public Health Advisories & SOP Directives
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-mono font-medium">Dynamic SOP Directive</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {advisories.map((adv, idx) => {
          const IconComponent = adv.icon;
          return (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 hover:border-slate-300 transition-all">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                <IconComponent className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{adv.category}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{adv.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
