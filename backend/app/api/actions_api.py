"""
Municipal Action Center API Endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database.session import get_db
from app.database.models import ActionItem, Ward, Alert
from app.schemas.system import ActionAssignRequest, ActionCompleteRequest

router = APIRouter(prefix="/api/actions", tags=["Municipal Action Center"])

@router.get("")
def get_action_items(db: Session = Depends(get_db)):
    actions = db.query(ActionItem).order_by(ActionItem.created_at.desc()).all()
    res = []
    for a in actions:
        w = db.query(Ward).get(a.ward_id)
        res.append({
            "id": a.id,
            "alert_id": a.alert_id,
            "ward_id": a.ward_id,
            "ward_name": w.name if w else f"Ward {a.ward_id}",
            "action_type": a.action_type,
            "description": a.description,
            "assigned_to": a.assigned_to,
            "status": a.status,
            "notes": a.notes,
            "created_at": a.created_at.isoformat(),
            "updated_at": a.updated_at.isoformat()
        })
    return res

@router.post("/assign")
def assign_action(req: ActionAssignRequest, db: Session = Depends(get_db)):
    item = db.query(ActionItem).get(req.action_id)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    item.assigned_to = req.assigned_to
    item.status = "IN_PROGRESS"
    if req.notes:
        item.notes = f"{item.notes or ''}\nAssigned: {req.notes}".strip()
    item.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Action item assigned successfully", "id": item.id, "status": item.status}

@router.post("/complete")
def complete_action(req: ActionCompleteRequest, db: Session = Depends(get_db)):
    item = db.query(ActionItem).get(req.action_id)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    item.status = "COMPLETED"
    if req.notes:
        item.notes = f"{item.notes or ''}\nCompletion note: {req.notes}".strip()
    item.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Action item marked completed", "id": item.id, "status": item.status}
