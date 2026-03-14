from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin
from ..core.database import db
from ..core.response import success_response, error_response
from ..models.groups import Group, GroupCreate, GroupUpdate, GroupStatus, GroupMemberLink, GroupCategory
from datetime import datetime, timezone, timedelta
import uuid

router = APIRouter(prefix="/church/groups", tags=["Grupos"])

# ==================== ROTAS ESPECÍFICAS (antes das rotas com parâmetros) ====================

@router.get("", include_in_schema=False)
@router.get("/")
async def list_groups(
    categoria_id: Optional[str] = None,
    departamento_id: Optional[str] = None,
    lider_id: Optional[str] = None,
    status: Optional[GroupStatus] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
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

@router.post("", status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_group(data: GroupCreate, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    
    lider = await db.members.find_one({"id": data.lider_id, "organizacao_id": org_id, "deletado_em": None})
    if not lider or lider.get("status") != "ativo":
        raise HTTPException(status_code=400, detail="O grupo deve ter um líder ativo")
        
    group = Group(**data.model_dump(), organizacao_id=org_id)
    doc = group.model_dump()
    await db.groups.insert_one(doc)
    return success_response(data=doc)

@router.get("/strategic-panel")
async def get_strategic_panel(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    tq = {"organizacao_id": org_id, "deletado_em": None}
    
    total_groups = await db.groups.count_documents(tq)
    total_participants = await db.group_members.count_documents(tq)
    
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    new_participants = await db.group_members.count_documents({**tq, "data_vinculo": {"$gte": thirty_days_ago}})
    
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

@router.get("/strategic-dashboard")
async def get_strategic_dashboard(current_user: dict = Depends(require_church_admin)):
    """Alias para /strategic-panel para compatibilidade com o frontend"""
    org_id = current_user.get("organizacao_id")
    tq = {"organizacao_id": org_id, "deletado_em": None}
    
    total_groups = await db.groups.count_documents(tq)
    total_participants = await db.group_members.count_documents(tq)
    
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    new_participants = await db.group_members.count_documents({**tq, "data_vinculo": {"$gte": thirty_days_ago}})
    
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

@router.get("/categories")
@router.get("/categories/")
async def list_group_categories_sub(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    categories = await db.group_categories.find({"organizacao_id": org_id, "deletado_em": None}).sort("nome", 1).to_list(100)
    return success_response(data=categories)

@router.post("/categories", status_code=status.HTTP_201_CREATED)
@router.post("/categories/", status_code=status.HTTP_201_CREATED)
async def create_group_category_sub(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    cat = GroupCategory(
        nome=data["nome"],
        descricao=data.get("descricao"),
        cor=data.get("cor", "#6b7280"),
        organizacao_id=org_id
    )
    doc = cat.model_dump()
    await db.group_categories.insert_one(doc)
    return success_response(data=doc)

@router.put("/categories/{cat_id}")
async def update_group_category_sub(cat_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": cat_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.group_categories.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.group_categories.update_one(query, {"$set": update_data})
    updated = await db.group_categories.find_one(query)
    return success_response(data=updated)

@router.delete("/categories/{cat_id}")
async def delete_group_category_sub(cat_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": cat_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.group_categories.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return success_response(data={"message": "Categoria removida com sucesso"})

# ==================== ROTAS COM PARÂMETROS DINÂMICOS ====================

@router.get("/{group_id}")
async def get_group(group_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    group = await db.groups.find_one({"id": group_id, "organizacao_id": org_id, "deletado_em": None})
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    
    member_links = await db.group_members.find({"group_id": group_id, "deletado_em": None}).to_list(1000)
    members = []
    for link in member_links:
        m = await db.members.find_one({"id": link["member_id"], "deletado_em": None}, {"_id": 0, "nome": 1, "foto_url": 1, "status": 1})
        if m:
            m["data_vinculo"] = link.get("data_vinculo")
            members.append(m)
            
    group["membros"] = members
    return success_response(data=group)

@router.put("/{group_id}")
async def update_group(group_id: str, data: GroupUpdate, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
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
    org_id = current_user.get("organizacao_id")
    query = {"id": group_id, "organizacao_id": org_id, "deletado_em": None}
    
    result = await db.groups.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
        
    return success_response(data={"message": "Grupo removido com sucesso"})

@router.get("/{group_id}/members")
async def list_group_members(group_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    group = await db.groups.find_one({"id": group_id, "organizacao_id": org_id, "deletado_em": None})
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    
    member_links = await db.group_members.find({"group_id": group_id, "deletado_em": None}).to_list(1000)
    members = []
    for link in member_links:
        m = await db.members.find_one({"id": link["member_id"], "deletado_em": None}, {"_id": 0, "id": 1, "nome": 1, "foto_url": 1, "status": 1})
        if m:
            m["data_vinculo"] = link.get("data_vinculo")
            members.append(m)
    return success_response(data=members)

@router.post("/{group_id}/members", status_code=status.HTTP_201_CREATED)
async def add_group_member(group_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    group = await db.groups.find_one({"id": group_id, "organizacao_id": org_id, "deletado_em": None})
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    
    member_id = data.get("member_id") or data.get("membro_id")
    if not member_id:
        raise HTTPException(status_code=400, detail="member_id é obrigatório")
    
    existing = await db.group_members.find_one({"group_id": group_id, "member_id": member_id, "deletado_em": None})
    if existing:
        raise HTTPException(status_code=400, detail="Membro já pertence ao grupo")
    
    link = GroupMemberLink(group_id=group_id, member_id=member_id, organizacao_id=org_id)
    await db.group_members.insert_one(link.model_dump())
    return success_response(data={"message": "Membro adicionado ao grupo"})

@router.delete("/{group_id}/members/{member_id}")
async def remove_group_member(group_id: str, member_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    result = await db.group_members.update_one(
        {"group_id": group_id, "member_id": member_id, "deletado_em": None},
        {"$set": {"deletado_em": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    return success_response(data={"message": "Membro removido do grupo"})

# ==================== CATEGORIAS DE GRUPOS (router separado para alias) ====================
group_categories_router = APIRouter(prefix="/church/group-categories", tags=["Categorias de Grupos"])

@group_categories_router.get("")
@group_categories_router.get("/")
async def list_group_categories(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    categories = await db.group_categories.find({"organizacao_id": org_id, "deletado_em": None}).sort("nome", 1).to_list(100)
    return success_response(data=categories)

@group_categories_router.post("", status_code=status.HTTP_201_CREATED)
@group_categories_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_group_category(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    cat = GroupCategory(
        nome=data["nome"],
        descricao=data.get("descricao"),
        cor=data.get("cor", "#6b7280"),
        organizacao_id=org_id
    )
    doc = cat.model_dump()
    await db.group_categories.insert_one(doc)
    return success_response(data=doc)

@group_categories_router.put("/{cat_id}")
async def update_group_category(cat_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": cat_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.group_categories.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.group_categories.update_one(query, {"$set": update_data})
    updated = await db.group_categories.find_one(query)
    return success_response(data=updated)

@group_categories_router.delete("/{cat_id}")
async def delete_group_category(cat_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": cat_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.group_categories.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return success_response(data={"message": "Categoria removida com sucesso"})
