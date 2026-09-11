"""
Locations API Endpoints for MoES Multi-City Platform.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.database.models import Location

router = APIRouter(prefix="/api/locations", tags=["Locations"])

@router.get("")
def get_all_locations(db: Session = Depends(get_db)):
    """Return list of all supported major Indian metropolitan cities."""
    locations = db.query(Location).order_by(Location.id).all()
    return [
        {
            "id": loc.id,
            "name": loc.name,
            "state": loc.state,
            "country": loc.country,
            "lat": loc.lat,
            "lng": loc.lng
        }
        for loc in locations
    ]
