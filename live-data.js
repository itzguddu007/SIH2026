/* =========================================================================
   LIVE WEATHER DATA — Open-Meteo integration
   Additive feature: does NOT touch HEAT_DATA / the 2025 dataset.
   Uses the same WBGT (Aus. BoM approx.) / Heat Index (NOAA) formulas and
   the same wbgtToScore() scale as the rest of the dashboard, so risk
   categories line up with the historical view.
   ========================================================================= */

const LIVE_CITIES = [
  { name: "Delhi",     lat: 28.61, lon: 77.23 },
  { name: "Mumbai",    lat: 19.08, lon: 72.88 },
  { name: "Kolkata",   lat: 22.57, lon: 88.36 },
  { name: "Chennai",   lat: 13.08, lon: 80.27 },
  { name: "Bengaluru", lat: 12.97, lon: 77.59 }
];

const LIVE_REFRESH_MS = 30 * 60 * 1000; // 30 minutes
const LIVE_PAST_DAYS = 5;

let liveData = {};          // { cityName: { days:[{date,tmax,rh,wind,solar,wbgt,hi,score,cat,mri,excess}], fetchedAt } }
let liveCurrentCity = "Delhi";
let liveMarkersLayer = null;
let liveMarkersVisible = false;
let liveRefreshTimer = null;
let liveLoaded = false;

/* ---------- risk categorisation (same bands as the sidebar legend) ---------- */
function liveWbgtCategory(wbgt){
  if(wbgt < 28) return "Low";
  if(wbgt < 30) return "Moderate";
  if(wbgt < 32) return "High";
  if(wbgt < 34) return "Severe";
  return "Extreme";
}

/* ---------- WBGT — simplified outdoor approximation (Aus. BoM), same as dataset ---------- */
function liveComputeWBGT(tempC, rh){
  const e = (rh/100) * 6.105 * Math.exp((17.27*tempC)/(237.7+tempC)); // vapour pressure, hPa
  return +(0.567*tempC + 0.393*e + 3.94).toFixed(1);
}

/* ---------- Heat Index — NOAA Rothfusz regression with low-temp fallback ---------- */
function liveComputeHeatIndex(tempC, rh){
  const T = tempC*9/5+32; // Fahrenheit
  const R = rh;
  let hiF;
  if(T < 80){
    hiF = 0.5*(T+61+((T-68)*1.2)+(R*0.094));
  } else {
    hiF = -42.379 + 2.04901523*T + 10.14333127*R - 0.22475541*T*R - 0.00683783*T*T
        - 0.05481717*R*R + 0.00122874*T*T*R + 0.00085282*T*R*R - 0.00000199*T*T*R*R;
    if(R < 13 && T <= 112) hiF -= ((13-R)/4) * Math.sqrt((17-Math.abs(T-95))/17);
    else if(R > 85 && T <= 87) hiF += ((R-85)/10) * ((87-T)/5);
  }
  return +((hiF-32)*5/9).toFixed(1);
}

/* ---------- Mortality Risk Index & excess mortality — piecewise curve matching
   the same category boundaries as the 2025 dataset, scaled by each city's
   demographic vulnerability (elderly share, outdoor-worker share, density,
   green cover) already present in HEAT_DATA for these 5 cities. ---------- */
const MRI_XS = [20,28,30,32,34,38];
const MRI_YS = [1.0,1.18,2.35,3.6,4.8,6.0];
const EXCESS_YS = [0,1.8,5.8,9.9,13.8,22.3];
function livePiecewise(xs, ys, x){
  if(x<=xs[0]) return ys[0];
  if(x>=xs[xs.length-1]) return ys[ys.length-1];
  for(let i=0;i<xs.length-1;i++){
    if(x>=xs[i] && x<=xs[i+1]){
      const t=(x-xs[i])/(xs[i+1]-xs[i]);
      return ys[i]+t*(ys[i+1]-ys[i]);
    }
  }
}
function liveVulnerabilityMultiplier(cityName){
  const demo = (typeof HEAT_DATA !== 'undefined' && HEAT_DATA.cities[cityName]) ? HEAT_DATA.cities[cityName].demo : null;
  if(!demo) return 1;
  let m = 1
    + 0.02*(demo.elderly_pct - 6)
    + 0.13*(demo.outdoor_worker_idx - 0.5)
    + 0.05*(demo.pop_density/10000 - 1)
    - 0.13*(demo.green_cover_idx - 0.2);
  return Math.max(0.75, Math.min(1.35, m));
}
function liveComputeMRI(wbgt, cityName){
  const mult = liveVulnerabilityMultiplier(cityName);
  return +(livePiecewise(MRI_XS, MRI_YS, wbgt) * mult).toFixed(2);
}
function liveComputeExcess(wbgt, cityName){
  const mult = liveVulnerabilityMultiplier(cityName);
  return +Math.max(0, livePiecewise(MRI_XS, EXCESS_YS, wbgt) * mult).toFixed(1);
}

