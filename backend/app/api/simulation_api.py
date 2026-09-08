"""
Real-Time Heat Scenario Simulation Engine Endpoint.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import Ward, WeatherObservation, PopulationVulnerability
from app.schemas.system import SimulationRequest
from app.algorithms.thermal import calculate_heat_index, calculate_wbgt, calculate_utci, calculate_htsi
from app.algorithms.mortality_model import ml_manager

router = APIRouter(prefix="/api/simulation", tags=["Real-Time Simulation Engine"])

@router.post("/run")
def run_heat_simulation(req: SimulationRequest, db: Session = Depends(get_db)):
    wards = db.query(Ward).all()
    simulated_features = []

    total_temp = 0.0
    total_hum = 0.0
    total_htsi = 0.0
    total_mort = 0.0
    total_hosp = 0.0
    risk_counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "VERY HIGH": 0, "EXTREME": 0}

    for w in wards:
        obs = db.query(WeatherObservation).filter_by(ward_id=w.id).order_by(WeatherObservation.timestamp.desc()).first()
        vuln = db.query(PopulationVulnerability).filter_by(ward_id=w.id).first()

        base_t = obs.temp_celsius if obs else 38.0
        base_h = obs.relative_humidity if obs else 50.0
        base_w = obs.wind_speed_kmh if obs else 8.0
        base_s = obs.solar_radiation_wm2 if obs else 650.0

        # Apply simulation offsets
        sim_t = base_t + req.temp_offset
        sim_h = min(100.0, max(1.0, base_h + req.humidity_offset))
        sim_w = max(1.0, base_w + req.wind_offset)
        sim_s = max(0.0, base_s + req.radiation_offset)

        # Recalculate thermal metrics
        hi_val, _ = calculate_heat_index(sim_t, sim_h)
        wbgt_val, _, _ = calculate_wbgt(sim_t, sim_h, sim_w, sim_s)
        utci_val, _, _ = calculate_utci(sim_t, sim_h, sim_w, sim_s)
        htsi_score, risk_lvl, sub = calculate_htsi(sim_t, sim_h, sim_w, sim_s, wbgt_val, utci_val)

        # Recalculate ML Risk
        vuln_ratio = (vuln.elderly_population + vuln.children_population) / max(1, vuln.total_population) if vuln else 0.2
        outdoor_ratio = vuln.outdoor_workers / max(1, vuln.total_population) if vuln else 0.2
        
        feat = {
            "temp_celsius": sim_t,
            "humidity": sim_h,
            "wbgt": wbgt_val,
            "utci": utci_val,
            "htsi": htsi_score,
            "heat_duration_days": 3,
            "night_min_temp": sim_t - 10.0,
            "pop_density": vuln.population_density if vuln else 12000.0,
            "vulnerable_ratio": vuln_ratio,
            "outdoor_worker_ratio": outdoor_ratio
        }

        m_risk, h_risk, conf_str, conf_val = ml_manager.predict(feat)
        reasons = ml_manager.explain(feat, ward_name=w.name)

        risk_counts[risk_lvl] = risk_counts.get(risk_lvl, 0) + 1
        total_temp += sim_t
        total_hum += sim_h
        total_htsi += htsi_score
        total_mort += m_risk
        total_hosp += h_risk

        properties = {
            "ward_id": w.id,
            "ward_number": w.ward_number,
            "name": w.name,
            "lat": w.lat,
            "lng": w.lng,
            "temp_celsius": round(sim_t, 1),
            "relative_humidity": round(sim_h, 1),
            "wbgt": wbgt_val,
            "utci": utci_val,
            "heat_index": hi_val,
            "htsi_score": htsi_score,
            "risk_level": risk_lvl,
            "mortality_risk": round(m_risk * 100, 1),
            "hospitalization_risk": round(h_risk * 100, 1),
            "total_population": vuln.total_population if vuln else 0,
            "elderly_population": vuln.elderly_population if vuln else 0,
            "outdoor_workers": vuln.outdoor_workers if vuln else 0,
            "explainability": reasons
        }

        simulated_features.append({
            "type": "Feature",
            "id": w.id,
            "geometry": w.geojson_polygon,
            "properties": properties
        })

    n = len(wards)
    dom_risk = max(risk_counts.items(), key=lambda x: x[1])[0]

    return {
        "simulation_parameters": {
            "temp_offset_celsius": req.temp_offset,
            "humidity_offset_percent": req.humidity_offset,
            "wind_offset_kmh": req.wind_offset,
            "radiation_offset_wm2": req.radiation_offset
        },
        "kpi_summary": {
            "avg_temp_celsius": round(total_temp / n, 1),
            "avg_humidity_percent": round(total_hum / n, 1),
            "avg_htsi_score": round(total_htsi / n, 1),
            "overall_risk_level": dom_risk,
            "avg_mortality_risk_percent": round((total_mort / n) * 100, 1),
            "avg_hospitalization_risk_percent": round((total_hosp / n) * 100, 1),
            "risk_counts": risk_counts
        },
        "geojson": {
            "type": "FeatureCollection",
            "features": simulated_features
        }
    }
