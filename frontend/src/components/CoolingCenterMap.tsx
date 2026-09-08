import React from 'react';
import type { Hospital, CoolingCenter } from '../types';
import { Home, Hospital as HospitalIcon, Phone, UserCheck } from 'lucide-react';

interface CoolingCenterMapProps {
  hospitals: Hospital[];
  coolingCenters: CoolingCenter[];
}

export const CoolingCenterMap: React.FC<CoolingCenterMapProps> = ({ hospitals, coolingCenters }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Active Municipal Cooling Shelters & Respite Pavilions (12 Locations)
            </h2>
          </div>
          <span className="text-xs bg-sky-100 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded font-mono font-semibold">
            Live Occupancy Tracker
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coolingCenters.map((c) => {
            const occRatio = c.occupancy / Math.max(1, c.capacity);
            const occPercent = Math.round(occRatio * 100);

            return (
              <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 hover:border-sky-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900 leading-snug">{c.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    occPercent > 80 ? 'bg-red-100 text-red-800 border border-red-300' :
                    occPercent > 60 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {occPercent}% Full
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      occPercent > 80 ? 'bg-red-600' : occPercent > 60 ? 'bg-amber-500' : 'bg-sky-600'
                    }`}
                    style={{ width: `${occPercent}%` }}
                  />
                </div>

                <div className="text-xs text-slate-700 flex justify-between font-mono font-medium">
                  <span>Occupancy: {c.occupancy} / {c.capacity}</span>
                  <span className="text-slate-500">{c.hours}</span>
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 font-medium">
                  <span className="text-amber-700 font-bold">Facilities:</span> {c.facilities}
                </div>

                <div className="text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-200 pt-2 font-medium">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-sky-600" /> {c.contact_person}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-sky-700 font-bold">
                    <Phone className="w-3 h-3 text-sky-600" /> {c.contact_phone}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HospitalIcon className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Hospital Emergency Preparedness & ICU Bed Tracker (10 Hospitals)
            </h2>
          </div>
          <span className="text-xs bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded font-mono font-semibold">
            NCMRWF Health Surge Protocol
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">Hospital Name</th>
                <th className="px-3 py-2.5">Preparedness Status</th>
                <th className="px-3 py-2.5">Total Beds</th>
                <th className="px-3 py-2.5">Available Beds</th>
                <th className="px-3 py-2.5">ICU Beds Free</th>
                <th className="px-3 py-2.5">Heat Admissions Today</th>
                <th className="px-3 py-2.5 text-right">Contact Emergency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {hospitals.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 font-semibold text-slate-900">
                    <div>{h.name}</div>
                    <div className="text-[10px] text-slate-500 font-sans">{h.address}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      h.status === 'READY' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      h.status === 'ELEVATED' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-red-100 text-red-800 border border-red-300 animate-pulse font-extrabold'
                    }`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{h.total_beds}</td>
                  <td className="px-3 py-3 font-bold text-emerald-700">{h.available_beds}</td>
                  <td className="px-3 py-3 font-bold text-sky-700">{h.icu_beds_available} / {h.icu_beds_total}</td>
                  <td className="px-3 py-3 font-bold text-rose-700">{h.heat_admissions_today}</td>
                  <td className="px-3 py-3 text-right text-sky-700 font-mono font-bold">{h.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
