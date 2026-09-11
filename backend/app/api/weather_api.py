"""
Weather Data & Forecast Endpoints.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database.session import get_db
from app.database.models import WeatherObservation, WeatherForecast, Ward, Zone, Location
from app.services.live_weather_service import sync_live_weather, get_sync_status

router = APIRouter(prefix="/api/weather", tags=["Weather"])

@router.post("/sync-live")
def trigger_live_weather_sync(location_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    """Trigger live synchronization with Open-Meteo Meteorological API."""
    result = sync_live_weather(db, location_id=location_id)
    return result

@router.get("/sync-status")
def get_live_weather_sync_status():
    """Return live sync status and provider metadata."""
    return get_sync_status()


@router.get("/current")
def get_current_weather(ward_id: Optional[int] = Query(None), location_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    if ward_id:
        obs = db.query(WeatherObservation).filter(WeatherObservation.ward_id == ward_id).order_by(WeatherObservation.timestamp.desc()).first()
        if not obs:
            return {"error": "Ward not found"}
        w = db.query(Ward).get(ward_id)
        return {
            "ward_id": ward_id,
            "ward_name": w.name if w else f"Ward {ward_id}",
            "temp_celsius": obs.temp_celsius,
            "relative_humidity": obs.relative_humidity,
            "wind_speed_kmh": obs.wind_speed_kmh,
            "solar_radiation_wm2": obs.solar_radiation_wm2,
            "heat_index": obs.heat_index,
            "wbgt": obs.wbgt,
            "utci": obs.utci,
            "timestamp": obs.timestamp.isoformat()
        }
    else:
        # Filter observations by location
        query = db.query(WeatherObservation).join(Ward)
        city_name = "Selected Metro Region"
        if location_id:
            loc = db.query(Location).get(location_id)
            if loc:
                city_name = loc.name
            query = query.join(Zone).filter(Zone.location_id == location_id)
        else:
            first_loc = db.query(Location).first()
            if first_loc:
                city_name = first_loc.name
                query = query.join(Zone).filter(Zone.location_id == first_loc.id)

        obs_list = query.all()
        if not obs_list:
            return {}
        avg_temp = sum(o.temp_celsius for o in obs_list) / len(obs_list)
        avg_hum = sum(o.relative_humidity for o in obs_list) / len(obs_list)
        avg_hi = sum(o.heat_index for o in obs_list) / len(obs_list)
        avg_wbgt = sum(o.wbgt for o in obs_list) / len(obs_list)
        avg_utci = sum(o.utci for o in obs_list) / len(obs_list)

        return {
            "city": city_name,
            "ward_count": len(obs_list),
            "temp_celsius": round(avg_temp, 1),
            "relative_humidity": round(avg_hum, 1),
            "heat_index": round(avg_hi, 1),
            "wbgt": round(avg_wbgt, 1),
            "utci": round(avg_utci, 1)
        }


@router.get("/forecast")
def get_weather_forecast(ward_id: Optional[int] = Query(None), location_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(WeatherForecast).join(Ward)
    if ward_id:
        query = query.filter(WeatherForecast.ward_id == ward_id)
    elif location_id:
        query = query.join(Zone).filter(Zone.location_id == location_id)
    else:
        first_loc = db.query(Location).first()
        if first_loc:
            query = query.join(Zone).filter(Zone.location_id == first_loc.id)

    forecasts = query.order_by(WeatherForecast.horizon_hours).all()

    # Aggregate by horizon
    aggregated = {}
    for f in forecasts:
        h = f.horizon_hours
        if h not in aggregated:
            aggregated[h] = {
                "horizon_hours": h,
                "forecast_date": f.forecast_date,
                "temp_celsius_list": [],
                "humidity_list": [],
                "wbgt_list": [],
                "utci_list": [],
                "risk_levels": []
            }
        aggregated[h]["temp_celsius_list"].append(f.temp_celsius)
        aggregated[h]["humidity_list"].append(f.relative_humidity)
        aggregated[h]["wbgt_list"].append(f.wbgt)
        aggregated[h]["utci_list"].append(f.utci)
        aggregated[h]["risk_levels"].append(f.predicted_risk_level)

    result = []
    for h in sorted(aggregated.keys()):
        item = aggregated[h]
        avg_t = sum(item["temp_celsius_list"]) / len(item["temp_celsius_list"])
        avg_h = sum(item["humidity_list"]) / len(item["humidity_list"])
        avg_wbgt = sum(item["wbgt_list"]) / len(item["wbgt_list"])
        avg_utci = sum(item["utci_list"]) / len(item["utci_list"])

        # Determine dominant risk level
        risk_counts = {}
        for r in item["risk_levels"]:
            risk_counts[r] = risk_counts.get(r, 0) + 1
        dom_risk = max(risk_counts.items(), key=lambda x: x[1])[0]

        result.append({
            "horizon_hours": h,
            "forecast_date": item["forecast_date"],
            "temp_celsius": round(avg_t, 1),
            "relative_humidity": round(avg_h, 1),
            "wbgt": round(avg_wbgt, 1),
            "utci": round(avg_utci, 1),
            "risk_level": dom_risk
        })

    return result

