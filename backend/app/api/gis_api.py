"""
GIS Layer & Map Endpoints (GeoJSON FeatureCollection format).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import Ward, Zone, Hospital, CoolingCenter, RiskAssessment, WeatherObservation, PopulationVulnerability

router = APIRouter(prefix="/api/map", tags=["GIS System"])

@router.get("/wards")
def get_wards_geojson(db: Session = Depends(get_db)):
    wards = db.query(Ward).all()
    features = []

    for w in wards:
        ra = db.query(RiskAssessment).filter_by(ward_id=w.id).order_by(RiskAssessment.timestamp.desc()).first()
        obs = db.query(WeatherObservation).filter_by(ward_id=w.id).order_by(WeatherObservation.timestamp.desc()).first()
        vuln = db.query(PopulationVulnerability).filter_by(ward_id=w.id).first()

        properties = {
            "ward_id": w.id,
            "ward_number": w.ward_number,
            "name": w.name,
            "lat": w.lat,
            "lng": w.lng,
            "temp_celsius": obs.temp_celsius if obs else 0,
            "relative_humidity": obs.relative_humidity if obs else 0,
            "wbgt": obs.wbgt if obs else 0,
            "utci": obs.utci if obs else 0,
            "heat_index": obs.heat_index if obs else 0,
            "htsi_score": ra.htsi_score if ra else 0,
            "risk_level": ra.risk_level if ra else "LOW",
            "mortality_risk": round((ra.mortality_risk if ra else 0) * 100, 1),
            "hospitalization_risk": round((ra.hospitalization_risk if ra else 0) * 100, 1),
            "total_population": vuln.total_population if vuln else 0,
            "elderly_population": vuln.elderly_population if vuln else 0,
            "outdoor_workers": vuln.outdoor_workers if vuln else 0,
            "explainability": ra.explainability_json if ra else []
        }

        features.append({
            "type": "Feature",
            "id": w.id,
            "geometry": w.geojson_polygon,
            "properties": properties
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/hospitals")
def get_hospitals_map(db: Session = Depends(get_db)):
    hospitals = db.query(Hospital).all()
    res = []
    for h in hospitals:
        res.append({
            "id": h.id,
            "ward_id": h.ward_id,
            "name": h.name,
            "address": h.address,
            "phone": h.contact_phone,
            "total_beds": h.total_beds,
            "available_beds": h.available_beds,
            "icu_beds_total": h.icu_beds_total,
            "icu_beds_available": h.icu_beds_available,
            "heat_admissions_today": h.heat_admissions_today,
            "status": h.preparedness_status,
            "lat": h.lat,
            "lng": h.lng
        })
    return res

@router.get("/cooling-centers")
def get_cooling_centers_map(db: Session = Depends(get_db)):
    centers = db.query(CoolingCenter).all()
    res = []
    for c in centers:
        res.append({
            "id": c.id,
            "ward_id": c.ward_id,
            "name": c.name,
            "address": c.address,
            "capacity": c.capacity,
            "occupancy": c.current_occupancy,
            "hours": c.opening_hours,
            "facilities": c.facilities,
            "contact_person": c.contact_person,
            "contact_phone": c.contact_phone,
            "is_active": c.is_active,
            "lat": c.lat,
            "lng": c.lng
        })
    return res
