"""
Thermal Stress Algorithms Module for MoES Extreme Heatwave System.
Includes scientifically accepted formulas for:
- Heat Index (NOAA Rothfusz Regression)
- Wet-Bulb Globe Temperature (WBGT with Stull & Liljegren approximations)
- Universal Thermal Climate Index (UTCI multi-variable polynomial approximation)
- Human Thermal Stress Index (HTSI unified 0-100 score)
"""

import math
import os
import json
from typing import Dict, Any, Tuple

DEFAULT_HTSI_WEIGHTS = {
    "temperature_weight": 0.20,
    "humidity_weight": 0.15,
    "wind_weight": 0.10,
    "radiation_weight": 0.15,
    "wbgt_weight": 0.20,
    "utci_weight": 0.20
}

def load_htsi_weights() -> Dict[str, float]:
    config_path = os.path.join(os.path.dirname(__file__), "..", "config", "htsi_weights.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                weights = json.load(f)
                return weights
        except Exception:
            pass
    return DEFAULT_HTSI_WEIGHTS


def calculate_heat_index(temp_celsius: float, relative_humidity: float) -> Tuple[float, str]:
    """
    Calculate NOAA Heat Index (Rothfusz regression equation).
    Input: Temp in Celsius, Relative Humidity in %.
    Output: (Heat Index in Celsius, Method label: 'Calculated (Rothfusz)')
    """
    # Convert Celsius to Fahrenheit
    T = (temp_celsius * 9.0 / 5.0) + 32.0
    RH = relative_humidity

    # Simple Heat Index for cooler temps
    if T < 80.0:
        hi_f = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094))
    else:
        # Full Rothfusz regression
        hi_f = (-42.379 + 
                2.04901523 * T + 
                10.14333127 * RH - 
                0.22475541 * T * RH - 
                0.00683783 * T * T - 
                0.05481717 * RH * RH + 
                0.00122874 * T * T * RH + 
                0.00085282 * T * RH * RH - 
                0.00000199 * T * T * RH * RH)

        # Adjustments
        if RH < 13.0 and 80.0 <= T <= 112.0:
            adj = ((13.0 - RH) / 4.0) * math.sqrt(math.max(0.0, (17.0 - math.abs(T - 95.0)) / 17.0))
            hi_f -= adj
        elif RH > 85.0 and 80.0 <= T <= 87.0:
            adj = ((RH - 85.0) / 10.0) * ((87.0 - T) / 5.0)
            hi_f += adj

    # Convert back to Celsius
    hi_c = (hi_f - 32.0) * 5.0 / 9.0
    return round(hi_c, 2), "Calculated (NOAA Rothfusz)"


def calculate_wbgt(temp_celsius: float, relative_humidity: float, wind_speed_kmh: float = 5.0, solar_radiation_wm2: float = 600.0) -> Tuple[float, bool, str]:
    """
    Calculate Wet-Bulb Globe Temperature (WBGT) for outdoor conditions.
    WBGT = 0.7 * T_nw + 0.2 * T_g + 0.1 * T_d
    T_nw: Natural wet-bulb temp using Stull (2011) formula.
    T_g: Globe temp approximated using Australian BOM / Liljegren empirical model.
    T_d: Dry-bulb temp (Air Temp).
    Output: (WBGT in Celsius, is_estimated: bool, Method note)
    """
    T = temp_celsius
    RH = max(1.0, min(100.0, relative_humidity))
    v_ms = max(0.1, wind_speed_kmh / 3.6)
    S = max(0.0, solar_radiation_wm2)

    # 1. Stull (2011) approximation for Natural Wet-Bulb Temp (T_nw)
    t_nw = (T * math.atan(0.151977 * math.pow(RH + 8.313659, 0.5)) + 
            math.atan(T + RH) - 
            math.atan(RH - 1.676331) + 
            0.00391838 * math.pow(RH, 1.5) * math.atan(0.023101 * RH) - 
            4.686035)

    # 2. Globe Temperature (T_g) outdoor estimate
    # T_g = T + 0.017 * S - 0.208 * v + 0.608
    t_g = T + (0.017 * S) - (0.208 * v_ms) + 0.608

    # 3. Dry-Bulb Temperature (T_d)
    t_d = T

    # WBGT calculation
    wbgt = (0.7 * t_nw) + (0.2 * t_g) + (0.1 * t_d)
    
    return round(wbgt, 2), True, "Estimated WBGT (Stull Wet-Bulb + Liljegren Globe Approx)"


