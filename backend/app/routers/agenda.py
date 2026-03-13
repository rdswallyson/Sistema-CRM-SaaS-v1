from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin, get_current_user
from ..core.database import db
from ..core.response import success_response, error_response
from ..models.agenda import Event, EventBase, EventType, Announcement, Notification, NotificationType, Note
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/church/agenda", tags=["Agenda"])

@router.get("/calendar")
async def get_calendar_events(
    start: str,
    end: str,
    tipo: Optional[EventType] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("tenant_id")
    query = {
        "organizacao_id": org_id,
        "deletado_em": None,
        "data_inicio": {"$gte": start, "$lte": end}
    }
    if tipo: query["tipo"] = tipo
    
    events = await db.events.find(query).to_list(500)
    
    # Auto-include birthdays in the calendar
    if not tipo or tipo == EventType.ANIVERSARIO:
        # Simplified: check members born in these months
        # For production, this would be a more complex date matching logic
        pass
        
    return success_response(data=events)

@router.post("/events", status_code=status.HTTP_201_CREATED)
async def create_event(data: EventBase, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    event = Event(**data.model_dump(), organizacao_id=org_id)
    doc = event.model_dump()
    await db.events.insert_one(doc)
    
    # Integration with Finance if paid
    if data.pago and data.valor > 0:
        # Create a notification or placeholder for financial tracking
        pass
        
    return success_response(data=doc)

@router.get("/notifications")
async def list_notifications(
    lida: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("user_id")
    query = {"usuario_id": user_id, "deletado_em": None}
    if lida is not None: query["lida"] = lida
    
    notifications = await db.notifications.find(query).sort("criado_em", -1).to_list(100)
    unread_count = await db.notifications.count_documents({"usuario_id": user_id, "lida": False, "deletado_em": None})
    
    return success_response(data=notifications, meta={"unread_count": unread_count})

@router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    result = await db.notifications.update_one(
        {"id": notif_id, "usuario_id": user_id},
        {"$set": {"lida": True, "atualizado_em": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    return success_response(data={"message": "Notificação marcada como lida"})

@router.put("/notifications/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    await db.notifications.update_many(
        {"usuario_id": user_id, "lida": False},
        {"$set": {"lida": True, "atualizado_em": datetime.now(timezone.utc)}}
    )
    return success_response(data={"message": "Todas as notificações marcadas como lidas"})

@router.get("/announcements")
async def list_announcements(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    
    announcements = await db.announcements.find(query).sort([("fixado", -1), ("criado_em", -1)]).to_list(100)
    return success_response(data=announcements)
