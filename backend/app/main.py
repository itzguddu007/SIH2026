"""
FastAPI Main Application Entry Point for MoES NCMRWF Extreme Heatwave System.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine, Base, SessionLocal
from app.database.seed_data import seed_database
from app.algorithms.mortality_model import ml_manager

from app.api.thermal_api import router as thermal_router
from app.api.weather_api import router as weather_router
from app.api.risk_api import router as risk_router
from app.api.gis_api import router as gis_router
from app.api.alerts_api import router as alerts_router
from app.api.actions_api import router as actions_router
from app.api.simulation_api import router as simulation_router
from app.api.analytics_api import router as analytics_router
from app.api.ml_eval_api import router as ml_eval_router
from app.api.locations_api import router as locations_router

app = FastAPI(
    title="MoES NCMRWF Extreme Heatwave Early Warning & Human Thermal Stress System",
    description="Operational API for predicting 3-5 day localized human thermal stress, mortality risk, and municipal emergency dispatch.",
    version="1.0.0"
)

# CORS middleware for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(locations_router)
app.include_router(thermal_router)
app.include_router(weather_router)
app.include_router(risk_router)
app.include_router(gis_router)
app.include_router(alerts_router)
app.include_router(actions_router)
app.include_router(simulation_router)
app.include_router(analytics_router)
app.include_router(ml_eval_router)


@app.on_event("startup")
def startup_event():
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Train ML models
    ml_manager.fit()

@app.get("/")
def root():
    return {
        "title": "MoES NCMRWF Extreme Heatwave Early Warning Platform",
        "status": "OPERATIONAL",
        "mode": "DEMONSTRATION & PROTOTYPE MODE",
        "organization": "Ministry of Earth Sciences (MoES), Govt of India",
        "department": "National Centre for Medium Range Weather Forecasting (NCMRWF)",
        "problem_statement_id": "26083"
    }
