from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin, UserRole, get_current_user
from ..core.database import db
from ..core.response import success_response, error_response
from ..models.support import (
    Ticket, TicketMessage, SLAConfig, TicketPriority, TicketStatus,
    Tutorial, KnowledgeBase
)
from datetime import datetime, timezone, timedelta
import uuid

router = APIRouter(prefix="/support", tags=["Suporte"])

# ==================== TICKETS ====================
@router.get("/tickets")
async def list_tickets(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    status: Optional[str] = None,
    prioridade: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user.get("tenant_id")
    user_id = current_user.get("user_id")
    role = current_user.get("role")
    
    query = {"organizacao_id": org_id, "deletado_em": None}
    
    # Non-admins only see their own tickets
    if role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN_CHURCH]:
        query["usuario_id"] = user_id
        
    if status:
        query["status"] = status
    if prioridade:
        query["prioridade"] = prioridade

    skip = (page - 1) * limit
    total = await db.tickets.count_documents(query)
    items = await db.tickets.find(query).sort("data_abertura", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user info
    for item in items:
        user = await db.users.find_one({"id": item["usuario_id"]}, {"nome": 1, "email": 1})
        item["usuario"] = user if user else {"nome": "Usuário Desconhecido"}
        
        # Check SLA status
        sla = await db.configuracoes_sla.find_one({"organizacao_id": org_id, "prioridade": item["prioridade"]})
        if sla and item["status"] == TicketStatus.ABERTO:
            deadline = item["data_abertura"] + timedelta(minutes=sla["tempo_primeira_resposta_min"])
            item["sla_deadline"] = deadline.isoformat()
            item["sla_vencido"] = datetime.now(timezone.utc) > deadline
    
    meta = {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit
    }
    
    return success_response(data=items, meta=meta)

@router.post("/tickets", status_code=status.HTTP_201_CREATED)
async def create_ticket(data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    org_id = current_user.get("tenant_id")
    user_id = current_user.get("user_id")
    
    ticket = Ticket(
        usuario_id=user_id,
        titulo=data["titulo"],
        descricao=data["descricao"],
        categoria=data["categoria"],
        prioridade=data.get("prioridade", TicketPriority.MEDIA),
        anexos=data.get("anexos", []),
        organizacao_id=org_id
    )
    
    doc = ticket.model_dump()
    if isinstance(doc.get("data_abertura"), (date, datetime)):
        doc["data_abertura"] = doc["data_abertura"].isoformat()
        
    await db.tickets.insert_one(doc)
    return success_response(data=doc)

@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    org_id = current_user.get("tenant_id")
    user_id = current_user.get("user_id")
    role = current_user.get("role")
    
    query = {"id": ticket_id, "organizacao_id": org_id, "deletado_em": None}
    if role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN_CHURCH]:
        query["usuario_id"] = user_id
        
    ticket = await db.tickets.find_one(query)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    
    # Get messages
    messages = await db.ticket_messages.find({"ticket_id": ticket_id}).sort("criado_em", 1).to_list(100)
    for msg in messages:
        user = await db.users.find_one({"id": msg["usuario_id"]}, {"nome": 1, "email": 1, "role": 1})
        msg["usuario"] = user if user else {"nome": "Usuário Desconhecido"}
        
    ticket["mensagens"] = messages
    return success_response(data=ticket)

@router.post("/tickets/{ticket_id}/messages")
async def add_ticket_message(ticket_id: str, data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    org_id = current_user.get("tenant_id")
    user_id = current_user.get("user_id")
    
    ticket = await db.tickets.find_one({"id": ticket_id, "organizacao_id": org_id, "deletado_em": None})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    
    message = TicketMessage(
        ticket_id=ticket_id,
        usuario_id=user_id,
        mensagem=data["mensagem"],
        anexos=data.get("anexos", []),
        organizacao_id=org_id
    )
    
    doc = message.model_dump()
    if isinstance(doc.get("criado_em"), (date, datetime)):
        doc["criado_em"] = doc["criado_em"].isoformat()
        
    await db.ticket_messages.insert_one(doc)
    
    # Update ticket status if admin replied
    role = current_user.get("role")
    new_status = ticket["status"]
    if role in [UserRole.SUPER_ADMIN, UserRole.ADMIN_CHURCH]:
        new_status = TicketStatus.EM_ANDAMENTO
    else:
        new_status = TicketStatus.AGUARDANDO
        
    await db.tickets.update_one({"id": ticket_id}, {"$set": {"status": new_status, "atualizado_em": datetime.now(timezone.utc)}})
    
    return success_response(data=doc)

# ==================== SLA CONFIG ====================
@router.get("/sla-config")
async def get_sla_configs(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    configs = await db.configuracoes_sla.find({"organizacao_id": org_id, "deletado_em": None}).to_list(10)
    return success_response(data=configs)

@router.post("/sla-config")
async def save_sla_config(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    
    config = SLAConfig(**data, organizacao_id=org_id)
    doc = config.model_dump()
    
    await db.configuracoes_sla.update_one(
        {"organizacao_id": org_id, "prioridade": data["prioridade"]},
        {"$set": doc},
        upsert=True
    )
    return success_response(data=doc)

# ==================== DASHBOARD ====================
@router.get("/dashboard/stats")
async def support_dashboard(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    
    # Counts by status
    pipeline_status = [
        {"$match": {"organizacao_id": org_id, "deletado_em": None}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_stats = await db.tickets.aggregate(pipeline_status).to_list(10)
    
    # Resolved tickets in last 30 days
    last_30_days = datetime.now(timezone.utc) - timedelta(days=30)
    resolved_count = await db.tickets.count_documents({
        "organizacao_id": org_id,
        "status": TicketStatus.RESOLVIDO,
        "data_resolucao": {"$gte": last_30_days.isoformat()}
    })

    return success_response(data={
        "by_status": status_stats,
        "resolved_last_30_days": resolved_count
    })

# ==================== TUTORIALS & KB ====================
@router.get("/tutorials")
async def list_tutorials(current_user: dict = Depends(get_current_user)):
    org_id = current_user.get("tenant_id")
    items = await db.tutorials.find({"organizacao_id": org_id, "deletado_em": None}).to_list(100)
    return success_response(data=items)

@router.get("/knowledge-base")
async def list_kb(current_user: dict = Depends(get_current_user)):
    org_id = current_user.get("tenant_id")
    items = await db.knowledge_base.find({"organizacao_id": org_id, "deletado_em": None}).to_list(100)
    return success_response(data=items)
