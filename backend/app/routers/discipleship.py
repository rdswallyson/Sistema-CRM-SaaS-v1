from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin
from ..core.database import db
from ..core.response import success_response
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/church/discipleship", tags=["Discipulado"])

# ==================== TRILHAS ====================
@router.get("/trails")
@router.get("/trails/")
async def list_trails(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    trails = await db.discipleship_trails.find({"organizacao_id": org_id, "deletado_em": None}).sort("nome", 1).to_list(100)
    for trail in trails:
        trail["enrolled_count"] = await db.discipleship_progress.count_documents({
            "trilha_id": trail["id"], "organizacao_id": org_id, "deletado_em": None
        })
        trail["completed_count"] = await db.discipleship_progress.count_documents({
            "trilha_id": trail["id"], "organizacao_id": org_id, "status": "concluido", "deletado_em": None
        })
    return success_response(data=trails)

@router.post("/trails", status_code=status.HTTP_201_CREATED)
@router.post("/trails/", status_code=status.HTTP_201_CREATED)
async def create_trail(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    trail = {
        "id": str(uuid.uuid4()),
        "nome": data["nome"],
        "descricao": data.get("descricao"),
        "nivel": data.get("nivel", "basico"),
        "duracao_estimada_dias": data.get("duracao_estimada_dias", 30),
        "cor": data.get("cor", "#3b82f6"),
        "icone": data.get("icone"),
        "ativo": data.get("ativo", True),
        "passos": data.get("passos", []),
        "organizacao_id": org_id,
        "criado_em": datetime.now(timezone.utc),
        "atualizado_em": datetime.now(timezone.utc),
        "deletado_em": None
    }
    await db.discipleship_trails.insert_one(trail)
    return success_response(data=trail)

@router.get("/trails/{trail_id}")
async def get_trail(trail_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    trail = await db.discipleship_trails.find_one({"id": trail_id, "organizacao_id": org_id, "deletado_em": None})
    if not trail:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    return success_response(data=trail)

@router.put("/trails/{trail_id}")
async def update_trail(trail_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": trail_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.discipleship_trails.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.discipleship_trails.update_one(query, {"$set": update_data})
    updated = await db.discipleship_trails.find_one(query)
    return success_response(data=updated)

@router.delete("/trails/{trail_id}")
async def delete_trail(trail_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": trail_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.discipleship_trails.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    return success_response(data={"message": "Trilha removida com sucesso"})

@router.post("/trails/{trail_id}/steps", status_code=status.HTTP_201_CREATED)
async def add_trail_step(trail_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": trail_id, "organizacao_id": org_id, "deletado_em": None}
    trail = await db.discipleship_trails.find_one(query)
    if not trail:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    
    step = {
        "id": str(uuid.uuid4()),
        "titulo": data["titulo"],
        "descricao": data.get("descricao"),
        "tipo": data.get("tipo", "leitura"),
        "ordem": data.get("ordem", len(trail.get("passos", [])) + 1),
        "obrigatorio": data.get("obrigatorio", True),
        "criado_em": datetime.now(timezone.utc).isoformat()
    }
    
    await db.discipleship_trails.update_one(
        query,
        {"$push": {"passos": step}, "$set": {"atualizado_em": datetime.now(timezone.utc)}}
    )
    return success_response(data=step)

# ==================== PROGRESSO ====================
@router.get("/progress")
@router.get("/progress/")
async def list_progress(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    progress_list = await db.discipleship_progress.find({"organizacao_id": org_id, "deletado_em": None}).to_list(500)
    for p in progress_list:
        if p.get("membro_id"):
            m = await db.members.find_one({"id": p["membro_id"]}, {"_id": 0, "nome": 1, "foto_url": 1})
            p["membro"] = m
        if p.get("trilha_id"):
            t = await db.discipleship_trails.find_one({"id": p["trilha_id"]}, {"_id": 0, "nome": 1, "cor": 1})
            p["trilha"] = t
    return success_response(data=progress_list)

@router.get("/progress/member/{member_id}")
async def get_member_progress(member_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    progress_list = await db.discipleship_progress.find({
        "membro_id": member_id, "organizacao_id": org_id, "deletado_em": None
    }).to_list(100)
    for p in progress_list:
        if p.get("trilha_id"):
            t = await db.discipleship_trails.find_one({"id": p["trilha_id"]}, {"_id": 0, "nome": 1, "cor": 1, "passos": 1})
            p["trilha"] = t
    return success_response(data=progress_list)

@router.post("/enroll", status_code=status.HTTP_201_CREATED)
async def enroll_in_trail(
    member_id: str,
    trail_id: str,
    mentor_id: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    
    existing = await db.discipleship_progress.find_one({
        "membro_id": member_id, "trilha_id": trail_id, "organizacao_id": org_id, "deletado_em": None
    })
    if existing:
        raise HTTPException(status_code=400, detail="Membro já está inscrito nesta trilha")
    
    trail = await db.discipleship_trails.find_one({"id": trail_id, "organizacao_id": org_id, "deletado_em": None})
    if not trail:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    
    progress = {
        "id": str(uuid.uuid4()),
        "membro_id": member_id,
        "trilha_id": trail_id,
        "mentor_id": mentor_id,
        "status": "em_andamento",
        "passos_concluidos": [],
        "data_inicio": datetime.now(timezone.utc).isoformat(),
        "data_conclusao": None,
        "organizacao_id": org_id,
        "criado_em": datetime.now(timezone.utc),
        "atualizado_em": datetime.now(timezone.utc),
        "deletado_em": None
    }
    await db.discipleship_progress.insert_one(progress)
    return success_response(data=progress)

@router.put("/progress/{progress_id}/complete-step")
async def complete_trail_step(progress_id: str, step_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": progress_id, "organizacao_id": org_id, "deletado_em": None}
    progress = await db.discipleship_progress.find_one(query)
    if not progress:
        raise HTTPException(status_code=404, detail="Progresso não encontrado")
    
    passos_concluidos = progress.get("passos_concluidos", [])
    if step_id not in passos_concluidos:
        passos_concluidos.append(step_id)
    
    await db.discipleship_progress.update_one(
        query,
        {"$set": {"passos_concluidos": passos_concluidos, "atualizado_em": datetime.now(timezone.utc)}}
    )
    updated = await db.discipleship_progress.find_one(query)
    return success_response(data=updated)

@router.put("/progress/{progress_id}/complete")
async def complete_trail(progress_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": progress_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.discipleship_progress.update_one(
        query,
        {"$set": {
            "status": "concluido",
            "data_conclusao": datetime.now(timezone.utc).isoformat(),
            "atualizado_em": datetime.now(timezone.utc)
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Progresso não encontrado")
    updated = await db.discipleship_progress.find_one(query)
    return success_response(data=updated)

# ==================== ESTATÍSTICAS ====================
@router.get("/stats")
@router.get("/stats/")
async def get_discipleship_stats(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    tq = {"organizacao_id": org_id, "deletado_em": None}
    
    total_trails = await db.discipleship_trails.count_documents(tq)
    total_enrolled = await db.discipleship_progress.count_documents(tq)
    total_completed = await db.discipleship_progress.count_documents({**tq, "status": "concluido"})
    total_in_progress = await db.discipleship_progress.count_documents({**tq, "status": "em_andamento"})
    
    completion_rate = round((total_completed / total_enrolled * 100), 1) if total_enrolled > 0 else 0
    
    return success_response(data={
        "total_trails": total_trails,
        "total_enrolled": total_enrolled,
        "total_completed": total_completed,
        "total_in_progress": total_in_progress,
        "completion_rate": completion_rate
    })

# ==================== MENTORIAS ====================
@router.get("/mentorship")
@router.get("/mentorship/")
async def list_mentorships(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    mentorships = await db.mentorships.find({"organizacao_id": org_id, "deletado_em": None}).to_list(200)
    for m in mentorships:
        if m.get("mentor_id"):
            mentor = await db.members.find_one({"id": m["mentor_id"]}, {"_id": 0, "nome": 1, "foto_url": 1})
            m["mentor"] = mentor
        if m.get("discipulo_id"):
            discipulo = await db.members.find_one({"id": m["discipulo_id"]}, {"_id": 0, "nome": 1, "foto_url": 1})
            m["discipulo"] = discipulo
    return success_response(data=mentorships)

@router.post("/mentorship", status_code=status.HTTP_201_CREATED)
@router.post("/mentorship/", status_code=status.HTTP_201_CREATED)
async def create_mentorship(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    mentorship = {
        "id": str(uuid.uuid4()),
        "mentor_id": data["mentor_id"],
        "discipulo_id": data["discipulo_id"],
        "status": data.get("status", "ativo"),
        "observacoes": data.get("observacoes"),
        "data_inicio": data.get("data_inicio", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "organizacao_id": org_id,
        "criado_em": datetime.now(timezone.utc),
        "atualizado_em": datetime.now(timezone.utc),
        "deletado_em": None
    }
    await db.mentorships.insert_one(mentorship)
    return success_response(data=mentorship)
