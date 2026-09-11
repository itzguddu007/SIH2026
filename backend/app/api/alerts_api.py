"""
Alert Engine & Notification Endpoints (SMS/WhatsApp).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.database.models import Alert, NotificationLog, Ward, Zone, Location
from app.schemas.system import AlertSendRequest
from app.alerts.notifications import get_notification_provider

router = APIRouter(prefix="/api/alerts", tags=["Alerts & Notifications"])

@router.get("")
def get_active_alerts(location_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Alert).join(Ward)
    if location_id:
        query = query.join(Zone).filter(Zone.location_id == location_id)
    else:
        first_loc = db.query(Location).first()
        if first_loc:
            query = query.join(Zone).filter(Zone.location_id == first_loc.id)

    alerts = query.order_by(Alert.created_at.desc()).all()

    res = []
    for a in alerts:
        w = db.query(Ward).get(a.ward_id)
        res.append({
            "id": a.id,
            "ward_id": a.ward_id,
            "ward_name": w.name if w else f"Ward {a.ward_id}",
            "risk_level": a.risk_level,
            "title": a.title,
            "message": a.message,
            "expected_start": a.expected_start,
            "expected_duration_hours": a.expected_duration_hours,
            "affected_population": a.affected_population,
            "status": a.status,
            "created_at": a.created_at.isoformat()
        })
    return res

@router.post("/send")
def send_alert_notification(req: AlertSendRequest, db: Session = Depends(get_db)):
    ward = db.query(Ward).get(req.ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    provider = get_notification_provider()
    msg = req.custom_message or f"MoES EXTREME HEAT ALERT for {ward.name}: Stay indoors, stay hydrated, seek nearest cooling center."

    if req.channel.upper() == "WHATSAPP":
        result = provider.send_whatsapp(req.recipient, msg)
    else:
        result = provider.send_sms(req.recipient, msg)

    # Log dispatch
    log = NotificationLog(
        alert_id=None,
        channel=req.channel.upper(),
        recipient=req.recipient,
        message_text=msg,
        status=result.get("status", "SENT"),
        provider=result.get("provider", "Gateway")
    )
    db.add(log)
    db.commit()

    return result

@router.get("/logs")
def get_notification_logs(db: Session = Depends(get_db)):
    logs = db.query(NotificationLog).order_by(NotificationLog.sent_at.desc()).limit(50).all()
    res = []
    for l in logs:
        res.append({
            "id": l.id,
            "channel": l.channel,
            "recipient": l.recipient,
            "message_text": l.message_text,
            "status": l.status,
            "provider": l.provider,
            "sent_at": l.sent_at.isoformat()
        })
    return res