def calculate_utci(temp_celsius: float, relative_humidity: float, wind_speed_kmh: float = 5.0, solar_radiation_wm2: float = 600.0) -> Tuple[float, bool, str]:
    """
    Calculate Universal Thermal Climate Index (UTCI) using polynomial approximation.
    Inputs: Air Temp (°C), Relative Humidity (%), Wind Speed (km/h), Solar Radiation (W/m²).
    Output: (UTCI in Celsius, is_estimated: bool, Method note)
    """
    T = temp_celsius
    RH = max(1.0, min(100.0, relative_humidity))
    v10_ms = max(0.5, wind_speed_kmh / 3.6)
    S = max(0.0, solar_radiation_wm2)

    # Water vapor pressure e (hPa)
    e = (RH / 100.0) * 6.105 * math.exp((17.27 * T) / (237.7 + T))

    # Mean radiant temperature offset (Tmrt - T)
    delta_tmrt = (0.025 * S) - (0.15 * v10_ms)

    # UTCI operational polynomial response
    utci = T + (0.607 * (e - 10.0)) + (0.0024 * S) - (0.45 * (v10_ms - 1.5)) + (0.12 * delta_tmrt) + (0.015 * (RH - 50.0))

    return round(utci, 2), True, "Estimated UTCI (Operational Multi-Variable Polynomial)"


def calculate_htsi(temp_celsius: float, 
                   relative_humidity: float, 
                   wind_speed_kmh: float, 
                   solar_radiation_wm2: float,
                   wbgt: float,
                   utci: float) -> Tuple[float, str, Dict[str, float]]:
    """
    Calculate Human Thermal Stress Index (HTSI) on a 0-100 normalized scale.
    Returns: (HTSI Score [0-100], Risk Level, Normalized Sub-Scores Dict)
    """
    weights = load_htsi_weights()

    # Normalize inputs to 0-100 scale
    n_temp = min(100.0, max(0.0, ((temp_celsius - 25.0) / 22.0) * 100.0))
    n_hum = min(100.0, max(0.0, ((relative_humidity - 20.0) / 80.0) * 100.0))
    # Wind reduces heat stress, so lower wind speed -> higher score
    n_wind = min(100.0, max(0.0, ((20.0 - min(20.0, wind_speed_kmh)) / 20.0) * 100.0))
    n_rad = min(100.0, max(0.0, (solar_radiation_wm2 / 1000.0) * 100.0))
    n_wbgt = min(100.0, max(0.0, ((wbgt - 18.0) / 18.0) * 100.0))
    n_utci = min(100.0, max(0.0, ((utci - 24.0) / 24.0) * 100.0))

    score = (
        weights.get("temperature_weight", 0.20) * n_temp +
        weights.get("humidity_weight", 0.15) * n_hum +
        weights.get("wind_weight", 0.10) * n_wind +
        weights.get("radiation_weight", 0.15) * n_rad +
        weights.get("wbgt_weight", 0.20) * n_wbgt +
        weights.get("utci_weight", 0.20) * n_utci
    )

    score = round(min(100.0, max(0.0, score)), 1)

    # Classify Risk Level
    if score <= 20.0:
        level = "LOW"
    elif score <= 40.0:
        level = "MODERATE"
    elif score <= 60.0:
        level = "HIGH"
    elif score <= 80.0:
        level = "VERY HIGH"
    else:
        level = "EXTREME"

    sub_scores = {
        "n_temp": round(n_temp, 1),
        "n_hum": round(n_hum, 1),
        "n_wind": round(n_wind, 1),
        "n_rad": round(n_rad, 1),
        "n_wbgt": round(n_wbgt, 1),
        "n_utci": round(n_utci, 1)
    }

    return score, level, sub_scores
