from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin, UserRole, get_current_user
from ..core.database import db
from ..core.response import success_response, error_response
from ..models.patrimony import (
    Patrimony, PatrimonyCategory, PatrimonyLocation, PatrimonyMovement, PatrimonyMaintenance,
    PatrimonyStatus, MaintenanceType
)
from ..models.financial import Transaction, TransactionType, TransactionStatus
from datetime import datetime, timezone, date
import uuid

router = APIRouter(prefix="/church/patrimony", tags=["Patrimônio"])

# ==================== DASHBOARD (deve vir antes de /{item_id}) ====================
@router.get("/dashboard/stats")
async def patrimony_dashboard(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    
    # Total items and value
    pipeline_total = [
        {"$match": {"organizacao_id": org_id, "deletado_em": None}},
        {"$group": {
            "_id": None,
            "total_items": {"$sum": 1},
            "total_value": {"$sum": "$valor_aquisicao"}
        }}
    ]
    total_stats = await db.patrimony.aggregate(pipeline_total).to_list(1)
    total_stats = total_stats[0] if total_stats else {"total_items": 0, "total_value": 0}
    
    # By category
    pipeline_cat = [
        {"$match": {"organizacao_id": org_id, "deletado_em": None}},
        {"$group": {"_id": "$categoria_id", "count": {"$sum": 1}}}
    ]
    cat_stats = await db.patrimony.aggregate(pipeline_cat).to_list(100)
    
    # By status
    pipeline_status = [
        {"$match": {"organizacao_id": org_id, "deletado_em": None}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_stats = await db.patrimony.aggregate(pipeline_status).to_list(100)
    
    # Maintenance costs history
    pipeline_maint = [
        {"$match": {"organizacao_id": org_id}},
        {"$group": {"_id": None, "total_maint_cost": {"$sum": "$custo"}}}
    ]
    maint_stats = await db.patrimony_maintenances.aggregate(pipeline_maint).to_list(1)
    maint_cost = maint_stats[0]["total_maint_cost"] if maint_stats else 0

    return success_response(data={
        "summary": total_stats,
        "by_category": cat_stats,
        "by_status": status_stats,
        "total_maintenance_cost": maint_cost
    })

# ==================== CATEGORIES ====================
@router.get("/categories")
async def list_categories(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    categories = await db.patrimony_categories.find({"organizacao_id": org_id, "deletado_em": None}).to_list(100)
    return success_response(data=categories)

@router.post("/categories")
async def create_category(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    category = PatrimonyCategory(**data, organizacao_id=org_id)
    doc = category.model_dump()
    await db.patrimony_categories.insert_one(doc)
    return success_response(data=doc)

# ==================== LOCATIONS ====================
@router.get("/locations")
async def list_locations(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    locations = await db.patrimony_locations.find({"organizacao_id": org_id, "deletado_em": None}).to_list(100)
    return success_response(data=locations)

@router.post("/locations")
async def create_location(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    location = PatrimonyLocation(**data, organizacao_id=org_id)
    doc = location.model_dump()
    await db.patrimony_locations.insert_one(doc)
    return success_response(data=doc)

# ==================== PATRIMONY ====================
@router.get("", include_in_schema=False)
@router.get("/")
async def list_patrimony(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    categoria_id: Optional[str] = None,
    local_id: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    
    if search:
        query["$or"] = [
            {"nome": {"$regex": search, "$options": "i"}},
            {"codigo_interno": {"$regex": search, "$options": "i"}}
        ]
    if status:
        query["status"] = status
    if categoria_id:
        query["categoria_id"] = categoria_id
    if local_id:
        query["local_id"] = local_id

    skip = (page - 1) * limit
    total = await db.patrimony.count_documents(query)
    items = await db.patrimony.find(query).skip(skip).limit(limit).to_list(limit)
    
    meta = {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit
    }
    
    return success_response(data=items, meta=meta)

@router.post("", status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_patrimony(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    
    # Auto-generate internal code if not provided
    if not data.get("codigo_interno"):
        count = await db.patrimony.count_documents({"organizacao_id": org_id})
        data["codigo_interno"] = f"PAT-{org_id[:4].upper()}-{count + 1:05d}"
    else:
        # Check uniqueness
        existing = await db.patrimony.find_one({"organizacao_id": org_id, "codigo_interno": data["codigo_interno"], "deletado_em": None})
        if existing:
            raise HTTPException(status_code=400, detail="Código interno já cadastrado")

    item = Patrimony(**data, organizacao_id=org_id)
    doc = item.model_dump()
    if isinstance(doc.get("data_aquisicao"), (date, datetime)):
        doc["data_aquisicao"] = doc["data_aquisicao"].isoformat()

    await db.patrimony.insert_one(doc)
    return success_response(data=doc)

@router.get("/{item_id}")
async def get_patrimony(item_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    item = await db.patrimony.find_one({"id": item_id, "organizacao_id": org_id, "deletado_em": None})
    if not item:
        raise HTTPException(status_code=404, detail="Patrimônio não encontrado")
    return success_response(data=item)

@router.put("/{item_id}")
async def update_patrimony(item_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": item_id, "organizacao_id": org_id, "deletado_em": None}
    
    existing = await db.patrimony.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Patrimônio não encontrado")
    
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    await db.patrimony.update_one(query, {"$set": update_data})
    updated = await db.patrimony.find_one(query)
    return success_response(data=updated)

# ==================== MOVEMENTS ====================
@router.post("/{item_id}/move")
async def move_patrimony(item_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    user_id = current_user.get("user_id")
    
    item = await db.patrimony.find_one({"id": item_id, "organizacao_id": org_id, "deletado_em": None})
    if not item:
        raise HTTPException(status_code=404, detail="Patrimônio não encontrado")
    
    movement = PatrimonyMovement(
        patrimonio_id=item_id,
        local_origem_id=item.get("local_id"),
        local_destino_id=data["local_destino_id"],
        departamento_origem_id=item.get("departamento_id"),
        departamento_destino_id=data.get("departamento_destino_id"),
        motivo=data.get("motivo"),
        usuario_id=user_id,
        organizacao_id=org_id
    )
    
    doc = movement.model_dump()
    await db.patrimony_movements.insert_one(doc)
    
    # Update patrimony location
    await db.patrimony.update_one(
        {"id": item_id},
        {"$set": {
            "local_id": data["local_destino_id"],
            "departamento_id": data.get("departamento_destino_id"),
            "atualizado_em": datetime.now(timezone.utc)
        }}
    )
    
    return success_response(data=doc)

@router.get("/{item_id}/movements")
async def list_movements(item_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    movements = await db.patrimony_movements.find({"patrimonio_id": item_id, "organizacao_id": org_id}).sort("data_movimentacao", -1).to_list(100)
    return success_response(data=movements)

# ==================== MAINTENANCE ====================
@router.post("/{item_id}/maintenance")
async def register_maintenance(item_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    user_id = current_user.get("user_id")
    
    item = await db.patrimony.find_one({"id": item_id, "organizacao_id": org_id, "deletado_em": None})
    if not item:
        raise HTTPException(status_code=404, detail="Patrimônio não encontrado")
    
    maintenance_cost = data.get("custo")
    transacao_id = None
    
    # If there is a cost, create a financial transaction
    if maintenance_cost and maintenance_cost > 0:
        account = await db.accounts.find_one({"organizacao_id": org_id, "status": "active"})
        if not account:
            account_id = "default_account"
        else:
            account_id = account["id"]
            
        transaction = Transaction(
            tipo=TransactionType.DESPESA,
            valor=maintenance_cost,
            data=date.today().isoformat(),
            conta_id=account_id,
            categoria_id=data.get("categoria_financeira_id", "patrimony_maintenance"),
            centro_custo_id=item.get("departamento_id"),
            contato_id=item.get("fornecedor_id"),
            descricao=f"Manutenção de patrimônio: {item['nome']} ({item['codigo_interno']})",
            status=TransactionStatus.CONFIRMADO,
            organizacao_id=org_id,
            criado_por=user_id
        )
        trans_doc = transaction.model_dump()
        await db.transactions.insert_one(trans_doc)
        transacao_id = trans_doc["id"]
        
        # Update account balance if account exists
        if account:
            await db.accounts.update_one({"id": account_id}, {"$inc": {"saldo_atual": -maintenance_cost}})

    maintenance = PatrimonyMaintenance(
        patrimonio_id=item_id,
        tipo=data["tipo"],
        custo=maintenance_cost,
        data=data.get("data", date.today().isoformat()),
        descricao=data.get("descricao"),
        transacao_financeira_id=transacao_id,
        organizacao_id=org_id
    )
    
    doc = maintenance.model_dump()
    if isinstance(doc.get("data"), (date, datetime)):
        doc["data"] = doc["data"].isoformat()
        
    await db.patrimony_maintenances.insert_one(doc)
    
    # Update patrimony status to 'em_manutencao'
    await db.patrimony.update_one({"id": item_id}, {"$set": {"status": PatrimonyStatus.EM_MANUTENCAO}})
    
    return success_response(data=doc)
