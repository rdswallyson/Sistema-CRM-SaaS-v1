from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin, get_current_user
from ..core.database import db
from ..core.response import success_response, error_response
from ..models.agenda import Event, EventBase, EventType, Announcement, AnnouncementBase, Notification, NotificationType, Note, NoteBase
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/church/agenda", tags=["Agenda"])

# ==================== EVENTOS ====================
@router.get("/eventos")
@router.get("/eventos/")
@router.get("/events")
@router.get("/events/")
async def list_eventos(
    search: Optional[str] = None,
    tipo: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    if search:
        query["titulo"] = {"$regex": search, "$options": "i"}
    if tipo:
        query["tipo"] = tipo
    if data_inicio:
        query.setdefault("data_inicio", {})["$gte"] = data_inicio
    if data_fim:
        query.setdefault("data_inicio", {})["$lte"] = data_fim
    
    eventos = await db.events.find(query).sort("data_inicio", -1).to_list(200)
    return success_response(data=eventos)

@router.post("/eventos", status_code=status.HTTP_201_CREATED)
@router.post("/eventos/", status_code=status.HTTP_201_CREATED)
@router.post("/events", status_code=status.HTTP_201_CREATED)
@router.post("/events/", status_code=status.HTTP_201_CREATED)
async def create_evento(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    evento = Event(
        titulo=data["titulo"],
        descricao=data.get("descricao"),
        tipo=data.get("tipo", EventType.EVENTO),
        data_inicio=data["data_inicio"],
        data_fim=data.get("data_fim"),
        local=data.get("local"),
        pago=data.get("pago", False),
        valor=data.get("valor", 0.0),
        categoria_id=data.get("categoria_id"),
        departamento_id=data.get("departamento_id"),
        cor=data.get("cor", "#3b82f6"),
        status=data.get("status", "confirmado"),
        organizacao_id=org_id
    )
    doc = evento.model_dump()
    await db.events.insert_one(doc)
    return success_response(data=doc)

@router.get("/eventos/{evento_id}")
@router.get("/events/{evento_id}")
async def get_evento(evento_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    evento = await db.events.find_one({"id": evento_id, "organizacao_id": org_id, "deletado_em": None})
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return success_response(data=evento)

@router.put("/eventos/{evento_id}")
@router.put("/events/{evento_id}")
async def update_evento(evento_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": evento_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.events.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.events.update_one(query, {"$set": update_data})
    updated = await db.events.find_one(query)
    return success_response(data=updated)

@router.delete("/eventos/{evento_id}")
@router.delete("/events/{evento_id}")
async def delete_evento(evento_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": evento_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.events.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return success_response(data={"message": "Evento removido com sucesso"})

# ==================== CALENDÁRIO ====================
@router.get("/calendar")
@router.get("/calendario")
async def get_calendar_events(
    start: Optional[str] = None,
    end: Optional[str] = None,
    tipo: Optional[EventType] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    if start and end:
        query["data_inicio"] = {"$gte": start, "$lte": end}
    elif start:
        query["data_inicio"] = {"$gte": start}
    if tipo:
        query["tipo"] = tipo
    
    events = await db.events.find(query).to_list(500)
    
    # Include birthdays
    members_with_birthday = await db.members.find(
        {"organizacao_id": org_id, "deletado_em": None, "data_nascimento": {"$ne": None}}
    ).to_list(1000)
    
    for m in members_with_birthday:
        if m.get("data_nascimento"):
            try:
                birth_date = datetime.strptime(m["data_nascimento"], "%Y-%m-%d")
                current_year = datetime.now().year
                birthday_this_year = f"{current_year}-{birth_date.month:02d}-{birth_date.day:02d}"
                events.append({
                    "id": f"birthday_{m['id']}",
                    "titulo": f"Aniversário: {m['nome']}",
                    "tipo": "aniversario",
                    "data_inicio": birthday_this_year,
                    "cor": "#f59e0b",
                    "membro_id": m["id"],
                    "foto_url": m.get("foto_url")
                })
            except:
                pass
    
    return success_response(data=events)

# ==================== MURAL DE AVISOS ====================
@router.get("/announcements")
@router.get("/announcements/")
@router.get("/avisos")
@router.get("/avisos/")
async def list_announcements(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    announcements = await db.announcements.find(query).sort([("fixado", -1), ("criado_em", -1)]).to_list(100)
    return success_response(data=announcements)

@router.post("/announcements", status_code=status.HTTP_201_CREATED)
@router.post("/announcements/", status_code=status.HTTP_201_CREATED)
@router.post("/avisos", status_code=status.HTTP_201_CREATED)
@router.post("/avisos/", status_code=status.HTTP_201_CREATED)
async def create_announcement(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    aviso = Announcement(
        titulo=data["titulo"],
        mensagem=data["mensagem"],
        prioridade=data.get("prioridade", 0),
        fixado=data.get("fixado", False),
        agendado_para=data.get("agendado_para"),
        departamento_id=data.get("departamento_id"),
        grupo_id=data.get("grupo_id"),
        organizacao_id=org_id
    )
    doc = aviso.model_dump()
    await db.announcements.insert_one(doc)
    return success_response(data=doc)

@router.put("/announcements/{aviso_id}")
@router.put("/avisos/{aviso_id}")
async def update_announcement(aviso_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": aviso_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.announcements.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Aviso não encontrado")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.announcements.update_one(query, {"$set": update_data})
    updated = await db.announcements.find_one(query)
    return success_response(data=updated)

@router.delete("/announcements/{aviso_id}")
@router.delete("/avisos/{aviso_id}")
async def delete_announcement(aviso_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": aviso_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.announcements.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Aviso não encontrado")
    return success_response(data={"message": "Aviso removido com sucesso"})

# ==================== NOTIFICAÇÕES ====================
@router.get("/notifications")
@router.get("/notifications/")
@router.get("/notificacoes")
@router.get("/notificacoes/")
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
@router.put("/notificacoes/{notif_id}/lida")
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
@router.put("/notificacoes/marcar-todas-lidas")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    await db.notifications.update_many(
        {"usuario_id": user_id, "lida": False},
        {"$set": {"lida": True, "atualizado_em": datetime.now(timezone.utc)}}
    )
    return success_response(data={"message": "Todas as notificações marcadas como lidas"})

@router.delete("/notificacoes/{notif_id}")
async def delete_notificacao(notif_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    result = await db.notifications.update_one(
        {"id": notif_id, "usuario_id": user_id},
        {"$set": {"deletado_em": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    return success_response(data={"message": "Notificação removida"})

# ==================== MINHAS ANOTAÇÕES ====================
@router.get("/notes")
@router.get("/notes/")
@router.get("/anotacoes")
@router.get("/anotacoes/")
async def list_notes(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    notes = await db.notes.find({"usuario_id": user_id, "deletado_em": None}).sort("criado_em", -1).to_list(100)
    return success_response(data=notes)

@router.post("/notes", status_code=status.HTTP_201_CREATED)
@router.post("/notes/", status_code=status.HTTP_201_CREATED)
@router.post("/anotacoes", status_code=status.HTTP_201_CREATED)
@router.post("/anotacoes/", status_code=status.HTTP_201_CREATED)
async def create_note(data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    org_id = current_user.get("organizacao_id")
    note = Note(
        titulo=data["titulo"],
        conteudo=data["conteudo"],
        cor=data.get("cor", "#fef08a"),
        lembrete_em=data.get("lembrete_em"),
        usuario_id=user_id,
        organizacao_id=org_id
    )
    doc = note.model_dump()
    await db.notes.insert_one(doc)
    return success_response(data=doc)

@router.put("/notes/{note_id}")
@router.put("/anotacoes/{note_id}")
async def update_note(note_id: str, data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    query = {"id": note_id, "usuario_id": user_id, "deletado_em": None}
    existing = await db.notes.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Anotação não encontrada")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.notes.update_one(query, {"$set": update_data})
    updated = await db.notes.find_one(query)
    return success_response(data=updated)

@router.delete("/notes/{note_id}")
@router.delete("/anotacoes/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    result = await db.notes.update_one(
        {"id": note_id, "usuario_id": user_id},
        {"$set": {"deletado_em": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Anotação não encontrada")
    return success_response(data={"message": "Anotação removida"})
