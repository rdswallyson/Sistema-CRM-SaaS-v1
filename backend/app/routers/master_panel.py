from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_super_admin, require_master_user, UserRole
from ..core.database import db
from ..core.response import success_response, error_response
from datetime import datetime, timezone
from ..models.saas_models import (
    Organizacao, OrganizacaoCreate, OrganizacaoUpdate, OrganizacaoStatus,
    Plano, PlanoCreate, PlanoUpdate,
    Assinatura, AssinaturaCreate, AssinaturaUpdate, AssinaturaStatus,
    UsuarioMaster, UsuarioMasterCreate, UsuarioMasterUpdate
)
import uuid
from passlib.context import CryptContext

router = APIRouter(prefix="/master", tags=["Painel Master"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==================== ORGANIZATIONS ====================
@router.get("/organizacoes")
async def list_organizations(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    status: Optional[OrganizacaoStatus] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_super_admin)
):
    """List all organizations (Super Admin only)."""
    query = {"deletado_em": None}
    
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"nome": {"$regex": search, "$options": "i"}},
            {"slug": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    total = await db.organizacoes.count_documents(query)
    items = await db.organizacoes.find(query).skip(skip).limit(limit).sort("criado_em", -1).to_list(limit)
    
    # Enrich with subscription info
    for org in items:
        subscription = await db.assinaturas.find_one({
            "organizacao_id": org["id"],
            "status": AssinaturaStatus.ATIVA,
            "deletado_em": None
        })
        org["assinatura_ativa"] = subscription is not None
        if subscription:
            plano = await db.planos.find_one({"id": subscription["plano_id"]})
            org["plano_nome"] = plano["nome"] if plano else "Desconhecido"
            org["data_vencimento"] = subscription["data_vencimento"]
    
    meta = {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit
    }
    
    return success_response(data=items, meta=meta)

@router.post("/organizacoes", status_code=status.HTTP_201_CREATED)
async def create_organization(data: OrganizacaoCreate, current_user: dict = Depends(require_super_admin)):
    """Create a new organization."""
    # Check if slug already exists
    existing = await db.organizacoes.find_one({"slug": data.slug, "deletado_em": None})
    if existing:
        raise HTTPException(status_code=400, detail="Slug já existe")
    
    org_id = str(uuid.uuid4())
    org = Organizacao(
        id=org_id,
        organizacao_id=org_id,
        **data.model_dump()
    )
    doc = org.model_dump()
    await db.organizacoes.insert_one(doc)
    
    return success_response(data=doc, status_code=status.HTTP_201_CREATED)

@router.get("/organizacoes/{org_id}")
async def get_organization(org_id: str, current_user: dict = Depends(require_super_admin)):
    """Get organization details."""
    org = await db.organizacoes.find_one({"id": org_id, "deletado_em": None})
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    # Get subscription info
    subscription = await db.assinaturas.find_one({
        "organizacao_id": org_id,
        "status": AssinaturaStatus.ATIVA,
        "deletado_em": None
    })
    org["assinatura_ativa"] = subscription is not None
    
    # Get users count
    users_count = await db.users.count_documents({
        "organizacao_id": org_id,
        "deletado_em": None
    })
    org["usuarios_count"] = users_count
    
    # Get members count
    members_count = await db.members.count_documents({
        "organizacao_id": org_id,
        "deletado_em": None
    })
    org["membros_count"] = members_count
    
    return success_response(data=org)

@router.put("/organizacoes/{org_id}")
async def update_organization(org_id: str, data: OrganizacaoUpdate, current_user: dict = Depends(require_super_admin)):
    """Update organization."""
    org = await db.organizacoes.find_one({"id": org_id, "deletado_em": None})
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    await db.organizacoes.update_one({"id": org_id}, {"$set": update_data})
    updated = await db.organizacoes.find_one({"id": org_id})
    
    return success_response(data=updated)

@router.delete("/organizacoes/{org_id}")
async def delete_organization(org_id: str, current_user: dict = Depends(require_super_admin)):
    """Soft delete organization."""
    org = await db.organizacoes.find_one({"id": org_id, "deletado_em": None})
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    await db.organizacoes.update_one(
        {"id": org_id},
        {"$set": {"deletado_em": datetime.now(timezone.utc)}}
    )
    
    return success_response(data={"message": "Organização removida com sucesso"})

# ==================== PLANS ====================
@router.get("/planos")
async def list_plans(current_user: dict = Depends(require_super_admin)):
    """List all plans."""
    plans = await db.planos.find({"deletado_em": None}).sort("preco_mensal", 1).to_list(100)
    return success_response(data=plans)

@router.post("/planos", status_code=status.HTTP_201_CREATED)
async def create_plan(data: PlanoCreate, current_user: dict = Depends(require_super_admin)):
    """Create a new plan."""
    plan_id = str(uuid.uuid4())
    plan = Plano(
        id=plan_id,
        organizacao_id="master",  # Master plans are system-wide
        **data.model_dump()
    )
    doc = plan.model_dump()
    await db.planos.insert_one(doc)
    
    return success_response(data=doc)

@router.put("/planos/{plan_id}")
async def update_plan(plan_id: str, data: PlanoUpdate, current_user: dict = Depends(require_super_admin)):
    """Update plan."""
    plan = await db.planos.find_one({"id": plan_id, "deletado_em": None})
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    await db.planos.update_one({"id": plan_id}, {"$set": update_data})
    updated = await db.planos.find_one({"id": plan_id})
    
    return success_response(data=updated)

# ==================== SUBSCRIPTIONS ====================
@router.post("/assinaturas", status_code=status.HTTP_201_CREATED)
async def create_subscription(data: AssinaturaCreate, current_user: dict = Depends(require_super_admin)):
    """Create a new subscription for an organization."""
    # Validate organization exists
    org = await db.organizacoes.find_one({"id": data.organizacao_id, "deletado_em": None})
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    # Validate plan exists
    plan = await db.planos.find_one({"id": data.plano_id, "deletado_em": None})
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    # Deactivate previous subscriptions
    await db.assinaturas.update_many(
        {"organizacao_id": data.organizacao_id, "status": AssinaturaStatus.ATIVA},
        {"$set": {"status": AssinaturaStatus.CANCELADA}}
    )
    
    sub_id = str(uuid.uuid4())
    subscription = Assinatura(
        id=sub_id,
        organizacao_id=data.organizacao_id,
        **data.model_dump()
    )
    doc = subscription.model_dump()
    await db.assinaturas.insert_one(doc)
    
    return success_response(data=doc)

@router.get("/assinaturas/{org_id}")
async def get_organization_subscriptions(org_id: str, current_user: dict = Depends(require_super_admin)):
    """Get all subscriptions for an organization."""
    subscriptions = await db.assinaturas.find({
        "organizacao_id": org_id,
        "deletado_em": None
    }).sort("criado_em", -1).to_list(100)
    
    return success_response(data=subscriptions)

# ==================== MASTER USERS ====================
@router.get("/usuarios-master")
async def list_master_users(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    current_user: dict = Depends(require_super_admin)
):
    """List all master users."""
    query = {"deletado_em": None}
    
    skip = (page - 1) * limit
    total = await db.usuarios_master.count_documents(query)
    items = await db.usuarios_master.find(query).skip(skip).limit(limit).sort("criado_em", -1).to_list(limit)
    
    # Remove sensitive data
    for item in items:
        item.pop("senha", None)
    
    meta = {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit
    }
    
    return success_response(data=items, meta=meta)

@router.post("/usuarios-master", status_code=status.HTTP_201_CREATED)
async def create_master_user(data: UsuarioMasterCreate, current_user: dict = Depends(require_super_admin)):
    """Create a new master user."""
    # Check if email already exists
    existing = await db.usuarios_master.find_one({"email": data.email, "deletado_em": None})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user_id = str(uuid.uuid4())
    user = UsuarioMaster(
        id=user_id,
        email=data.email,
        nome=data.nome,
        senha=pwd_context.hash(data.senha),
        role=data.role,
        is_active=True
    )
    doc = user.model_dump()
    await db.usuarios_master.insert_one(doc)
    
    # Remove sensitive data before returning
    doc.pop("senha", None)
    return success_response(data=doc)

@router.put("/usuarios-master/{user_id}")
async def update_master_user(user_id: str, data: UsuarioMasterUpdate, current_user: dict = Depends(require_super_admin)):
    """Update master user."""
    user = await db.usuarios_master.find_one({"id": user_id, "deletado_em": None})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if data.senha:
        update_data["senha"] = pwd_context.hash(data.senha)
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    await db.usuarios_master.update_one({"id": user_id}, {"$set": update_data})
    updated = await db.usuarios_master.find_one({"id": user_id})
    
    # Remove sensitive data before returning
    updated.pop("senha", None)
    return success_response(data=updated)

# ==================== DASHBOARD ====================
@router.get("/dashboard/stats")
async def master_dashboard_stats(current_user: dict = Depends(require_super_admin)):
    """Get master panel dashboard statistics."""
    total_orgs = await db.organizacoes.count_documents({"deletado_em": None})
    active_orgs = await db.organizacoes.count_documents({"status": OrganizacaoStatus.ATIVA, "deletado_em": None})
    
    total_subscriptions = await db.assinaturas.count_documents({"deletado_em": None})
    active_subscriptions = await db.assinaturas.count_documents({
        "status": AssinaturaStatus.ATIVA,
        "deletado_em": None
    })
    
    # Revenue calculation
    pipeline = [
        {"$match": {"status": AssinaturaStatus.ATIVA, "deletado_em": None}},
        {"$lookup": {"from": "planos", "localField": "plano_id", "foreignField": "id", "as": "plano"}},
        {"$unwind": "$plano"},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$plano.preco_mensal"}}}
    ]
    revenue_result = await db.assinaturas.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    return success_response(data={
        "total_organizations": total_orgs,
        "active_organizations": active_orgs,
        "total_subscriptions": total_subscriptions,
        "active_subscriptions": active_subscriptions,
        "estimated_monthly_revenue": total_revenue
    })

@router.get("/logs-acesso")
async def list_access_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    usuario_id: Optional[str] = None,
    current_user: dict = Depends(require_super_admin)
):
    """List master panel access logs."""
    query = {}
    if usuario_id:
        query["usuario_id"] = usuario_id
    
    skip = (page - 1) * limit
    total = await db.logs_acesso_master.count_documents(query)
    items = await db.logs_acesso_master.find(query).skip(skip).limit(limit).sort("criado_em", -1).to_list(limit)
    
    meta = {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit
    }
    
    return success_response(data=items, meta=meta)
