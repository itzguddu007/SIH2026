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
    cityMarkers[name].bindPopup(`<b>${name}</b><br>Thermal Stress: <b>${wbgtToScore(r.wbgt)}/100</b><br><span style="color:${color}">${r.cat.toUpperCase()} RISK</span><br>WBGT ${r.wbgt}°C · Tmax ${r.tmax}°C<br><button onclick="selectCity('${name}')" style="margin-top:7px">Zoom here</button>`);
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
}
function changeLocation(){document.getElementById('locationInput').focus();showToast('Search another city')}

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
  calculateRisk();
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

function dispatchAlert(){
  const hit = scanEarlyWarning(currentCity, currentDoy, 5);
  const r = hit ? hit.rec : rec(currentCity,currentDoy);
  showToast(`Simulated dispatch: SMS/WhatsApp sent to ${currentCity} zone authority — ${r.cat} risk, WBGT ${r.wbgt}°C`);
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
  document.getElementById('daySlider').value = currentDoy;
  const dt = doyToDate(currentDoy);
  document.getElementById('dateLabel').textContent = dt.label;
  document.getElementById('doyLabel').textContent = currentDoy;
  updateDashboard();
}
document.getElementById('daySlider').addEventListener('input', e=> setDoy(parseInt(e.target.value,10)) );
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
});
