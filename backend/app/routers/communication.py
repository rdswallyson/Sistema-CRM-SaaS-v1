from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin
from ..core.database import db
from ..core.response import success_response
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/church/communication", tags=["Comunicação"])
birthday_router = APIRouter(prefix="/church/birthday-greetings", tags=["Aniversários"])

# ==================== COMUNICAÇÃO ====================
@router.post("/send", status_code=status.HTTP_201_CREATED)
async def send_communication(
    channel: str,
    message: str,
    recipient_ids: Optional[List[str]] = Query(None),
    subject: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    user_id = current_user.get("user_id")
    
    # Registrar o envio no histórico
    comm = {
        "id": str(uuid.uuid4()),
        "canal": channel,
        "assunto": subject,
        "mensagem": message,
        "destinatarios": recipient_ids or [],
        "total_destinatarios": len(recipient_ids) if recipient_ids else 0,
        "status": "enviado",
        "enviado_por": user_id,
        "organizacao_id": org_id,
        "criado_em": datetime.now(timezone.utc),
        "atualizado_em": datetime.now(timezone.utc),
        "deletado_em": None
    }
    await db.communication_history.insert_one(comm)
    
    return success_response(data={
        "message": f"Comunicação enviada via {channel} para {comm['total_destinatarios']} destinatário(s)",
        "id": comm["id"],
        "total_enviados": comm["total_destinatarios"]
    })

@router.get("/history")
@router.get("/history/")
async def get_communication_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    skip = (page - 1) * limit
    total = await db.communication_history.count_documents({"organizacao_id": org_id, "deletado_em": None})
    history = await db.communication_history.find(
        {"organizacao_id": org_id, "deletado_em": None}
    ).sort("criado_em", -1).skip(skip).limit(limit).to_list(limit)
    meta = {"page": page, "limit": limit, "total": total, "pages": (total + limit - 1) // limit}
    return success_response(data=history, meta=meta)

@router.post("/send-mass", status_code=status.HTTP_201_CREATED)
async def send_mass_communication(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    user_id = current_user.get("user_id")
    
    # Get recipients based on filters
    query = {"organizacao_id": org_id, "deletado_em": None, "status": "ativo"}
    if data.get("departamento_id"):
        query["departamento_id"] = data["departamento_id"]
    if data.get("grupo_id"):
        # Get members of the group
        group_members = await db.group_members.find({"group_id": data["grupo_id"], "deletado_em": None}).to_list(1000)
        query["id"] = {"$in": [gm["member_id"] for gm in group_members]}
    
    members = await db.members.find(query, {"_id": 0, "id": 1, "nome": 1, "email": 1, "telefone": 1}).to_list(5000)
    
    comm = {
        "id": str(uuid.uuid4()),
        "canal": data.get("canal", "email"),
        "assunto": data.get("assunto"),
        "mensagem": data["mensagem"],
        "destinatarios": [m["id"] for m in members],
        "total_destinatarios": len(members),
        "status": "enviado",
        "enviado_por": user_id,
        "organizacao_id": org_id,
        "criado_em": datetime.now(timezone.utc),
        "atualizado_em": datetime.now(timezone.utc),
        "deletado_em": None
    }
    await db.communication_history.insert_one(comm)
    
    return success_response(data={
        "message": f"Mensagem enviada para {len(members)} membro(s)",
        "id": comm["id"],
        "total_enviados": len(members)
    })

# ==================== ANIVERSÁRIOS ====================
@birthday_router.get("/template")
@birthday_router.get("/template/")
async def get_birthday_template(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    template = await db.birthday_templates.find_one({"organizacao_id": org_id, "deletado_em": None}, {"_id": 0})
    if not template:
        # Default template
        template = {
            "id": str(uuid.uuid4()),
            "mensagem": "Parabéns, {nome}! Que Deus abençoe sua vida neste dia especial! 🎂",
            "canal": "whatsapp",
            "ativo": True,
            "horario_envio": "09:00",
            "organizacao_id": org_id,
            "criado_em": datetime.now(timezone.utc),
            "atualizado_em": datetime.now(timezone.utc),
            "deletado_em": None
        }
        await db.birthday_templates.insert_one(template)
    return success_response(data=template)

@birthday_router.put("/template")
@birthday_router.put("/template/")
async def update_birthday_template(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    template = await db.birthday_templates.find_one({"organizacao_id": org_id, "deletado_em": None})
    
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    if template:
        await db.birthday_templates.update_one(
            {"organizacao_id": org_id, "deletado_em": None},
            {"$set": update_data}
        )
    else:
        new_template = {
            "id": str(uuid.uuid4()),
            "mensagem": data.get("mensagem", "Parabéns, {nome}!"),
            "canal": data.get("canal", "whatsapp"),
            "ativo": data.get("ativo", True),
            "horario_envio": data.get("horario_envio", "09:00"),
            "organizacao_id": org_id,
            "criado_em": datetime.now(timezone.utc),
            "atualizado_em": datetime.now(timezone.utc),
            "deletado_em": None
        }
        await db.birthday_templates.insert_one(new_template)
        template = new_template
    
    updated = await db.birthday_templates.find_one({"organizacao_id": org_id, "deletado_em": None}, {"_id": 0})
    return success_response(data=updated)

@birthday_router.get("/status")
@birthday_router.get("/status/")
async def get_birthday_status(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    
    hoje = datetime.now()
    mes_atual = hoje.month
    dia_atual = hoje.day
    
    # Aniversariantes de hoje
    members = await db.members.find(
        {"organizacao_id": org_id, "deletado_em": None, "data_nascimento": {"$ne": None}}
    ).to_list(5000)
    
    aniversariantes_hoje = []
    aniversariantes_mes = []
    
    for m in members:
        if m.get("data_nascimento"):
            try:
                birth = datetime.strptime(m["data_nascimento"], "%Y-%m-%d")
                if birth.month == mes_atual:
                    aniversariantes_mes.append({
                        "id": m["id"],
                        "nome": m["nome"],
                        "data_nascimento": m["data_nascimento"],
                        "foto_url": m.get("foto_url"),
                        "telefone": m.get("telefone"),
                        "email": m.get("email")
                    })
                    if birth.day == dia_atual:
                        aniversariantes_hoje.append({
                            "id": m["id"],
                            "nome": m["nome"],
                            "data_nascimento": m["data_nascimento"],
                            "foto_url": m.get("foto_url"),
                            "telefone": m.get("telefone"),
                            "email": m.get("email")
                        })
            except:
                pass
    
    template = await db.birthday_templates.find_one({"organizacao_id": org_id, "deletado_em": None})
    
    return success_response(data={
        "aniversariantes_hoje": aniversariantes_hoje,
        "aniversariantes_mes": aniversariantes_mes,
        "total_hoje": len(aniversariantes_hoje),
        "total_mes": len(aniversariantes_mes),
        "template_ativo": template.get("ativo", False) if template else False
    })

@birthday_router.post("/send")
@birthday_router.post("/send/")
async def send_birthday_greetings(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    user_id = current_user.get("user_id")
    
    template = await db.birthday_templates.find_one({"organizacao_id": org_id, "deletado_em": None})
    if not template:
        raise HTTPException(status_code=404, detail="Template de aniversário não configurado")
    
    hoje = datetime.now()
    members = await db.members.find(
        {"organizacao_id": org_id, "deletado_em": None, "data_nascimento": {"$ne": None}}
    ).to_list(5000)
    
    aniversariantes = []
    for m in members:
        if m.get("data_nascimento"):
            try:
                birth = datetime.strptime(m["data_nascimento"], "%Y-%m-%d")
                if birth.month == hoje.month and birth.day == hoje.day:
                    aniversariantes.append(m)
            except:
                pass
    
    # Registrar o envio
    comm = {
        "id": str(uuid.uuid4()),
        "canal": template.get("canal", "whatsapp"),
        "assunto": "Feliz Aniversário!",
        "mensagem": template.get("mensagem", "Parabéns!"),
        "destinatarios": [m["id"] for m in aniversariantes],
        "total_destinatarios": len(aniversariantes),
        "status": "enviado",
        "tipo": "aniversario",
        "enviado_por": user_id,
        "organizacao_id": org_id,
        "criado_em": datetime.now(timezone.utc),
        "atualizado_em": datetime.now(timezone.utc),
        "deletado_em": None
    }
    await db.communication_history.insert_one(comm)
    
    return success_response(data={
        "message": f"Parabéns enviado para {len(aniversariantes)} aniversariante(s)",
        "total_enviados": len(aniversariantes),
        "aniversariantes": [{"id": m["id"], "nome": m["nome"]} for m in aniversariantes]
    })
