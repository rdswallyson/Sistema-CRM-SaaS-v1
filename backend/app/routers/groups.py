from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin
from ..core.database import db
from ..core.response import success_response, error_response
from ..models.groups import Group, GroupCreate, GroupUpdate, GroupStatus, GroupMemberLink, GroupCategory
from datetime import datetime, timezone, timedelta
import uuid

router = APIRouter(prefix="/church/groups", tags=["Grupos"])

@router.get("/")
async def list_groups(
    categoria_id: Optional[str] = None,
    departamento_id: Optional[str] = None,
    lider_id: Optional[str] = None,
    status: Optional[GroupStatus] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("tenant_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    
    if categoria_id: query["categoria_id"] = categoria_id
    if departamento_id: query["departamento_id"] = departamento_id
    if lider_id: query["lider_id"] = lider_id
    if status: query["status"] = status
    if search: query["nome"] = {"$regex": search, "$options": "i"}

    groups = await db.groups.find(query).to_list(100)
    
    for g in groups:
        g["membro_count"] = await db.group_members.count_documents({"group_id": g["id"], "deletado_em": None})
        if g.get("lider_id"):
            lider = await db.members.find_one({"id": g["lider_id"]}, {"_id": 0, "nome": 1})
            g["lider_nome"] = lider["nome"] if lider else "Líder não encontrado"
            
    return success_response(data=groups)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_group(data: GroupCreate, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    
    # Rule: Leader must be active
    lider = await db.members.find_one({"id": data.lider_id, "organizacao_id": org_id, "deletado_em": None})
    if not lider or lider.get("status") != "ativo":
        raise HTTPException(status_code=400, detail="O grupo deve ter um líder ativo")
        
    group = Group(**data.model_dump(), organizacao_id=org_id)
    doc = group.model_dump()
    await db.groups.insert_one(doc)
    return success_response(data=doc)

@router.get("/strategic-panel")
async def get_strategic_panel(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    tq = {"organizacao_id": org_id, "deletado_em": None}
    
    total_groups = await db.groups.count_documents(tq)
    total_participants = await db.group_members.count_documents(tq)
    
    # Growth (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    new_participants = await db.group_members.count_documents({**tq, "data_vinculo": {"$gte": thirty_days_ago}})
    
    # Categories stats
    categories = await db.group_categories.find(tq).to_list(50)
    cat_stats = []
    for cat in categories:
        count = await db.groups.count_documents({**tq, "categoria_id": cat["id"]})
        cat_stats.append({"nome": cat["nome"], "count": count, "cor": cat.get("cor")})
        
    return success_response(data={
        "total_groups": total_groups,
        "total_participants": total_participants,
        "new_participants_30d": new_participants,
        "categories_stats": cat_stats
    })

@router.get("/{group_id}")
async def get_group(group_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    group = await db.groups.find_one({"id": group_id, "organizacao_id": org_id, "deletado_em": None})
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    
    member_links = await db.group_members.find({"group_id": group_id, "deletado_em": None}).to_list(1000)
    members = []
    for link in member_links:
        m = await db.members.find_one({"id": link["member_id"], "deletado_em": None}, {"_id": 0, "nome": 1, "foto_url": 1, "status": 1})
        if m:
            m["data_vinculo"] = link["data_vinculo"]
            members.append(m)
            
    group["membros"] = members
    return success_response(data=group)

@router.put("/{group_id}")
async def update_group(group_id: str, data: GroupUpdate, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    query = {"id": group_id, "organizacao_id": org_id, "deletado_em": None}
    
    if data.lider_id:
        lider = await db.members.find_one({"id": data.lider_id, "organizacao_id": org_id, "deletado_em": None})
        if not lider or lider.get("status") != "ativo":
            raise HTTPException(status_code=400, detail="O líder selecionado deve estar ativo")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    result = await db.groups.update_one(query, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
        
    return success_response(data={"message": "Grupo atualizado com sucesso"})

@router.delete("/{group_id}")
async def delete_group(group_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    query = {"id": group_id, "organizacao_id": org_id, "deletado_em": None}
    
    result = await db.groups.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
        
    return success_response(data={"message": "Grupo removido com sucesso"})
