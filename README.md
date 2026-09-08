# Extreme Heatwave Early Warning and Human Thermal Stress Index System

**Problem Statement ID:** 26083  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** National Centre for Medium Range Weather Forecasting (NCMRWF)  
**Category:** Software  
**Theme:** Disaster Management

---

## 1. Overview

The **Extreme Heatwave Early Warning Platform** shifts heatwave disaster management from:

> *"What will the weather be?"*

to:

> *"What will the weather do to humans?"*

Traditional heatwave warnings rely purely on air temperature thresholds. This platform combines **air temperature, relative humidity, wind speed, solar radiation, historical health records, population density, elderly vulnerability, and outdoor worker density** to calculate localized human thermal stress and estimate 3–5 day predictive health/mortality risk at the ward level.

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Leaflet + OpenStreetMap (GIS), Recharts, Lucide Icons.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy, SQLite (with spatial GeoJSON store) / PostgreSQL + PostGIS fallback.
- **Data Science & ML**: NumPy, Pandas, SciPy, scikit-learn (RandomForest & GradientBoosting regressors).
- **Notifications**: Provider abstraction with SMS Gateway & Meta WhatsApp Business Cloud API integration (plus `MockNotificationProvider` for demo mode).

---

## 3. Key System Features

1. **Top Emergency KPI Cards**: Real-time display of Air Temp, Humidity, NOAA Heat Index, Estimated WBGT, Estimated UTCI, HTSI Risk Level badge, Hospitalization Inflow Risk %, and Mortality Risk %.
2. **Interactive GIS Map**: 25 City Wards GeoJSON choropleth with toggleable layers (*Thermal Stress*, *Mortality Risk*, *Elderly Population*, *Outdoor Workers*, *Hospitals*, *Cooling Centers*) and interactive ward inspector popup drawer.
3. **5-Day Predictive Forecast**: Ward-level predictions across 24h, 48h, 72h, 96h, and 120h horizons with Recharts trend trajectory curves.
4. **Municipal Action Center**: Command view for authorities with active alerts, municipal intervention checklist, assignment workflows, and SMS/WhatsApp dispatcher modal.
5. **Cooling Centers & Hospital Bed Tracker**: Real-time occupancy monitor for 12 cooling centers and bed/ICU surge capacity tracker for 10 emergency hospitals.
6. **Real-Time Heat Scenario Simulator**: Interactive what-if sensitivity panel allowing sliders for Temp (+0 to +5°C), Humidity (+0 to +30%), Wind (-10 to 0 km/h), and Radiation (+0 to +500 W/m²).
7. **Explainability Engine**: Algorithmic rationale breakdown ("Why is Ward 17 EXTREME?") explaining temperature excesses, wet-bulb strain, duration, and vulnerable demographic density.
8. **Model Validation & Science Hub**: ML evaluation matrix (Accuracy, F1, ROC-AUC, Confusion Matrix, MAE, RMSE) and scientific algorithm documentation protocols.

---

## 4. Quick Start & Local Execution

### Prerequisites
- Node.js v18+ & npm
- Python 3.10+

### Option A: Run Locally in Development Mode

#### 1. Start Backend Server
```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (Runs database auto-seed on startup)
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000` (Swagger Docs at `http://localhost:8000/docs`).

#### 2. Start Frontend Application
```bash
# Open a new terminal tab and navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend Web Dashboard will be live at `http://localhost:5173`.

---

### Option B: Run with Docker Compose
```bash
docker-compose up --build
```

---

## 5. Scientific Formulations Summary

- **NOAA Rothfusz Heat Index ($HI$)**: 9-parameter multivariable polynomial regression equation.
- **Wet-Bulb Globe Temperature ($WBGT$)**: Outdoor sunlit formula ($0.7 T_{nw} + 0.2 T_g + 0.1 T_d$) using Stull (2011) wet-bulb ($T_{nw}$) and Liljegren globe temperature ($T_g$). Labeled as **Estimated WBGT**.
- **Universal Thermal Climate Index ($UTCI$)**: Operational polynomial model incorporating 10m wind vector ($v_{10}$) and vapor pressure ($e$). Labeled as **Estimated UTCI**.
- **Human Thermal Stress Index ($HTSI$)**: Normalized 0–100 score loaded from `backend/app/config/htsi_weights.json`.

---

## 6. Running Unit Tests

```bash
# Run backend pytest suite
PYTHONPATH=backend backend/venv/bin/pytest backend/tests
```

---

## 7. Operational Disclaimer

> **DEMONSTRATION DATA NOTICE**: This prototype loads realistic synthetic demonstration datasets for 1 City, 5 Zones, 25 Wards, 10 Hospitals, 12 Cooling Centers, 5-Day Weather Forecasts, and 30-Day Health Records. Operational deployment requires integration with official MoES NCMRWF meteorological feeds and Ministry of Health epidemiological registries.
