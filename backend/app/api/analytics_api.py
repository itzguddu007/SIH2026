"""
Historical Analytics & Health Correlation API Endpoints.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import HealthRecord, Ward

router = APIRouter(prefix="/api/analytics", tags=["Historical Analytics"])

@router.get("/historical")
def get_historical_analytics(ward_id: int = Query(1), db: Session = Depends(get_db)):
    ward = db.query(Ward).get(ward_id)
    records = db.query(HealthRecord).filter_by(ward_id=ward_id).order_by(HealthRecord.record_date.asc()).all()

    trend_data = []
    for r in records:
        trend_data.append({
            "date": r.record_date,
            "avg_temp": r.avg_temp,
            "max_htsi": r.max_htsi,
            "hospitalizations": r.hospitalizations,
            "heat_stroke_cases": r.heat_stroke_cases,
            "mortality_count": r.mortality_count
        })

    return {
        "ward_id": ward_id,
        "ward_name": ward.name if ward else f"Ward {ward_id}",
        "trend_data": trend_data
    }

@router.get("/correlations")
def get_heat_health_correlations(db: Session = Depends(get_db)):
    # Aggregated city-wide daily trend
    records = db.query(HealthRecord).all()
    grouped = {}
    for r in records:
        d = r.record_date
        if d not in grouped:
            grouped[d] = {
                "date": d,
                "temps": [],
                "htsis": [],
                "hosp": [],
                "mort": []
            }
        grouped[d]["temps"].append(r.avg_temp)
        grouped[d]["htsis"].append(r.max_htsi)
        grouped[d]["hosp"].append(r.hospitalizations)
        grouped[d]["mort"].append(r.mortality_count)

    res = []
    for d in sorted(grouped.keys()):
        g = grouped[d]
        res.append({
            "date": d,
            "avg_temp": round(sum(g["temps"]) / len(g["temps"]), 1),
            "avg_htsi": round(sum(g["htsis"]) / len(g["htsis"]), 1),
            "total_hospitalizations": sum(g["hosp"]),
            "total_mortality": sum(g["mort"])
        })
    return res
