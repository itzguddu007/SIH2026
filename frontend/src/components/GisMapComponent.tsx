import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { WardGeoJson, WardGeoProperties, Hospital, CoolingCenter } from '../types';
import { Layers } from 'lucide-react';

interface GisMapProps {
  geoJsonData: WardGeoJson | null;
  hospitals: Hospital[];
  coolingCenters: CoolingCenter[];
  selectedWardId: number | null;
  onSelectWard: (wardId: number, wardProps: WardGeoProperties) => void;
  activeMetric: 'HTSI' | 'MORTALITY' | 'VULNERABLE' | 'WORKERS';
  setActiveMetric: (m: 'HTSI' | 'MORTALITY' | 'VULNERABLE' | 'WORKERS') => void;
}

export const GisMapComponent: React.FC<GisMapProps> = ({
  geoJsonData,
  hospitals,
  coolingCenters,
  selectedWardId,
  onSelectWard,
  activeMetric,
  setActiveMetric
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const hospitalLayerRef = useRef<L.LayerGroup | null>(null);
  const coolingLayerRef = useRef<L.LayerGroup | null>(null);

  const [showHospitals, setShowHospitals] = useState(true);
  const [showCoolingCenters, setShowCoolingCenters] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);

  const getFeatureColor = (props: WardGeoProperties) => {
    if (activeMetric === 'HTSI') {
      switch (props.risk_level) {
        case 'LOW': return '#10B981';
        case 'MODERATE': return '#F59E0B';
        case 'HIGH': return '#F97316';
        case 'VERY HIGH': return '#EF4444';
        case 'EXTREME': return '#991B1B';
        default: return '#0284C7';
      }
    } else if (activeMetric === 'MORTALITY') {
      const m = props.mortality_risk;
      if (m >= 70) return '#991B1B';
      if (m >= 50) return '#EF4444';
      if (m >= 30) return '#F97316';
      if (m >= 15) return '#F59E0B';
      return '#10B981';
    } else if (activeMetric === 'VULNERABLE') {
      const v = props.elderly_population;
      if (v > 7000) return '#7E22CE';
      if (v > 5000) return '#A855F7';
      if (v > 3000) return '#C084FC';
      return '#38BDF8';
    } else {
      const w = props.outdoor_workers;
      if (w > 8000) return '#C2410C';
      if (w > 5000) return '#F97316';
      return '#FCD34D';
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.6250, 77.2150],
        zoom: 11,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; MoES NCMRWF Operational GIS',
        maxZoom: 18
      }).addTo(map);

      hospitalLayerRef.current = L.layerGroup().addTo(map);
      coolingLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJsonData) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    if (showBoundaries) {
      const layer = L.geoJSON(geoJsonData as any, {
        style: (feature) => {
          const props = feature?.properties as WardGeoProperties;
          const isSelected = props.ward_id === selectedWardId;
          const color = getFeatureColor(props);

          return {
            fillColor: color,
            fillOpacity: isSelected ? 0.80 : 0.50,
            color: isSelected ? '#0284C7' : '#475569',
            weight: isSelected ? 3.5 : 1.5,
            dashArray: isSelected ? '' : '3'
          };
        },
        onEachFeature: (feature, l) => {
          const props = feature.properties as WardGeoProperties;
          
          l.bindTooltip(`
            <div class="text-xs font-semibold p-1 text-slate-900">
              <div class="font-bold text-slate-900">${props.name}</div>
              <div class="text-slate-600">Temp: ${props.temp_celsius}°C | WBGT: ${props.wbgt}°C</div>
              <div class="font-bold text-amber-700">Risk: ${props.risk_level} (${props.htsi_score}/100)</div>
            </div>
          `, { sticky: true });

          l.on('click', () => {
            onSelectWard(props.ward_id, props);
          });
        }
      }).addTo(map);

      geoJsonLayerRef.current = layer;
    }
  }, [geoJsonData, activeMetric, selectedWardId, showBoundaries]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !hospitalLayerRef.current) return;

    hospitalLayerRef.current.clearLayers();

    if (showHospitals) {
      hospitals.forEach((h) => {
        const icon = L.divIcon({
          className: 'custom-hospital-icon',
          html: `<div style="background-color: #DC2626; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; font-size: 11px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">H</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([h.lat, h.lng], { icon });
        marker.bindPopup(`
          <div class="p-2 space-y-1 text-xs">
            <div class="font-bold text-sm text-red-700">${h.name}</div>
            <div>Status: <span class="font-semibold text-amber-700">${h.status}</span></div>
            <div>Beds: ${h.available_beds} / ${h.total_beds} Available</div>
            <div>ICU Beds: ${h.icu_beds_available} / ${h.icu_beds_total} Available</div>
            <div>Heat Admissions Today: <span class="text-rose-700 font-bold">${h.heat_admissions_today}</span></div>
            <div class="text-slate-500 mt-1">${h.address}</div>
          </div>
        `);

        hospitalLayerRef.current?.addLayer(marker);
      });
    }
  }, [hospitals, showHospitals]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !coolingLayerRef.current) return;

    coolingLayerRef.current.clearLayers();

    if (showCoolingCenters) {
      coolingCenters.forEach((c) => {
        const icon = L.divIcon({
          className: 'custom-cooling-icon',
          html: `<div style="background-color: #0284C7; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; font-size: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">❄</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([c.lat, c.lng], { icon });
        marker.bindPopup(`
          <div class="p-2 space-y-1 text-xs">
            <div class="font-bold text-sm text-sky-700">${c.name}</div>
            <div>Occupancy: <span class="font-semibold text-slate-900">${c.occupancy} / ${c.capacity}</span></div>
            <div>Facilities: ${c.facilities}</div>
            <div>Hours: ${c.hours}</div>
            <div class="text-slate-500 mt-1">${c.address}</div>
          </div>
        `);

        coolingLayerRef.current?.addLayer(marker);
      });
    }
  }, [coolingCenters, showCoolingCenters]);

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Control Panel */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-2.5 shadow-lg space-y-2 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
          <Layers className="w-4 h-4 text-sky-600" />
          <span>GIS Choropleth Layers</span>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5">
          {(['HTSI', 'MORTALITY', 'VULNERABLE', 'WORKERS'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setActiveMetric(m)}
              className={`px-2.5 py-1.5 rounded text-[11px] font-semibold transition-all text-left ${
                activeMetric === m
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {m === 'HTSI' && 'Thermal Stress (HTSI)'}
              {m === 'MORTALITY' && 'Mortality Risk (%)'}
              {m === 'VULNERABLE' && 'Elderly Pop (65+)'}
              {m === 'WORKERS' && 'Outdoor Workers'}
            </button>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-1.5 space-y-1 text-slate-700 font-medium">
          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
            <input 
              type="checkbox" 
              checked={showBoundaries} 
              onChange={(e) => setShowBoundaries(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-0" 
            />
            <span>Ward Boundaries</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
            <input 
              type="checkbox" 
              checked={showHospitals} 
              onChange={(e) => setShowHospitals(e.target.checked)}
              className="rounded border-slate-300 text-red-600 focus:ring-0" 
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600"></span> Hospitals (10)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
            <input 
              type="checkbox" 
              checked={showCoolingCenters} 
              onChange={(e) => setShowCoolingCenters(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-0" 
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-600"></span> Cooling Centers (12)
            </span>
          </label>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-2.5 shadow-lg text-xs space-y-1.5 min-w-[180px]">
        <div className="font-bold text-slate-800 flex items-center justify-between">
          <span>{activeMetric} Legend</span>
          <span className="text-[10px] text-slate-400 font-mono">Scale</span>
        </div>
        {activeMetric === 'HTSI' && (
          <div className="space-y-1 text-[11px] font-medium">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#991B1B]"></span> EXTREME (81-100)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#EF4444]"></span> VERY HIGH (61-80)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#F97316]"></span> HIGH (41-60)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#F59E0B]"></span> MODERATE (21-40)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#10B981]"></span> LOW (0-20)</div>
          </div>
        )}
        {activeMetric === 'MORTALITY' && (
          <div className="space-y-1 text-[11px] font-medium">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#991B1B]"></span> Severe (&gt;70%)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#EF4444]"></span> High (50-70%)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#F97316]"></span> Elevated (30-50%)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#10B981]"></span> Low (&lt;30%)</div>
          </div>
        )}
        {(activeMetric === 'VULNERABLE' || activeMetric === 'WORKERS') && (
          <div className="space-y-1 text-[11px] font-medium">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#7E22CE]"></span> High Density</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#A855F7]"></span> Moderate Density</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#38BDF8]"></span> Normal Density</div>
          </div>
        )}
      </div>
    </div>
  );
};
