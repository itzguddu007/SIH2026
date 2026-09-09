/* ---------- risk scale ---------- */
const RISK_ORDER = ["Low","Moderate","High","Severe","Extreme"];
const RISK_COLOR = {Low:"#28b04c",Moderate:"#f1ca24",High:"#ff8519",Severe:"#ff3346",Extreme:"#9b2fae"};
const ELEVATED = ["High","Severe","Extreme"]; // triggers early-warning + bell count

const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MDAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
function doyToDate(doy){
  let m=0, d=doy;
  while(d>MDAYS[m]){d-=MDAYS[m];m++;}
  return {day:d, month:MONTHS[m], label:`${d} ${MONTHS[m]} 2025`};
}
/* doy <-> ISO date string for the calendar input (2025, non-leap) */
const YEAR_START = new Date(2025,0,1);
function doyToISO(doy){
  const d = new Date(2025,0,1 + (doy-1));
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function isoToDoy(iso){
  const [y,m,d] = iso.split('-').map(Number);
  const dt = new Date(y,m-1,d);
  return Math.round((dt-YEAR_START)/86400000)+1;
}

/* WBGT (deg C) -> 0-100 stress score, piecewise-linear across category boundaries */
function wbgtToScore(wbgt){
  const xs=[20,28,30,32,34,38], ys=[0,40,55,70,85,100];
  if(wbgt<=xs[0]) return 0;
  if(wbgt>=xs[xs.length-1]) return 100;
  for(let i=0;i<xs.length-1;i++){
    if(wbgt>=xs[i] && wbgt<=xs[i+1]){
      const t=(wbgt-xs[i])/(xs[i+1]-xs[i]);
      return Math.round(ys[i]+t*(ys[i+1]-ys[i]));
    }
  }
  return 50;
}

let map, miniMap, cityMarkers={}, miniMarker=null, miniCircle=null;
let currentCity = "Kolkata";
let currentDoy = 145;
let playing=false, playTimer=null;

function rec(city, doy){
  const c = HEAT_DATA.cities[city];
  const idx = Math.min(365, Math.max(1, doy)) - 1;
  return c.days[idx];
}
function cityMeta(city){ return HEAT_DATA.cities[city]; }

/* ---------- map ---------- */
function initMap(){
  map=L.map('map',{zoomControl:true}).setView([22.5,79],5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map);
  miniMap=L.map('miniMap',{zoomControl:true,attributionControl:false}).setView([22.57,88.36],10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);

  CITY_ORDER.forEach(name=>{
    const c = cityMeta(name);
    const marker=L.circleMarker([c.lat,c.lon],{radius:8,color:'#fff',weight:2,fillColor:'#888',fillOpacity:.9}).addTo(map);
    marker.on('click',()=>selectCity(name));
    cityMarkers[name]=marker;
  });
  refreshMapColors();
}
function refreshMapColors(){
  CITY_ORDER.forEach(name=>{
    const r = rec(name, currentDoy);
    const color = RISK_COLOR[r.cat];
    const isSel = name===currentCity;
    cityMarkers[name].setStyle({fillColor:color, radius:isSel?12:8, weight:isSel?3:2});
    const lw = LIVE_WEATHER[name];
    const liveLine = lw ? `<br><span style="color:#3ddc84">Live now: ${lw.temp}°C, ${lw.rh}% RH, ${lw.wind} km/h</span>` : '';
    cityMarkers[name].bindPopup(`<b>${name}</b><br>Thermal Stress: <b>${wbgtToScore(r.wbgt)}/100</b><br><span style="color:${color}">${r.cat.toUpperCase()} RISK</span><br>WBGT ${r.wbgt}°C · Tmax ${r.tmax}°C${liveLine}<br><button onclick="selectCity('${name}')" style="margin-top:7px">Zoom here</button>`);
  });
}

/* ---------- selection ---------- */
function selectCity(name){
  currentCity = name;
  const c = cityMeta(name);
  map.flyTo([c.lat,c.lon],7,{duration:1.2});
  updateDashboard();
  showToast(`${name} selected`);
}
function selectHighestRisk(){
  let best=CITY_ORDER[0], bestScore=-1;
  CITY_ORDER.forEach(n=>{
    const s = wbgtToScore(rec(n,currentDoy).wbgt);
    if(s>bestScore){bestScore=s;best=n;}
  });
  selectCity(best);
}
function focusMap(){document.getElementById('mapCard').scrollIntoView({behavior:'smooth'});setTimeout(()=>map.invalidateSize(),500)}
function focusSelectedCity(){
  const c=cityMeta(currentCity);
  miniMap.flyTo([c.lat,c.lon],10,{duration:1});
  map.flyTo([c.lat,c.lon],8,{duration:1});
}
function searchLocation(){
  const q=document.getElementById('locationInput').value.toLowerCase().trim();
  const key=CITY_ORDER.find(k=>k.toLowerCase()===q) || CITY_ORDER.find(k=>k.toLowerCase().includes(q));
  if(key) selectCity(key);
  else showToast('Try any of: '+CITY_ORDER.slice(0,6).join(', ')+'…');
  hideSuggestions();
}
function changeLocation(){document.getElementById('locationInput').focus();showToast('Search another city')}

/* ---------- search autocomplete (min 4, up to 5 suggestions) ---------- */
function renderSuggestions(rawQuery){
  const box = document.getElementById('searchSuggest');
  const q = rawQuery.toLowerCase().trim();
  let matches = q ? CITY_ORDER.filter(c=>c.toLowerCase().includes(q)) : [];
  // guarantee at least 4 options so the user always has cities to pick from
  if(matches.length < 4){
    const rest = CITY_ORDER
      .filter(c=>!matches.includes(c))
      .sort((a,b)=> wbgtToScore(rec(b,currentDoy).wbgt) - wbgtToScore(rec(a,currentDoy).wbgt)); // highest risk first
    matches = matches.concat(rest).slice(0, Math.max(4, matches.length));
  }
  matches = matches.slice(0,5);

  if(matches.length===0){ hideSuggestions(); return; }
  box.innerHTML = matches.map(name=>{
    const r = rec(name,currentDoy);
    return `<div class="sg-item" data-city="${name}"><span><span class="sg-dot" style="background:${RISK_COLOR[r.cat]}"></span>${name}</span><small>${r.cat}</small></div>`;
  }).join('');
  box.querySelectorAll('.sg-item').forEach(el=>{
    el.addEventListener('click', ()=>{
      document.getElementById('locationInput').value = el.dataset.city;
      selectCity(el.dataset.city);
      hideSuggestions();
    });
  });
  box.classList.add('show');
}
function hideSuggestions(){ document.getElementById('searchSuggest').classList.remove('show'); }
document.getElementById('locationInput').addEventListener('input', e=> renderSuggestions(e.target.value));
document.getElementById('locationInput').addEventListener('focus', e=> renderSuggestions(e.target.value));
document.getElementById('locationInput').addEventListener('keydown', e=>{
  if(e.key==='Enter'){ searchLocation(); }
  if(e.key==='Escape'){ hideSuggestions(); }
});
document.addEventListener('click', e=>{
  if(!e.target.closest('.search-wrap')) hideSuggestions();
});

/* ---------- dashboard render ---------- */
function updateDashboard(){
  const c = cityMeta(currentCity);
  const r = rec(currentCity, currentDoy);
  const score = wbgtToScore(r.wbgt);
  const color = RISK_COLOR[r.cat];

  document.getElementById('cityName').textContent = currentCity.toUpperCase()+', '+c.region.replace('_',' ').toUpperCase();
  document.getElementById('temp').textContent = r.tmax+'°C';
  document.getElementById('feels').textContent = r.hi+'°C';
  document.getElementById('humidity').textContent = r.rh+'%';
  document.getElementById('wind').textContent = r.wind+' km/h';
  document.getElementById('solar').textContent = r.solar+' W/m²';

  document.getElementById('stressScore').textContent = score;
  document.getElementById('stressScore').style.color = color;
  document.getElementById('stressBar').style.width = score+'%';
  document.getElementById('stressBar').style.background = color;
  const riskLabel = document.getElementById('riskLabel');
  riskLabel.textContent = r.cat.toUpperCase()+' RISK';
  riskLabel.style.background = color;
  document.getElementById('wbgtVal').textContent = r.wbgt+'°C';
  document.getElementById('mriVal').textContent = r.mri;
  document.getElementById('excessVal').textContent = '+'+r.excess_mortality_pct+'%';

  document.getElementById('districtTitle').textContent = currentCity.toUpperCase()+' ZONE VIEW';
  document.getElementById('forecastTitle').textContent = '5-DAY OUTLOOK — '+currentCity.toUpperCase();
  document.getElementById('historyTitle').textContent = 'MONTHLY AVERAGE THERMAL STRESS — '+currentCity.toUpperCase();

  refreshMapColors();
  renderForecast();
  renderDistricts();
  renderChart();
  renderEarlyWarning();
  renderBell();
  renderImpact();
  renderLiveNote();
  calculateRisk();
}

/* ---------- localized effects (uses per-city demographic fields) ---------- */
function renderImpact(){
  const c = cityMeta(currentCity);
  const r = rec(currentCity, currentDoy);
  const d = c.demo;
  document.getElementById('impElderly').textContent = d.elderly_pct+'%';
  document.getElementById('impOutdoor').textContent = Math.round(d.outdoor_worker_idx*100)+'%';
  document.getElementById('impDensity').textContent = d.pop_density.toLocaleString('en-IN')+'/km²';
  document.getElementById('impGreen').textContent = Math.round(d.green_cover_idx*100)+'%';

  const effects=[];
  if(ELEVATED.includes(r.cat)){
    effects.push(`heat stroke and dehydration risk rises sharply for the ~${d.elderly_pct}% elderly population`);
  }
  if(d.outdoor_worker_idx>=0.4 && ELEVATED.includes(r.cat)){
    effects.push(`labour productivity loss likely among the sizeable outdoor workforce (index ${d.outdoor_worker_idx})`);
  }
  if(d.pop_density>8000 && ELEVATED.includes(r.cat)){
    effects.push(`dense urban fabric (${d.pop_density.toLocaleString('en-IN')}/km²) traps heat overnight, keeping nighttime WBGT elevated`);
  }
  if(d.green_cover_idx<0.2){
    effects.push(`low green cover (${Math.round(d.green_cover_idx*100)}%) limits natural cooling, worsening the urban heat island effect`);
  }
  if(r.cat==='Severe' || r.cat==='Extreme'){
    effects.push('rising power demand for cooling may strain the grid, and water demand typically spikes');
  }
  if(effects.length===0) effects.push('conditions are manageable at this level — no significant secondary effects expected');
  document.getElementById('impactText').textContent = `At current ${r.cat} risk in ${currentCity}: ${effects.join('; ')}.`;
}

/* ---------- live weather (Open-Meteo, no API key, all 20 cities in one call) ---------- */
let LIVE_WEATHER = {};
async function fetchLiveWeather(){
  try{
    const lats = CITY_ORDER.map(n=>cityMeta(n).lat).join(',');
    const lons = CITY_ORDER.map(n=>cityMeta(n).lon).join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    const arr = Array.isArray(data) ? data : [data];
    arr.forEach((entry,i)=>{
      const name = CITY_ORDER[i];
      if(entry && entry.current){
        LIVE_WEATHER[name] = {
          temp: Math.round(entry.current.temperature_2m),
          rh: Math.round(entry.current.relative_humidity_2m),
          wind: Math.round(entry.current.wind_speed_10m),
          time: entry.current.time
        };
      }
    });
    renderLiveNote();
    refreshMapColors();
  }catch(err){
    const el = document.getElementById('liveNote');
    if(el) el.textContent = 'Live weather unavailable right now';
  }
}
function renderLiveNote(){
  const el = document.getElementById('liveNote');
  if(!el) return;
  const lw = LIVE_WEATHER[currentCity];
  el.textContent = lw
    ? `Live now: ${lw.temp}°C · ${lw.rh}% RH · ${lw.wind} km/h wind (updated ${lw.time ? lw.time.slice(11,16) : ''})`
    : 'Live weather loading…';
}

function renderForecast(){
  const days=[];
  for(let d=currentDoy; d<=Math.min(365,currentDoy+4); d++) days.push(rec(currentCity,d));
  while(days.length<5) days.push(days[days.length-1]); // pad at year edge
  document.getElementById('forecastRow').innerHTML = days.map((r,i)=>{
    const dt = doyToDate(r.doy);
    const active = ELEVATED.includes(r.cat) ? ' active' : '';
    return `<div class="forecast-item${active}">
      <small>${i===0?'Today':'Day +'+i}<span class="flead">${dt.label}</span></small>
      <div class="ficon">${r.cat==='Extreme'?'🔥':r.cat==='Severe'?'♨':r.cat==='High'?'☀️':'🌤️'}</div>
      <b>${r.tmax}°C</b>
      <b class="fscore" style="color:${RISK_COLOR[r.cat]}">${wbgtToScore(r.wbgt)}</b>
    </div>`;
  }).join('');
}

function renderDistricts(){
  const zones=['North Zone','Central Zone','South Zone','East Zone','West Zone','IT/Business Park','Old City Core','Riverside / Low-lying'];
  const offsets=[4,1,-6,-9,-11,-20,-3,6]; // illustrative zone-level variation around city score
  const base = wbgtToScore(rec(currentCity,currentDoy).wbgt);
  document.getElementById('districtList').innerHTML = zones.map((n,i)=>{
    const s = Math.max(5, Math.min(100, base+offsets[i]));
    const cat = s>=85?'Extreme':s>=70?'Severe':s>=55?'High':s>=40?'Moderate':'Low';
    return `<div class="district-item"><span>${n}</span><b style="color:${RISK_COLOR[cat]}">${s}</b></div>`;
  }).join('');
  const c=cityMeta(currentCity);
  if(miniMarker){miniMap.removeLayer(miniMarker); miniMap.removeLayer(miniCircle);}
  miniMap.setView([c.lat,c.lon],10);
  miniCircle=L.circle([c.lat,c.lon],{radius:4500,color:RISK_COLOR[rec(currentCity,currentDoy).cat],fillColor:RISK_COLOR[rec(currentCity,currentDoy).cat],fillOpacity:.10,weight:1}).addTo(miniMap);
  miniMarker=L.marker([c.lat,c.lon]).addTo(miniMap).bindPopup(`<b>${currentCity}</b><br>Thermal stress: ${base}/100`).openPopup();
}

function renderChart(){
  const c = cityMeta(currentCity);
  const monthlyAvg = new Array(12).fill(0);
  const monthlyCount = new Array(12).fill(0);
  let doy=1;
  for(let m=0;m<12;m++){
    for(let d=0; d<MDAYS[m]; d++){
      const r = c.days[doy-1];
      monthlyAvg[m]+=wbgtToScore(r.wbgt);
      monthlyCount[m]++;
      doy++;
    }
  }
  const vals = monthlyAvg.map((v,i)=>Math.round(v/monthlyCount[i]));
  const curMonth = doyToDate(currentDoy).month;
  document.getElementById('chart').innerHTML = MONTHS.map((mo,i)=>{
    const active = mo===curMonth;
    return `<div class="bar-col"><i style="height:${Math.max(4,vals[i])}%;${active?'background:#ff8519':''}"></i><span${active?' style="color:#fff;font-weight:700"':''}>${mo}</span></div>`;
  }).join('');
}

/* ---------- early warning ---------- */
function scanEarlyWarning(city, fromDoy, windowDays){
  for(let lead=0; lead<=windowDays; lead++){
    const d = fromDoy+lead;
    if(d>365) break;
    const r = rec(city,d);
    if(ELEVATED.includes(r.cat)) return {lead, rec:r};
  }
  return null;
}
function renderEarlyWarning(){
  const hit = scanEarlyWarning(currentCity, currentDoy, 5);
  const headline = document.getElementById('alertHeadline');
  const body = document.getElementById('alertBody');
  const prob = document.getElementById('probability');
  const alertEl = document.getElementById('alert');
  if(hit){
    const dt = doyToDate(hit.rec.doy);
    const color = RISK_COLOR[hit.rec.cat];
    const confidence = Math.max(60, 95 - hit.lead*6);
    headline.textContent = hit.lead===0
      ? `ACTIVE ALERT — ${hit.rec.cat.toUpperCase()} RISK TODAY`
      : `EARLY WARNING — ${hit.rec.cat.toUpperCase()} RISK IN ${hit.lead} DAY${hit.lead>1?'S':''}`;
    headline.style.color = color;
    body.textContent = `${currentCity}: WBGT ${hit.rec.wbgt}°C expected on ${dt.label} (lead time ${hit.lead} day${hit.lead===1?'':'s'}). Est. excess mortality +${hit.rec.excess_mortality_pct}% vs baseline. ${HEAT_DATA.advisory[hit.rec.cat].split('.')[0]}.`;
    prob.textContent = `Model confidence (illustrative): ${confidence}%`;
    alertEl.style.borderColor = color;
    document.getElementById('alert-icon');
  } else {
    headline.textContent = 'NO ELEVATED RISK — NEXT 5 DAYS CLEAR';
    headline.style.color = '#28b04c';
    body.textContent = `${currentCity}: thermal stress is expected to stay Low/Moderate over the next 5 days. Routine advisories only.`;
    prob.textContent = 'Model confidence (illustrative): 90%';
    alertEl.style.borderColor = '#263c53';
  }
  renderPrecautions(hit ? hit.rec.cat : rec(currentCity,currentDoy).cat);
}

function dispatchAlert(channel){
  const hit = scanEarlyWarning(currentCity, currentDoy, 5);
  const r = hit ? hit.rec : rec(currentCity,currentDoy);
  const raw = document.getElementById('phoneInput').value.trim();
  const digits = raw.replace(/[^\d]/g,'');
  if(digits.length < 10){
    showToast('Enter a valid mobile number (with country code) to dispatch the alert');
    document.getElementById('phoneInput').focus();
    return;
  }
  const message = `HEAT ALERT: ${currentCity} — ${r.cat.toUpperCase()} risk. WBGT ${r.wbgt}°C, feels like ${r.hi}°C. Est. excess mortality +${r.excess_mortality_pct}%. ${HEAT_DATA.advisory[r.cat].split('.')[0]}.`;

  if(channel==='whatsapp'){
    const waNumber = digits.length===10 ? '91'+digits : digits; // default to +91 if no country code given
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
    showToast(`WhatsApp draft opened for +${waNumber} — ${r.cat} risk, WBGT ${r.wbgt}°C`);
  } else {
    const smsNumber = raw.startsWith('+') ? raw : (digits.length===10 ? '+91'+digits : '+'+digits);
    window.location.href = `sms:${smsNumber}?&body=${encodeURIComponent(message)}`;
    showToast(`SMS draft opened for ${smsNumber} — ${r.cat} risk, WBGT ${r.wbgt}°C`);
  }
}

function renderBell(){
  let count=0;
  CITY_ORDER.forEach(n=>{ if(ELEVATED.includes(rec(n,currentDoy).cat)) count++; });
  document.getElementById('bellCount').textContent = count;
}

/* ---------- precautions ---------- */
let activePrecautionTab = null;
function renderPrecautionTabs(){
  const el = document.getElementById('precautionTabs');
  el.innerHTML = RISK_ORDER.map(r=>`<button class="ptab" data-r="${r}" style="border-color:${RISK_COLOR[r]}">${r}</button>`).join('');
  el.querySelectorAll('.ptab').forEach(btn=>{
    btn.addEventListener('click', ()=>renderPrecautions(btn.dataset.r));
  });
}
function renderPrecautions(level){
  activePrecautionTab = level;
  document.querySelectorAll('.ptab').forEach(b=>{
    const on = b.dataset.r===level;
    b.classList.toggle('active', on);
    b.style.background = on ? RISK_COLOR[level] : 'transparent';
    b.style.color = on ? '#0f141b' : '#c6d0dc';
  });
  const p = HEAT_DATA.precautions[level];
  document.getElementById('precautionBody').innerHTML = `
    <div class="precaution-desc" style="border-left-color:${RISK_COLOR[level]}">${p.desc}</div>
    <div><h4>GENERAL PUBLIC</h4><ul>${p.public.map(x=>`<li>${x}</li>`).join('')}</ul></div>
    <div><h4>VULNERABLE GROUPS (ELDERLY, OUTDOOR WORKERS, CHILDREN)</h4><ul>${p.vulnerable.map(x=>`<li>${x}</li>`).join('')}</ul></div>
    <div style="grid-column:1/-1"><h4>MUNICIPAL / HEALTH / DISASTER MANAGEMENT AUTHORITIES</h4><ul>${p.authorities.map(x=>`<li>${x}</li>`).join('')}</ul></div>
  `;
}

/* ---------- calculator ---------- */
function calculateRisk(){
  const r = rec(currentCity,currentDoy);
  let score = wbgtToScore(r.wbgt);
  const age=+document.getElementById('age').value;
  const occupation=document.getElementById('occupation').value;
  const activity=document.getElementById('activity').value;
  const exposure=+document.getElementById('exposure').value;
  if(age>=60) score+=7;
  else if(age>=50) score+=4;
  if(['Outdoor Worker','Construction Worker'].includes(occupation)) score+=6;
  if(activity==='Heavy') score+=5; else if(activity==='Moderate') score+=2;
  score+=Math.max(0,exposure-1)*2;
  score=Math.min(100,Math.round(score));
  const cat = score>=85?'Extreme':score>=70?'Severe':score>=55?'High':score>=40?'Moderate':'Low';
  document.getElementById('personalScore').textContent=score;
  document.getElementById('personalScore').style.color = RISK_COLOR[cat];
  document.getElementById('personalLabel').textContent=cat.toUpperCase()+' RISK';
  document.getElementById('personalLabel').style.background = RISK_COLOR[cat];
  const p = HEAT_DATA.precautions[cat];
  document.getElementById('personalActions').innerHTML = p.public.slice(0,3).map(x=>`<p>✓ ${x}</p>`).join('') +
    (p.vulnerable.length ? `<p>✓ ${p.vulnerable[0]}</p>` : '');
}

/* ---------- date scrubber ---------- */
function setDoy(d){
  currentDoy = Math.max(1, Math.min(365, d));
  document.getElementById('dateCalendar').value = doyToISO(currentDoy);
  const dt = doyToDate(currentDoy);
  document.getElementById('dateLabel').textContent = dt.label;
  document.getElementById('doyLabel').textContent = currentDoy;
  updateDashboard();
}
document.getElementById('dateCalendar').addEventListener('change', e=>{
  if(!e.target.value) return;
  setDoy(isoToDoy(e.target.value));
});
document.getElementById('prevBtn').addEventListener('click', ()=> setDoy(currentDoy-1) );
document.getElementById('nextBtn').addEventListener('click', ()=> setDoy(currentDoy+1) );
document.getElementById('playBtn').addEventListener('click', ()=>{
  playing=!playing;
  const btn=document.getElementById('playBtn');
  btn.textContent = playing?'❚❚':'▶';
  btn.classList.toggle('active',playing);
  if(playing){
    playTimer=setInterval(()=>{ setDoy(currentDoy>=365?1:currentDoy+1); }, 220);
  } else {
    clearInterval(playTimer);
  }
});

/* ---------- misc ---------- */
function scrollToSection(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth'})}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.style.opacity=1;t.style.transform='translateY(0)';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>{t.style.opacity=0;t.style.transform='translateY(10px)'},2600)}
function updateClock(){document.getElementById('clock').textContent=new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}

window.addEventListener('load',()=>{
  initMap();
  renderPrecautionTabs();
  setDoy(currentDoy);
  updateClock();
  setInterval(updateClock,30000);
  fetchLiveWeather();
  setInterval(fetchLiveWeather, 600000); // refresh live weather every 10 min
});
