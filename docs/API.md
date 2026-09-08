# REST API Documentation

## Weather & Forecast Endpoints
- `GET /api/weather/current?ward_id={id}`: Current weather observation & calculated indices.
- `GET /api/weather/forecast?ward_id={id}`: 5-Day forecast (24h, 48h, 72h, 96h, 120h).

## Risk Assessment
- `GET /api/risk/current`: City-wide overall HTSI score, risk level, and ward counts.
- `GET /api/risk/ward/{ward_id}`: Ward-level thermal stress, vulnerability, and explainability rationale.

## Interactive Calculations
- `POST /api/thermal/heat-index`: Interactive HI calculator.
- `POST /api/thermal/wbgt`: Interactive WBGT calculator.
- `POST /api/thermal/utci`: Interactive UTCI calculator.
- `POST /api/thermal/htsi`: Interactive HTSI calculator.

## GIS System
- `GET /api/map/wards`: GeoJSON FeatureCollection of 25 city wards with risk properties.
- `GET /api/map/hospitals`: 10 Hospitals with bed & ICU availability.
- `GET /api/map/cooling-centers`: 12 Municipal Cooling Shelters with live occupancy.

## Alerts & Dispatcher
- `GET /api/alerts`: Active heat alerts.
- `POST /api/alerts/send`: Dispatch SMS/WhatsApp alert.
- `GET /api/alerts/logs`: Dispatch history logs.

## Real-Time Simulation
- `POST /api/simulation/run`: Perform what-if sensitivity analysis across all 25 wards.

## ML Evaluation
- `GET /api/ml/metrics`: Classification & regression evaluation matrix (Accuracy, F1, ROC-AUC, MAE, Confusion Matrix).
