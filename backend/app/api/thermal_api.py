"""
Thermal Stress Calculation Endpoints.
"""

from fastapi import APIRouter
from app.schemas.system import HeatIndexRequest, WbgtRequest, UtciRequest, HtsiRequest
from app.algorithms.thermal import (
    calculate_heat_index, calculate_wbgt, calculate_utci, calculate_htsi
)

router = APIRouter(prefix="/api/thermal", tags=["Thermal Stress Algorithms"])

@router.post("/heat-index")
def get_heat_index(req: HeatIndexRequest):
    hi_c, method = calculate_heat_index(req.temp_celsius, req.relative_humidity)
    return {
        "temperature_celsius": req.temp_celsius,
        "relative_humidity": req.relative_humidity,
        "heat_index_celsius": hi_c,
        "method": method
    }

@router.post("/wbgt")
def get_wbgt(req: WbgtRequest):
    wbgt, is_estimated, method = calculate_wbgt(
        req.temp_celsius, req.relative_humidity, req.wind_speed_kmh, req.solar_radiation_wm2
    )
    return {
        "wbgt_celsius": wbgt,
        "is_estimated": is_estimated,
        "method": method
    }

@router.post("/utci")
def get_utci(req: UtciRequest):
    utci, is_estimated, method = calculate_utci(
        req.temp_celsius, req.relative_humidity, req.wind_speed_kmh, req.solar_radiation_wm2
    )
    return {
        "utci_celsius": utci,
        "is_estimated": is_estimated,
        "method": method
    }

@router.post("/htsi")
def get_htsi(req: HtsiRequest):
    wbgt, _, _ = calculate_wbgt(req.temp_celsius, req.relative_humidity, req.wind_speed_kmh, req.solar_radiation_wm2)
    utci, _, _ = calculate_utci(req.temp_celsius, req.relative_humidity, req.wind_speed_kmh, req.solar_radiation_wm2)
    score, level, sub = calculate_htsi(
        req.temp_celsius, req.relative_humidity, req.wind_speed_kmh, req.solar_radiation_wm2, wbgt, utci
    )
    return {
        "htsi_score": score,
        "risk_level": level,
        "sub_scores": sub,
        "wbgt": wbgt,
        "utci": utci
    }
