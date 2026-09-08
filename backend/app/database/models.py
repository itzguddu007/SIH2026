"""
SQLAlchemy Data Models for MoES Extreme Heatwave Early Warning System.
"""

from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    state = Column(String)
    country = Column(String, default="India")
    lat = Column(Float)
    lng = Column(Float)

    zones = relationship("Zone", back_populates="location")


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    name = Column(String, index=True)
    code = Column(String)

    location = relationship("Location", back_populates="zones")
    wards = relationship("Ward", back_populates="zone")


class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"))
    ward_number = Column(Integer, index=True)
    name = Column(String, index=True)
    lat = Column(Float)
    lng = Column(Float)
    geojson_polygon = Column(JSON)  # GeoJSON representation of ward boundary

    zone = relationship("Zone", back_populates="wards")
    vulnerability = relationship("PopulationVulnerability", back_populates="ward", uselist=False)
    weather_observations = relationship("WeatherObservation", back_populates="ward")
    weather_forecasts = relationship("WeatherForecast", back_populates="ward")
    hospitals = relationship("Hospital", back_populates="ward")
    cooling_centers = relationship("CoolingCenter", back_populates="ward")
    risk_assessments = relationship("RiskAssessment", back_populates="ward")


class PopulationVulnerability(Base):
    __tablename__ = "population_vulnerability"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), unique=True)
    total_population = Column(Integer)
    elderly_population = Column(Integer)  # 65+ years
    children_population = Column(Integer)  # 0-5 years
    outdoor_workers = Column(Integer)
    population_density = Column(Float)  # per sq km
    vulnerability_score = Column(Float)  # 0-100 score

    ward = relationship("Ward", back_populates="vulnerability")


class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    temp_celsius = Column(Float)
    relative_humidity = Column(Float)
    wind_speed_kmh = Column(Float)
    solar_radiation_wm2 = Column(Float)
    heat_index = Column(Float)
    wbgt = Column(Float)
    utci = Column(Float)

    ward = relationship("Ward", back_populates="weather_observations")


class WeatherForecast(Base):
    __tablename__ = "weather_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"))
    forecast_date = Column(String)  # YYYY-MM-DD
    horizon_hours = Column(Integer)  # 24, 48, 72, 96, 120
    temp_celsius = Column(Float)
    relative_humidity = Column(Float)
    wind_speed_kmh = Column(Float)
    solar_radiation_wm2 = Column(Float)
    heat_index = Column(Float)
    wbgt = Column(Float)
    utci = Column(Float)
    predicted_risk_level = Column(String)

    ward = relationship("Ward", back_populates="weather_forecasts")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"))
    record_date = Column(String)  # YYYY-MM-DD
    hospitalizations = Column(Integer)
    heat_stroke_cases = Column(Integer)
    mortality_count = Column(Integer)
    avg_temp = Column(Float)
    max_htsi = Column(Float)


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"))
    name = Column(String)
    address = Column(String)
    contact_phone = Column(String)
    total_beds = Column(Integer)
    available_beds = Column(Integer)
    icu_beds_total = Column(Integer)
    icu_beds_available = Column(Integer)
    heat_admissions_today = Column(Integer)
    preparedness_status = Column(String)  # READY, ELEVATED, CRITICAL
    lat = Column(Float)
    lng = Column(Float)

    ward = relationship("Ward", back_populates="hospitals")


class CoolingCenter(Base):
    __tablename__ = "cooling_centers"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"))
    name = Column(String)
    address = Column(String)
    capacity = Column(Integer)
    current_occupancy = Column(Integer)
    opening_hours = Column(String)
    is_active = Column(Boolean, default=True)
    facilities = Column(String)  # "Water, Air-Conditioned, Medical First Aid"
    contact_person = Column(String)
    contact_phone = Column(String)
    lat = Column(Float)
    lng = Column(Float)

    ward = relationship("Ward", back_populates="cooling_centers")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    horizon_hours = Column(Integer, default=24)
    htsi_score = Column(Float)
    risk_level = Column(String)  # LOW, MODERATE, HIGH, VERY HIGH, EXTREME
    mortality_risk = Column(Float)  # 0.0 to 1.0
    hospitalization_risk = Column(Float)  # 0.0 to 1.0
    confidence = Column(Float)  # 0.0 to 1.0
    explainability_json = Column(JSON)

    ward = relationship("Ward", back_populates="risk_assessments")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"))
    risk_level = Column(String)
    title = Column(String)
    message = Column(Text)
    expected_start = Column(String)
    expected_duration_hours = Column(Integer)
    affected_population = Column(Integer)
    status = Column(String, default="ACTIVE")  # ACTIVE, ACKNOWLEDGED, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow)


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"))
    channel = Column(String)  # SMS, WHATSAPP
    recipient = Column(String)
    message_text = Column(Text)
    status = Column(String)  # SENT, DELIVERED, FAILED, PENDING
    provider = Column(String)
    sent_at = Column(DateTime, default=datetime.utcnow)


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"))
    ward_id = Column(Integer, ForeignKey("wards.id"))
    action_type = Column(String)  # OPEN_COOLING_CENTER, SHIFT_WORK, ALERT_HOSPITAL, PUBLIC_WARNING
    description = Column(Text)
    assigned_to = Column(String)
    status = Column(String, default="PENDING")  # PENDING, IN_PROGRESS, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)