/* ---------- fetch ---------- */
async function fetchLiveData(){
  const btn = document.getElementById('liveRefreshBtn');
  if(btn){ btn.disabled = true; btn.textContent = '⟳ Refreshing…'; }

  const results = await Promise.all(LIVE_CITIES.map(async city => {
    try{
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}`
        + `&daily=temperature_2m_max,relative_humidity_2m_max,wind_speed_10m_max,shortwave_radiation_sum`
        + `&past_days=${LIVE_PAST_DAYS}&forecast_days=1&timezone=Asia%2FKolkata`;
      const res = await fetch(url);
      if(!res.ok) throw new Error('HTTP '+res.status);
      const json = await res.json();
      const d = json.daily;
      const days = d.time.map((date,i)=>{
        const tmax = d.temperature_2m_max[i];
        const rh = d.relative_humidity_2m_max[i];
        const wind = d.wind_speed_10m_max[i];
        const solarMJ = d.shortwave_radiation_sum[i];
        const wbgt = (tmax==null||rh==null) ? null : liveComputeWBGT(tmax, rh);
        const hi = (tmax==null||rh==null) ? null : liveComputeHeatIndex(tmax, rh);
        const cat = wbgt==null ? null : liveWbgtCategory(wbgt);
        const score = wbgt==null ? null : wbgtToScore(wbgt);
        const mri = wbgt==null ? null : liveComputeMRI(wbgt, city.name);
        const excess = wbgt==null ? null : liveComputeExcess(wbgt, city.name);
        return {date, tmax, rh, wind, solarMJ, wbgt, hi, cat, score, mri, excess};
      });
      return {city: city.name, ok:true, days};
    } catch(err){
      console.error('Live fetch failed for', city.name, err);
      return {city: city.name, ok:false, error: err.message};
    }
  }));

  results.forEach(r=>{
    if(r.ok) liveData[r.city] = {days:r.days, fetchedAt:new Date()};
  });
  liveLoaded = true;

  if(btn){ btn.disabled = false; btn.textContent = '⟳ Refresh'; }
  const failed = results.filter(r=>!r.ok);
  if(failed.length && typeof showToast==='function'){
    showToast(`Live data failed for: ${failed.map(f=>f.city).join(', ')}`);
  }

  renderLiveSection();
  renderLiveHistory();
  if(liveMarkersVisible) renderLiveMap();
  updateLiveTimestamp();
}

function updateLiveTimestamp(){
  const el = document.getElementById('liveUpdated');
  if(!el) return;
  const entry = liveData[liveCurrentCity];
  el.textContent = entry ? 'Updated ' + entry.fetchedAt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—';
}

/* ---------- rendering: stats card ---------- */
function selectLiveCity(name){
  liveCurrentCity = name;
  document.querySelectorAll('.live-tab').forEach(b=>b.classList.toggle('active', b.dataset.city===name));
  renderLiveSection();
  renderLiveHistory();
}

function renderLiveSection(){
  const entry = liveData[liveCurrentCity];
  const grid = document.getElementById('liveStatsGrid');
  if(!grid) return;

  if(!entry){
    grid.innerHTML = `<div class="live-empty">${liveLoaded ? 'No live data available for this city.' : 'Loading live conditions…'}</div>`;
    return;
  }
  const today = entry.days[entry.days.length-1];
  const color = RISK_COLOR[today.cat] || '#8b98aa';

  grid.innerHTML = `
    <div class="live-stat"><small>Max Temp (today)</small><b>${today.tmax!=null?today.tmax+'°C':'—'}</b></div>
    <div class="live-stat"><small>Humidity (max)</small><b>${today.rh!=null?today.rh+'%':'—'}</b></div>
    <div class="live-stat"><small>Wind Speed (max)</small><b>${today.wind!=null?today.wind+' km/h':'—'}</b></div>
    <div class="live-stat"><small>Solar Radiation (daily sum)</small><b>${today.solarMJ!=null?today.solarMJ+' MJ/m²':'—'}</b></div>
    <div class="live-stat"><small>WBGT (outdoor)</small><b style="color:${color}">${today.wbgt!=null?today.wbgt+'°C':'—'}</b></div>
    <div class="live-stat"><small>Heat Index</small><b>${today.hi!=null?today.hi+'°C':'—'}</b></div>
    <div class="live-stat live-score-stat"><small>Thermal Stress Score</small><b style="color:${color}">${today.score!=null?today.score:'—'}<span>/100</span></b></div>
    <div class="live-stat"><small>Risk Category</small><b class="live-cat-pill" style="background:${color}">${today.cat?today.cat.toUpperCase():'—'}</b></div>
    <div class="live-stat"><small>Mortality Risk Index</small><b>${today.mri!=null?today.mri:'—'}</b></div>
    <div class="live-stat"><small>Est. Excess Mortality</small><b>${today.excess!=null?'+'+today.excess+'%':'—'}</b></div>
  `;
  updateLiveTimestamp();
  calculateLiveRisk();
}

/* ---------- rendering: 5-day history table ---------- */
function renderLiveHistory(){
  const el = document.getElementById('liveHistoryBody');
  if(!el) return;
  const entry = liveData[liveCurrentCity];
  if(!entry){ el.innerHTML = `<tr><td colspan="5">—</td></tr>`; return; }

  el.innerHTML = entry.days.map((d,i)=>{
    const isToday = i===entry.days.length-1;
    const color = RISK_COLOR[d.cat] || '#8b98aa';
    const label = isToday ? 'Today' : new Date(d.date+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
    return `<tr class="${isToday?'live-today-row':''}">
      <td>${label}</td>
      <td>${d.tmax!=null?d.tmax+'°C':'—'}</td>
      <td>${d.wbgt!=null?d.wbgt+'°C':'—'}</td>
      <td><b style="color:${color}">${d.cat?d.cat.toUpperCase():'—'}</b></td>
      <td>${d.score!=null?d.score:'—'}</td>
    </tr>`;
  }).join('');
}

/* ---------- rendering: live map markers ---------- */
function toggleLiveMarkers(checked){
  liveMarkersVisible = checked;
  if(checked) renderLiveMap();
  else if(liveMarkersLayer){ map.removeLayer(liveMarkersLayer); }
}
function renderLiveMap(){
  if(typeof map === 'undefined' || !map) return;
  if(liveMarkersLayer){ map.removeLayer(liveMarkersLayer); }
  liveMarkersLayer = L.layerGroup();

  LIVE_CITIES.forEach(city=>{
    const entry = liveData[city.name];
    if(!entry) return;
    const today = entry.days[entry.days.length-1];
    if(today.wbgt==null) return;
    const color = RISK_COLOR[today.cat] || '#888';
    const marker = L.circleMarker([city.lat, city.lon], {
      radius: 10,
      color: '#ff3346',
      weight: 2,
      dashArray: '3,3',
      fillColor: color,
      fillOpacity: .85
    });
    marker.bindPopup(`<b>🔴 LIVE — ${city.name}</b><br>WBGT ${today.wbgt}°C · Tmax ${today.tmax}°C<br><span style="color:${color}">${today.cat.toUpperCase()} RISK</span><br>Score: ${today.score}/100`);
    marker.on('click', ()=>selectLiveCity(city.name));
    liveMarkersLayer.addLayer(marker);
  });

  liveMarkersLayer.addTo(map);
}

/* ---------- live risk calculator (uses today's real WBGT, not the 2025 dataset) ---------- */
function calculateLiveRisk(){
  const entry = liveData[liveCurrentCity];
  const scoreEl = document.getElementById('livePersonalScore');
  const labelEl = document.getElementById('livePersonalLabel');
  if(!scoreEl || !labelEl) return;
  if(!entry){ scoreEl.textContent='—'; labelEl.textContent=''; return; }

  const today = entry.days[entry.days.length-1];
  if(today.wbgt==null){ scoreEl.textContent='—'; labelEl.textContent=''; return; }

  let score = today.score;
  const age = +document.getElementById('liveAge').value;
  const occupation = document.getElementById('liveOccupation').value;
  const activity = document.getElementById('liveActivity').value;
  const exposure = +document.getElementById('liveExposure').value;

  if(age>=60) score+=7; else if(age>=50) score+=4;
  if(['Outdoor Worker','Construction Worker'].includes(occupation)) score+=6;
  if(activity==='Heavy') score+=5; else if(activity==='Moderate') score+=2;
  score += Math.max(0, exposure-1)*2;
  score = Math.min(100, Math.round(score));
  const cat = score>=85?'Extreme':score>=70?'Severe':score>=55?'High':score>=40?'Moderate':'Low';

  scoreEl.textContent = score;
  scoreEl.style.color = RISK_COLOR[cat];
  labelEl.textContent = cat.toUpperCase()+' RISK';
  labelEl.style.background = RISK_COLOR[cat];
}

/* ---------- init ---------- */
function initLiveData(){
  LIVE_CITIES.forEach(c=>{ if(!liveData[c.name]) liveData[c.name]=null; });
  document.querySelectorAll('.live-tab').forEach(b=>{
    b.addEventListener('click', ()=>selectLiveCity(b.dataset.city));
  });
  const refreshBtn = document.getElementById('liveRefreshBtn');
  if(refreshBtn) refreshBtn.addEventListener('click', fetchLiveData);
  const toggle = document.getElementById('liveMapToggle');
  if(toggle) toggle.addEventListener('change', e=>toggleLiveMarkers(e.target.checked));
  const calcBtn = document.getElementById('liveCalculateBtn');
  if(calcBtn) calcBtn.addEventListener('click', calculateLiveRisk);

  fetchLiveData();
  liveRefreshTimer = setInterval(fetchLiveData, LIVE_REFRESH_MS);
}
