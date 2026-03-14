from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin
from ..core.database import db
from ..core.response import success_response, error_response
from ..models.teaching import Study, School, Class, ClassStatus, ClassMemberLink, Progress, ProgressStatus, StudyLevel
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/church/teaching", tags=["Ensino"])

# ==================== ESTUDOS ====================
@router.get("/estudos")
@router.get("/estudos/")
async def list_estudos(
    search: Optional[str] = None,
    nivel: Optional[str] = None,
    escola_id: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    if search:
        query["$or"] = [
            {"titulo": {"$regex": search, "$options": "i"}},
            {"descricao": {"$regex": search, "$options": "i"}}
        ]
    if nivel:
        query["nivel"] = nivel
    if escola_id:
        query["escola_id"] = escola_id
    estudos = await db.studies.find(query).sort("titulo", 1).to_list(200)
    return success_response(data=estudos)

@router.post("/estudos", status_code=status.HTTP_201_CREATED)
@router.post("/estudos/", status_code=status.HTTP_201_CREATED)
async def create_estudo(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    estudo = Study(
        titulo=data["titulo"],
        descricao=data.get("descricao"),
        categoria=data.get("categoria"),
        nivel=data.get("nivel", StudyLevel.BASICO),
        arquivo_url=data.get("arquivo_url"),
        escola_id=data.get("escola_id"),
        status=data.get("status", "ativo"),
        organizacao_id=org_id
    )
    doc = estudo.model_dump()
    await db.studies.insert_one(doc)
    return success_response(data=doc)

@router.get("/estudos/{estudo_id}")
async def get_estudo(estudo_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    estudo = await db.studies.find_one({"id": estudo_id, "organizacao_id": org_id, "deletado_em": None})
    if not estudo:
        raise HTTPException(status_code=404, detail="Estudo não encontrado")
    return success_response(data=estudo)

@router.put("/estudos/{estudo_id}")
async def update_estudo(estudo_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": estudo_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.studies.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Estudo não encontrado")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.studies.update_one(query, {"$set": update_data})
    updated = await db.studies.find_one(query)
    return success_response(data=updated)

@router.delete("/estudos/{estudo_id}")
async def delete_estudo(estudo_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": estudo_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.studies.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Estudo não encontrado")
    return success_response(data={"message": "Estudo removido com sucesso"})

# ==================== ESCOLAS ====================
@router.get("/escolas")
@router.get("/escolas/")
async def list_escolas(
    search: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    if search:
        query["$or"] = [
            {"nome": {"$regex": search, "$options": "i"}},
            {"descricao": {"$regex": search, "$options": "i"}}
        ]
    escolas = await db.schools.find(query).sort("nome", 1).to_list(100)
    for escola in escolas:
        escola["turma_count"] = await db.classes.count_documents({"escola_id": escola["id"], "deletado_em": None})
    return success_response(data=escolas)

@router.post("/escolas", status_code=status.HTTP_201_CREATED)
@router.post("/escolas/", status_code=status.HTTP_201_CREATED)
async def create_escola(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    escola = School(
        nome=data["nome"],
        descricao=data.get("descricao"),
        responsavel_id=data.get("responsavel_id"),
        departamento_id=data.get("departamento_id"),
        status=data.get("status", "ativa"),
        organizacao_id=org_id
    )
    doc = escola.model_dump()
    await db.schools.insert_one(doc)
    return success_response(data=doc)

@router.get("/escolas/{escola_id}")
async def get_escola(escola_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    escola = await db.schools.find_one({"id": escola_id, "organizacao_id": org_id, "deletado_em": None})
    if not escola:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    return success_response(data=escola)

@router.put("/escolas/{escola_id}")
async def update_escola(escola_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": escola_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.schools.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.schools.update_one(query, {"$set": update_data})
    updated = await db.schools.find_one(query)
    return success_response(data=updated)

@router.delete("/escolas/{escola_id}")
async def delete_escola(escola_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": escola_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.schools.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    return success_response(data={"message": "Escola removida com sucesso"})

# ==================== TURMAS ====================
@router.get("/turmas")
@router.get("/turmas/")
async def list_turmas(
    search: Optional[str] = None,
    escola_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    if search:
        query["nome"] = {"$regex": search, "$options": "i"}
    if escola_id:
        query["escola_id"] = escola_id
    if status_filter:
        query["status"] = status_filter
    turmas = await db.classes.find(query).sort("nome", 1).to_list(200)
    for t in turmas:
        t["aluno_count"] = await db.class_members.count_documents({"turma_id": t["id"], "deletado_em": None})
        if t.get("professor_id"):
            prof = await db.members.find_one({"id": t["professor_id"]}, {"_id": 0, "nome": 1})
            t["professor_nome"] = prof["nome"] if prof else None
        if t.get("escola_id"):
            escola = await db.schools.find_one({"id": t["escola_id"]}, {"_id": 0, "nome": 1})
            t["escola_nome"] = escola["nome"] if escola else None
    return success_response(data=turmas)

@router.post("/turmas", status_code=status.HTTP_201_CREATED)
@router.post("/turmas/", status_code=status.HTTP_201_CREATED)
async def create_turma(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    turma = Class(
        nome=data["nome"],
        escola_id=data["escola_id"],
        professor_id=data.get("professor_id"),
        data_inicio=data.get("data_inicio"),
        data_fim=data.get("data_fim"),
        status=data.get("status", ClassStatus.ATIVA),
        organizacao_id=org_id
    )
    doc = turma.model_dump()
    await db.classes.insert_one(doc)
    return success_response(data=doc)

@router.get("/turmas/{turma_id}")
async def get_turma(turma_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    turma = await db.classes.find_one({"id": turma_id, "organizacao_id": org_id, "deletado_em": None})
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    # Get students
    class_members = await db.class_members.find({"turma_id": turma_id, "deletado_em": None}).to_list(200)
    member_ids = [cm["membro_id"] for cm in class_members]
    students = []
    for mid in member_ids:
        m = await db.members.find_one({"id": mid, "deletado_em": None}, {"_id": 0, "id": 1, "nome": 1, "foto_url": 1, "cargo_id": 1})
        if m:
            students.append(m)
    turma["alunos"] = students
    return success_response(data=turma)

@router.put("/turmas/{turma_id}")
async def update_turma(turma_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": turma_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.classes.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.classes.update_one(query, {"$set": update_data})
    updated = await db.classes.find_one(query)
    return success_response(data=updated)

@router.delete("/turmas/{turma_id}")
async def delete_turma(turma_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": turma_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.classes.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return success_response(data={"message": "Turma removida com sucesso"})

# ==================== PROGRESSO ====================
@router.get("/progresso-ensino")
@router.get("/progresso-ensino/")
async def list_progresso(
    turma_id: Optional[str] = None,
    membro_id: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    if turma_id:
        query["turma_id"] = turma_id
    if membro_id:
        query["membro_id"] = membro_id
    progressos = await db.progress.find(query).to_list(500)
    return success_response(data=progressos)

@router.post("/progresso-ensino", status_code=status.HTTP_201_CREATED)
@router.post("/progresso-ensino/", status_code=status.HTTP_201_CREATED)
async def create_progresso(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    progresso = Progress(
        membro_id=data["membro_id"],
        turma_id=data.get("turma_id"),
        estudo_id=data.get("estudo_id"),
        status=data.get("status", ProgressStatus.EM_ANDAMENTO),
        nota=data.get("nota"),
        frequencia_pct=data.get("frequencia_pct"),
        observacao=data.get("observacao"),
        organizacao_id=org_id
    )
    doc = progresso.model_dump()
    await db.progress.insert_one(doc)
    return success_response(data=doc)

@router.put("/progresso-ensino/{progresso_id}")
async def update_progresso(progresso_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": progresso_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.progress.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Progresso não encontrado")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.progress.update_one(query, {"$set": update_data})
    updated = await db.progress.find_one(query)
    return success_response(data=updated)

# ==================== PAINEL ACADÊMICO ====================
@router.get("/painel-academico")
@router.get("/academic-panel")
async def get_academic_panel(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    tq = {"organizacao_id": org_id, "deletado_em": None}
    
    total_schools = await db.schools.count_documents({**tq, "status": "ativa"})
    total_classes = await db.classes.count_documents({**tq, "status": "ativa"})
    total_concluded = await db.classes.count_documents({**tq, "status": "concluida"})
    total_students = len(await db.class_members.distinct("membro_id", tq))
    
    total_progress = await db.progress.count_documents(tq)
    completed_progress = await db.progress.count_documents({**tq, "status": "concluido"})
    completion_rate = round((completed_progress / total_progress * 100), 1) if total_progress > 0 else 0
    
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
    org_id = current_user.get("organizacao_id")
    
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
    org_id = current_user.get("organizacao_id")
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
    org_id = current_user.get("organizacao_id")
    
    turma = await db.classes.find_one({"id": turma_id, "organizacao_id": org_id, "deletado_em": None})
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
        
    added = 0
    for mid in member_ids:
        existing = await db.class_members.find_one({"turma_id": turma_id, "membro_id": mid, "deletado_em": None})
        if not existing:
            link = ClassMemberLink(turma_id=turma_id, membro_id=mid, organizacao_id=org_id)
            await db.class_members.insert_one(link.model_dump())
            added += 1
            
    return success_response(data={"added": added})

@router.delete("/classes/{turma_id}/members/{member_id}")
async def remove_class_member(turma_id: str, member_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    result = await db.class_members.update_one(
        {"turma_id": turma_id, "membro_id": member_id, "deletado_em": None},
        {"$set": {"deletado_em": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    return success_response(data={"message": "Aluno removido da turma"})
