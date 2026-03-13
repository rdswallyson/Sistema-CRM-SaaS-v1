from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin
from ..core.database import db
from ..core.response import success_response, error_response
from ..models.teaching import Study, School, Class, ClassStatus, ClassMemberLink, Progress, ProgressStatus, StudyLevel
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/church/teaching", tags=["Ensino"])

@router.get("/academic-panel")
async def get_academic_panel(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    tq = {"organizacao_id": org_id, "deletado_em": None}
    
    total_schools = await db.schools.count_documents({**tq, "status": "ativa"})
    total_classes = await db.classes.count_documents({**tq, "status": "ativa"})
    total_concluded = await db.classes.count_documents({**tq, "status": "concluida"})
    total_students = len(await db.class_members.distinct("membro_id", tq))
    
    # Conclusion rate
    total_progress = await db.progress.count_documents(tq)
    completed_progress = await db.progress.count_documents({**tq, "status": "concluido"})
    completion_rate = round((completed_progress / total_progress * 100), 1) if total_progress > 0 else 0
    
    # By Level stats
    level_stats = {}
    for level in StudyLevel:
        level_stats[level.value] = await db.studies.count_documents({**tq, "nivel": level})
        
    return success_response(data={
        "total_schools": total_schools,
        "total_classes": total_classes,
        "total_concluded": total_concluded,
        "total_students": total_students,
        "completion_rate": completion_rate,
        "level_stats": level_stats
    })

@router.get("/tracking/{member_id}")
async def get_member_tracking(member_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    
    member = await db.members.find_one({"id": member_id, "organizacao_id": org_id, "deletado_em": None}, {"_id": 0, "nome": 1})
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
        
    progress_list = await db.progress.find({"membro_id": member_id, "organizacao_id": org_id, "deletado_em": None}).to_list(100)
    for p in progress_list:
        if p.get("turma_id"):
            t = await db.classes.find_one({"id": p["turma_id"]}, {"_id": 0, "nome": 1})
            p["turma_nome"] = t["nome"] if t else "Turma removida"
        if p.get("estudo_id"):
            e = await db.studies.find_one({"id": p["estudo_id"]}, {"_id": 0, "titulo": 1})
            p["estudo_titulo"] = e["titulo"] if e else "Estudo removido"
            
    return success_response(data={
        "member": member,
        "progress": progress_list
    })

@router.get("/classes")
async def list_classes(
    status: Optional[ClassStatus] = None,
    escola_id: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("tenant_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    if status: query["status"] = status
    if escola_id: query["escola_id"] = escola_id
    
    classes = await db.classes.find(query).to_list(100)
    for c in classes:
        c["aluno_count"] = await db.class_members.count_documents({"turma_id": c["id"], "deletado_em": None})
        if c.get("professor_id"):
            prof = await db.members.find_one({"id": c["professor_id"]}, {"_id": 0, "nome": 1})
            c["professor_nome"] = prof["nome"] if prof else "Professor não encontrado"
            
    return success_response(data=classes)

@router.post("/classes/{turma_id}/members")
async def add_class_members(turma_id: str, member_ids: List[str], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    
    # Check if class exists
    turma = await db.classes.find_one({"id": turma_id, "organizacao_id": org_id, "deletado_em": None})
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
        
    added = 0
    for mid in member_ids:
        # Check if already in class
        existing = await db.class_members.find_one({"turma_id": turma_id, "membro_id": mid, "deletado_em": None})
        if not existing:
            link = ClassMemberLink(turma_id=turma_id, membro_id=mid, organizacao_id=org_id)
            await db.class_members.insert_one(link.model_dump())
            added += 1
            
    return success_response(data={"added": added})
