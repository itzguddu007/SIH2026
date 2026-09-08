"""
Pydantic API Schemas for MoES Extreme Heatwave System.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- Thermal Calculations ---
class HeatIndexRequest(BaseModel):
    temp_celsius: float = Field(..., example=41.2, description="Air Temperature in °C")
    relative_humidity: float = Field(..., example=68.0, description="Relative Humidity in %")

class WbgtRequest(BaseModel):
    temp_celsius: float = Field(..., example=41.2)
    relative_humidity: float = Field(..., example=68.0)
    wind_speed_kmh: float = Field(default=5.0)
    solar_radiation_wm2: float = Field(default=600.0)

class UtciRequest(BaseModel):
    temp_celsius: float = Field(..., example=41.2)
    relative_humidity: float = Field(..., example=68.0)
    wind_speed_kmh: float = Field(default=5.0)
    solar_radiation_wm2: float = Field(default=600.0)

class HtsiRequest(BaseModel):
    temp_celsius: float = Field(..., example=41.2)
    relative_humidity: float = Field(..., example=68.0)
    wind_speed_kmh: float = Field(default=5.0)
    solar_radiation_wm2: float = Field(default=600.0)

# --- Weather ---
class WeatherResponse(BaseModel):
    temp_celsius: float
    relative_humidity: float
    wind_speed_kmh: float
    solar_radiation_wm2: float
    heat_index: float
    wbgt: float
    utci: float
    timestamp: Optional[str] = None

class WeatherForecastResponse(BaseModel):
    forecast_date: str
    horizon_hours: int
    temp_celsius: float
    relative_humidity: float
    wind_speed_kmh: float
    solar_radiation_wm2: float
    heat_index: float
    wbgt: float
    utci: float
    predicted_risk_level: str

# --- Simulation ---
class SimulationRequest(BaseModel):
    temp_offset: float = Field(default=0.0, ge=0.0, le=5.0)
    humidity_offset: float = Field(default=0.0, ge=0.0, le=30.0)
    wind_offset: float = Field(default=0.0, ge=-10.0, le=0.0)
    radiation_offset: float = Field(default=0.0, ge=0.0, le=500.0)

# --- Alerts & Actions ---
class AlertSendRequest(BaseModel):
    ward_id: int
    channel: str = Field(default="SMS", example="SMS")  # SMS or WHATSAPP
    recipient: str = Field(..., example="+919876543210")
    custom_message: Optional[str] = None

class ActionAssignRequest(BaseModel):
    action_id: int
    assigned_to: str
    notes: Optional[str] = None

class ActionCompleteRequest(BaseModel):
    action_id: int
    notes: Optional[str] = None
