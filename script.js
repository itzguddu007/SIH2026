const kolkata = [22.5726, 88.3639];
const cities = {
  "kolkata": {name:"KOLKATA, WEST BENGAL", coords:[22.5726,88.3639], temp:39, humidity:74, wind:8, uv:8, stress:87},
  "delhi": {name:"DELHI, INDIA", coords:[28.6139,77.2090], temp:41, humidity:42, wind:11, uv:9, stress:82},
  "mumbai": {name:"MUMBAI, MAHARASHTRA", coords:[19.0760,72.8777], temp:34, humidity:79, wind:14, uv:8, stress:76},
  "chennai": {name:"CHENNAI, TAMIL NADU", coords:[13.0827,80.2707], temp:36, humidity:72, wind:12, uv:9, stress:81},
  "jaipur": {name:"JAIPUR, RAJASTHAN", coords:[26.9124,75.7873], temp:42, humidity:29, wind:16, uv:10, stress:78}
};

let map, miniMap, current = cities.kolkata;

function riskClass(score){return score>=80?'risk-ext':score>=50?'risk-high':score>=30?'risk-mod':'risk-low'}
function riskText(score){return score>=80?'EXTREME':score>=50?'HIGH':score>=30?'MODERATE':'LOW'}

function initMap(){
  map=L.map('map',{zoomControl:true}).setView([22.5,79],5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map);
  miniMap=L.map('miniMap',{zoomControl:true,attributionControl:false}).setView(kolkata,10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);

  Object.entries(cities).forEach(([key,c])=>{
    const color=c.stress>=80?'#ed253b':c.stress>=50?'#ff8519': '#f0ce24';
    const marker=L.circleMarker(c.coords,{radius:key==='kolkata'?11:8,color:'#fff',weight:2,fillColor:color,fillOpacity:.9}).addTo(map);
    marker.bindPopup(`<b>${c.name}</b><br>Thermal Stress: <b>${c.stress}/100</b><br><span style="color:${color}">${riskText(c.stress)} RISK</span><br><button onclick="selectCity('${key}')" style="margin-top:7px">Zoom here</button>`);
    marker.on('click',()=>selectCity(key));
  });
  L.circle(kolkata,{radius:4500,color:'#ff3346',fillColor:'#ff3346',fillOpacity:.10,weight:1}).addTo(miniMap);
  L.marker(kolkata).addTo(miniMap).bindPopup('<b>Kolkata</b><br>Thermal stress: 87/100').openPopup();
}

function selectCity(key){
  current=cities[key];
  map.flyTo(current.coords,10,{duration:1.5});
  updateDashboard();
  showToast(`${current.name} selected`);
}
function selectKolkata(){selectCity('kolkata')}
function focusKolkata(){miniMap.flyTo(kolkata,11,{duration:1.2}); map.flyTo(kolkata,10,{duration:1.2});}
function focusMap(){document.getElementById('mapCard').scrollIntoView({behavior:'smooth'});setTimeout(()=>map.invalidateSize(),500)}
function searchLocation(){
  const q=document.getElementById('locationInput').value.toLowerCase().trim();
  const key=Object.keys(cities).find(k=>q.includes(k)||cities[k].name.toLowerCase().includes(q));
  if(key) selectCity(key);
  else showToast('Try Kolkata, Delhi, Mumbai, Chennai or Jaipur');
}
function changeLocation(){document.getElementById('locationInput').focus();showToast('Search another city')}
function updateDashboard(){
  document.getElementById('cityName').textContent=current.name;
  document.getElementById('temp').textContent=current.temp+'°C';
  document.getElementById('humidity').textContent=current.humidity+'%';
  document.getElementById('wind').textContent=current.wind+' km/h';
  document.getElementById('uv').innerHTML=current.uv+' <em>(Very High)</em>';
  const feels=Math.round(current.temp+(current.humidity-40)*.15);
  document.getElementById('feels').textContent=feels+'°C';
  document.getElementById('stressScore').textContent=current.stress;
  document.getElementById('stressBar').style.width=current.stress+'%';
  document.getElementById('riskLabel').textContent=riskText(current.stress)+' RISK';
  document.getElementById('impact').textContent=current.stress>=80?'Very high risk of heat exhaustion / heat stroke':current.stress>=50?'High risk of heat exhaustion':'Moderate heat discomfort';
  document.getElementById('probability').textContent='Risk Probability: '+Math.min(97,current.stress+2)+'%';
  renderForecast();
  renderDistricts();
}
function renderForecast(){
  const base=current.temp, times=['9 AM','12 PM','3 PM','6 PM','9 PM'];
  const values=[base-7,base-2,base+2,base-1,base-8];
  document.getElementById('forecastRow').innerHTML=times.map((t,i)=>{
    const s=Math.max(20,Math.min(98,current.stress+(i===2?5:i===1?0:-8)));
    return `<div class="forecast-item ${i===2?'active':''}">
      <small>${t}</small><div class="ficon">${i===4?'🌙':'☀️'}</div><b>${values[i]}°C</b><b class="fscore">${s}</b></div>`
  }).join('');
}
function renderDistricts(){
  const names=['North Kolkata','Central Kolkata','South Kolkata','East Kolkata','West Kolkata','New Town','Salt Lake','Garden Reach'];
  document.getElementById('districtList').innerHTML=names.map((n,i)=>{
    let s=Math.max(28,Math.min(96,current.stress + [5,1,-9,-13,-16,-32,-38,-24][i]));
    return `<div class="district-item"><span>${n}</span><b class="${riskClass(s)}">${s}</b></div>`
  }).join('');
}
function calculateRisk(){
  let score=current.stress;
  const age=+document.getElementById('age').value;
  const occupation=document.getElementById('occupation').value;
  const activity=document.getElementById('activity').value;
  const exposure=+document.getElementById('exposure').value;
  if(age>=60) score+=7;
  else if(age>=50) score+=4;
  if(['Outdoor Worker','Construction Worker'].includes(occupation)) score+=6;
  if(activity==='Heavy') score+=5; else if(activity==='Moderate') score+=2;
  score+=Math.max(0,exposure-1)*2;
  score=Math.min(100,score);
  document.getElementById('personalScore').textContent=score;
  document.getElementById('personalLabel').textContent=riskText(score)+' RISK';
  showToast(`Personalized risk calculated: ${score}/100`);
}
function randomizeData(){
  current={...current,temp:Math.floor(34+Math.random()*9),humidity:Math.floor(55+Math.random()*30),wind:Math.floor(5+Math.random()*15),uv:Math.floor(7+Math.random()*4),stress:Math.floor(65+Math.random()*30)};
  updateDashboard();
  showToast('Random demonstration values generated');
}
function scrollToSection(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth'});if(id==='forecast')setTimeout(()=>{},300)}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.style.opacity=1;t.style.transform='translateY(0)';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>{t.style.opacity=0;t.style.transform='translateY(10px)'},2200)}
function updateClock(){document.getElementById('clock').textContent=new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function renderChart(){
  const years=['2021','2022','2023','2024','2025','2026'];
  const vals=[48,55,62,69,78,87];
  document.getElementById('chart').innerHTML=years.map((y,i)=>`<div class="bar-col"><i style="height:${vals[i]}%"></i><span>${y}</span></div>`).join('');
}
window.addEventListener('load',()=>{initMap();renderChart();updateDashboard();calculateRisk();updateClock();setInterval(updateClock,30000);});
