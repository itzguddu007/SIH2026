"""
ML Model Evaluation & Science Protocol API Endpoint.
"""

from fastapi import APIRouter
from app.algorithms.mortality_model import ml_manager

router = APIRouter(prefix="/api/ml", tags=["Model Evaluation & Science Hub"])

@router.get("/metrics")
def get_ml_evaluation_metrics():
    if not ml_manager.is_trained:
        ml_manager.fit()
    return ml_manager.evaluation_metrics
