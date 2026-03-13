from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin
from ..core.database import db
from ..core.response import success_response, error_response
from ..models.departments import Department, DepartmentCreate, DepartmentUpdate, DepartmentStatus, DepartmentMemberLink
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/church/departments", tags=["Departamentos"])

@router.get("/")
async def list_departments(
    status: Optional[DepartmentStatus] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("tenant_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    
    if status:
        query["status"] = status
    if search:
        query["nome"] = {"$regex": search, "$options": "i"}

    departments = await db.departments.find(query).to_list(100)
    
    # Enrich with member count and responsible info
    for dept in departments:
        dept["membro_count"] = await db.department_members.count_documents({
            "department_id": dept["id"], 
            "deletado_em": None
        })
        if dept.get("responsavel_id"):
            resp = await db.members.find_one({"id": dept["responsavel_id"]}, {"_id": 0, "nome": 1, "foto_url": 1})
            dept["responsavel_nome"] = resp["nome"] if resp else None
            dept["responsavel_foto"] = resp["foto_url"] if resp else None
            
        # Get top 3 member avatars for cards
        members_links = await db.department_members.find({"department_id": dept["id"], "deletado_em": None}).limit(3).to_list(3)
        avatars = []
        for link in members_links:
            m = await db.members.find_one({"id": link["member_id"]}, {"_id": 0, "foto_url": 1})
            if m and m.get("foto_url"):
                avatars.append(m["foto_url"])
        dept["top_member_avatars"] = avatars

    return success_response(data=departments)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_department(data: DepartmentCreate, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    dept = Department(**data.model_dump(), organizacao_id=org_id)
    doc = dept.model_dump()
    await db.departments.insert_one(doc)
    return success_response(data=doc)

@router.get("/{dept_id}")
async def get_department(dept_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    dept = await db.departments.find_one({"id": dept_id, "organizacao_id": org_id, "deletado_em": None})
    if not dept:
        raise HTTPException(status_code=404, detail="Departamento não encontrado")
    
    # Get members list for the department
    member_links = await db.department_members.find({"department_id": dept_id, "deletado_em": None}).to_list(1000)
    members = []
    for link in member_links:
        m = await db.members.find_one({"id": link["member_id"], "deletado_em": None}, {"_id": 0})
        if m:
            m["data_vinculo"] = link["data_vinculo"]
            members.append(m)
    
    dept["membros"] = members
    dept["membro_count"] = len(members)
    return success_response(data=dept)

@router.put("/{dept_id}")
async def update_department(dept_id: str, data: DepartmentUpdate, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    query = {"id": dept_id, "organizacao_id": org_id, "deletado_em": None}
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    result = await db.departments.update_one(query, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Departamento não encontrado")
    
    updated = await db.departments.find_one(query)
    return success_response(data=updated)

@router.delete("/{dept_id}")
async def delete_department(dept_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    query = {"id": dept_id, "organizacao_id": org_id, "deletado_em": None}
    
    # Soft delete department
    result = await db.departments.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Departamento não encontrado")
    
    # Soft delete member links
    await db.department_members.update_many(
        {"department_id": dept_id, "organizacao_id": org_id}, 
        {"$set": {"deletado_em": datetime.now(timezone.utc)}}
    )
    
    return success_response(data={"message": "Departamento removido com sucesso"})

@router.post("/{dept_id}/members/{member_id}")
async def add_member_to_department(dept_id: str, member_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    
    # Check if both exist
    dept = await db.departments.find_one({"id": dept_id, "organizacao_id": org_id, "deletado_em": None})
    member = await db.members.find_one({"id": member_id, "organizacao_id": org_id, "deletado_em": None})
    
    if not dept or not member:
        raise HTTPException(status_code=404, detail="Departamento ou Membro não encontrado")
    
    # Check if already linked
    existing = await db.department_members.find_one({"department_id": dept_id, "member_id": member_id, "deletado_em": None})
    if existing:
        return success_response(data={"message": "Membro já está vinculado a este departamento"})
    
    link = DepartmentMemberLink(department_id=dept_id, member_id=member_id, organizacao_id=org_id)
    await db.department_members.insert_one(link.model_dump())
    
    return success_response(data={"message": "Membro adicionado ao departamento"})

@router.delete("/{dept_id}/members/{member_id}")
async def remove_member_from_department(dept_id: str, member_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    
    result = await db.department_members.update_one(
        {"department_id": dept_id, "member_id": member_id, "organizacao_id": org_id, "deletado_em": None},
        {"$set": {"deletado_em": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
        
    return success_response(data={"message": "Membro removido do departamento"})
