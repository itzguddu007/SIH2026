"""
Unit test suite for Live Weather Service and Open-Meteo integration across cities.
"""

import pytest
from app.services.live_weather_service import fetch_open_meteo_data, sync_live_weather, get_sync_status
from app.database.session import SessionLocal
from app.database.seed_data import seed_database

def test_open_meteo_live_fetch():
    """Verify live HTTP payload from Open-Meteo API for New Delhi coordinates."""
    data = fetch_open_meteo_data(28.6139, 77.2090)
    assert data is not None, "Open-Meteo API response should not be None"
    assert "current" in data, "Open-Meteo payload must contain 'current' section"
    assert "temperature_2m" in data["current"]
    assert "relative_humidity_2m" in data["current"]

def test_live_weather_sync_execution():
    """Verify syncing database records with live weather data."""
    db = SessionLocal()
    try:
        seed_database(db)
        status = sync_live_weather(db, location_id=1)
        assert status["is_live"] is True
        assert status["ward_count"] == 25
        assert status["current_city_weather"] is not None
        assert status["source"].startswith("Open-Meteo")

        status_all = sync_live_weather(db)
        assert status_all["ward_count"] == 175
    finally:
        db.close()
