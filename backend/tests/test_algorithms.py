"""
Unit Tests for Thermal Algorithms (Heat Index, WBGT, UTCI, HTSI) & ML Model Pipeline.
"""

import pytest
from app.algorithms.thermal import (
    calculate_heat_index, calculate_wbgt, calculate_utci, calculate_htsi
)
from app.algorithms.mortality_model import ml_manager

def test_heat_index_celsius():
    # 40°C air temp, 50% relative humidity
    hi_c, method = calculate_heat_index(40.0, 50.0)
    assert hi_c > 40.0, "Heat index should be greater than air temp under high humidity"
    assert "Rothfusz" in method

def test_wbgt_estimation():
    wbgt, is_est, method = calculate_wbgt(42.0, 60.0, wind_speed_kmh=5.0, solar_radiation_wm2=700.0)
    assert is_est is True
    assert wbgt > 30.0, "WBGT should reflect severe thermal strain"

def test_utci_estimation():
    utci, is_est, method = calculate_utci(41.0, 55.0, wind_speed_kmh=6.0, solar_radiation_wm2=650.0)
    assert is_est is True
    assert utci > 38.0

def test_htsi_classification():
    # Extreme heat inputs
    score, level, sub = calculate_htsi(43.0, 70.0, 3.0, 800.0, 34.5, 45.0)
    assert level in ["EXTREME", "VERY HIGH"]
    assert score > 70.0

def test_ml_model_prediction():
    feat = {
        "temp_celsius": 42.0,
        "humidity": 65.0,
        "wbgt": 33.0,
        "utci": 44.0,
        "htsi": 85.0,
        "heat_duration_days": 3,
        "night_min_temp": 30.0,
        "pop_density": 15000.0,
        "vulnerable_ratio": 0.25,
        "outdoor_worker_ratio": 0.25
    }
    m_risk, h_risk, conf_str, conf_val = ml_manager.predict(feat)
    assert 0.0 <= m_risk <= 1.0
    assert 0.0 <= h_risk <= 1.0
    assert conf_val > 0.5
