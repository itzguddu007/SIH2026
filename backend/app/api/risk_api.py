"""
Risk Assessment Service Endpoints.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.database.models import RiskAssessment, Ward, PopulationVulnerability, WeatherObservation

router = APIRouter(prefix="/api/risk", tags=["Risk Assessment"])

@router.get("/current")
def get_current_risk(zone_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(RiskAssessment).join(Ward)
    if zone_id:
        query = query.filter(Ward.zone_id == zone_id)

    assessments = query.all()
    if not assessments:
        return {"error": "No assessments found"}

    avg_htsi = sum(a.htsi_score for a in assessments) / len(assessments)
    avg_mort = sum(a.mortality_risk for a in assessments) / len(assessments)
    avg_hosp = sum(a.hospitalization_risk for a in assessments) / len(assessments)
    avg_conf = sum(a.confidence for a in assessments) / len(assessments)

    # Risk distribution counts
    counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "VERY HIGH": 0, "EXTREME": 0}
    for a in assessments:
        counts[a.risk_level] = counts.get(a.risk_level, 0) + 1

    dom_risk = max(counts.items(), key=lambda x: x[1])[0]

    return {
        "overall_htsi_score": round(avg_htsi, 1),
        "overall_risk_level": dom_risk,
        "mortality_risk_percentage": round(avg_mort * 100, 1),
        "hospitalization_risk_percentage": round(avg_hosp * 100, 1),
        "confidence_percentage": round(avg_conf * 100, 1),
        "risk_breakdown_counts": counts,
        "total_wards_assessed": len(assessments)
    }

@router.get("/ward/{ward_id}")
def get_ward_risk_detail(ward_id: int, db: Session = Depends(get_db)):
    ward = db.query(Ward).get(ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    ra = db.query(RiskAssessment).filter_by(ward_id=ward_id).order_by(RiskAssessment.timestamp.desc()).first()
    obs = db.query(WeatherObservation).filter_by(ward_id=ward_id).order_by(WeatherObservation.timestamp.desc()).first()
    vuln = db.query(PopulationVulnerability).filter_by(ward_id=ward_id).first()

    return {
        "ward_id": ward.id,
        "ward_number": ward.ward_number,
        "ward_name": ward.name,
        "zone_id": ward.zone_id,
        "current_weather": {
            "temp_celsius": obs.temp_celsius if obs else 0,
            "relative_humidity": obs.relative_humidity if obs else 0,
            "wind_speed_kmh": obs.wind_speed_kmh if obs else 0,
            "solar_radiation_wm2": obs.solar_radiation_wm2 if obs else 0,
            "heat_index": obs.heat_index if obs else 0,
            "wbgt": obs.wbgt if obs else 0,
            "utci": obs.utci if obs else 0
        },
        "vulnerability": {
            "total_population": vuln.total_population if vuln else 0,
            "elderly_population": vuln.elderly_population if vuln else 0,
            "children_population": vuln.children_population if vuln else 0,
            "outdoor_workers": vuln.outdoor_workers if vuln else 0,
            "population_density": vuln.population_density if vuln else 0
        },
        "risk_assessment": {
            "htsi_score": ra.htsi_score if ra else 0,
            "risk_level": ra.risk_level if ra else "LOW",
            "mortality_risk": ra.mortality_risk if ra else 0,
            "hospitalization_risk": ra.hospitalization_risk if ra else 0,
            "confidence": ra.confidence if ra else 0,
            "explainability": ra.explainability_json if ra else []
        }
    }
