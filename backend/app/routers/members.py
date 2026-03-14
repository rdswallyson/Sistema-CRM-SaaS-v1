from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin, UserRole
from ..core.database import db
from ..core.response import success_response, error_response
from ..models.members import (
    Member, MemberCreate, MemberUpdate, MemberStatus, CustomField, CustomFieldType,
    PositionHistory, DigitalCard, MenuPersonalization, MemberCategory, MemberPosition
)
from ..utils.qrcode_generator import generate_digital_card_qr
from datetime import datetime, timezone
import uuid
import re

router = APIRouter(prefix="/church/members", tags=["Membros"])

def validate_cpf(cpf: str) -> bool:
    cpf = re.sub(r'[^0-9]', '', cpf)
    if len(cpf) != 11:
        return False
    if cpf == cpf[0] * 11:
        return False
    return True

@router.get("", include_in_schema=False)
@router.get("/")
async def list_members(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    cargo_id: Optional[str] = None,
    categoria_id: Optional[str] = None,
    departamento_id: Optional[str] = None,
    filial_id: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    
    if search:
        query["$or"] = [
            {"nome": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"telefone": {"$regex": search, "$options": "i"}},
            {"cpf": {"$regex": search, "$options": "i"}}
        ]
    if status:
        query["status"] = status
    if cargo_id:
        query["cargo_id"] = cargo_id
    if categoria_id:
        query["categoria_id"] = categoria_id
    if departamento_id:
        query["departamento_id"] = departamento_id
    if filial_id:
        query["filial_id"] = filial_id

    skip = (page - 1) * limit
    total = await db.members.count_documents(query)
    members = await db.members.find(query).skip(skip).limit(limit).to_list(limit)
    
    meta = {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit
    }
    
    return success_response(data=members, meta=meta)

@router.post("", status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_member(data: MemberCreate, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    
    if data.cpf:
        if not validate_cpf(data.cpf):
            raise HTTPException(status_code=400, detail="CPF inválido")
        existing = await db.members.find_one({"organizacao_id": org_id, "cpf": data.cpf, "deletado_em": None})
        if existing:
            raise HTTPException(status_code=400, detail="CPF já cadastrado nesta organização")
            
    if data.email:
        existing = await db.members.find_one({"organizacao_id": org_id, "email": data.email, "deletado_em": None})
        if existing:
            raise HTTPException(status_code=400, detail="E-mail já cadastrado nesta organização")

    member = Member(**data.model_dump(), organizacao_id=org_id)
    doc = member.model_dump()
    
    await db.members.insert_one(doc)
    return success_response(data=doc)

@router.get("/{member_id}")
async def get_member(member_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    member = await db.members.find_one({"id": member_id, "organizacao_id": org_id, "deletado_em": None})
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    return success_response(data=member)

@router.put("/{member_id}")
async def update_member(member_id: str, data: MemberUpdate, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": member_id, "organizacao_id": org_id, "deletado_em": None}
    
    existing = await db.members.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    await db.members.update_one(query, {"$set": update_data})
    updated_member = await db.members.find_one(query)
    return success_response(data=updated_member)

@router.delete("/{member_id}")
async def delete_member(member_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": member_id, "organizacao_id": org_id, "deletado_em": None}
    
    result = await db.members.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    return success_response(data={"message": "Membro removido com sucesso"})

# ==================== CUSTOM FIELDS ====================
@router.post("/custom-fields")
async def create_custom_field(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    field = CustomField(**data, organizacao_id=org_id)
    doc = field.model_dump()
    await db.custom_fields.insert_one(doc)
    return success_response(data=doc)

@router.get("/custom-fields")
async def list_custom_fields(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    fields = await db.custom_fields.find({"organizacao_id": org_id, "deletado_em": None}).sort("ordem", 1).to_list(100)
    return success_response(data=fields)

# ==================== DIGITAL CARD ====================
@router.post("/{member_id}/digital-card")
async def generate_digital_card(member_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    
    member = await db.members.find_one({"id": member_id, "organizacao_id": org_id, "deletado_em": None})
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    # Check if card already exists
    existing_card = await db.digital_cards.find_one({"membro_id": member_id, "organizacao_id": org_id, "deletado_em": None})
    if existing_card:
        return success_response(data=existing_card)
    
    # Generate QR code
    qr_hash, qr_image = generate_digital_card_qr(member_id, org_id, "secret-key-for-qr")
    
    card = DigitalCard(
        membro_id=member_id,
        qr_code_hash=qr_hash,
        qr_code_url=qr_image,
        organizacao_id=org_id
    )
    doc = card.model_dump()
    await db.digital_cards.insert_one(doc)
    
    return success_response(data=doc)

@router.get("/{member_id}/digital-card")
async def get_digital_card(member_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    card = await db.digital_cards.find_one({"membro_id": member_id, "organizacao_id": org_id, "deletado_em": None})
    if not card:
        raise HTTPException(status_code=404, detail="Cartão digital não encontrado")
    return success_response(data=card)

# ==================== POSITION HISTORY ====================
@router.post("/{member_id}/position-history")
async def add_position_history(member_id: str, cargo_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    
    member = await db.members.find_one({"id": member_id, "organizacao_id": org_id, "deletado_em": None})
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    # Deactivate previous active position
    await db.position_history.update_many(
        {"membro_id": member_id, "organizacao_id": org_id, "ativo": True, "deletado_em": None},
        {"$set": {"ativo": False, "data_fim": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Add new position
    history = PositionHistory(
        membro_id=member_id,
        cargo_id=cargo_id,
        data_inicio=datetime.now(timezone.utc).isoformat(),
        organizacao_id=org_id
    )
    doc = history.model_dump()
    await db.position_history.insert_one(doc)
    
    # Update member's current position
    await db.members.update_one(
        {"id": member_id},
        {"$set": {"cargo_id": cargo_id, "atualizado_em": datetime.now(timezone.utc)}}
    )
    
    return success_response(data=doc)

@router.get("/{member_id}/position-history")
async def get_position_history(member_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    history = await db.position_history.find({"membro_id": member_id, "organizacao_id": org_id, "deletado_em": None}).sort("data_inicio", -1).to_list(100)
    return success_response(data=history)

# ==================== BIRTHDAYS ====================
@router.get("/birthdays")
async def list_birthdays(
    mes: Optional[int] = None,
    departamento_id: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    query = {"organizacao_id": org_id, "deletado_em": None, "data_nascimento": {"$ne": None}}
    
    if departamento_id:
        query["departamento_id"] = departamento_id
    
    members = await db.members.find(query).to_list(1000)
    
    birthdays = []
    for m in members:
        if m.get("data_nascimento"):
            try:
                birth_date = datetime.strptime(m["data_nascimento"], "%Y-%m-%d")
                if mes is None or birth_date.month == mes:
                    birthdays.append({
                        "id": m["id"],
                        "nome": m["nome"],
                        "data_nascimento": m["data_nascimento"],
                        "dia": birth_date.day,
                        "mes": birth_date.month,
                        "foto_url": m.get("foto_url"),
                        "cargo_id": m.get("cargo_id")
                    })
            except:
                pass
    
    birthdays.sort(key=lambda x: x["dia"])
    return success_response(data=birthdays)

# ==================== MENU PERSONALIZATION ====================
@router.post("/menu-personalization")
async def personalize_menu(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    user_id = current_user.get("user_id")
    
    menu = MenuPersonalization(**data, organizacao_id=org_id, atualizado_por=user_id)
    doc = menu.model_dump()
    
    # Upsert: update if exists, insert if not
    await db.menu_personalizations.update_one(
        {"organizacao_id": org_id, "modulo": data["modulo"], "chave_menu": data["chave_menu"]},
        {"$set": doc},
        upsert=True
    )
    
    return success_response(data=doc)

@router.get("/menu-personalizations")
async def get_menu_personalizations(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    personalizations = await db.menu_personalizations.find({"organizacao_id": org_id, "deletado_em": None}).to_list(100)
    return success_response(data=personalizations)

# ==================== MEMBER CATEGORIES ====================
# Router separado para /church/member-categories
member_categories_router = APIRouter(prefix="/church/member-categories", tags=["Categorias de Membros"])

@member_categories_router.get("")
@member_categories_router.get("/")
async def list_member_categories(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    categories = await db.member_categories.find({"organizacao_id": org_id, "deletado_em": None}).sort("nome", 1).to_list(100)
    return success_response(data=categories)

@member_categories_router.post("")
@member_categories_router.post("/")
async def create_member_category(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    category = MemberCategory(
        nome=data["nome"],
        descricao=data.get("descricao"),
        cor=data.get("cor", "#6b7280"),
        organizacao_id=org_id
    )
    doc = category.model_dump()
    await db.member_categories.insert_one(doc)
    return success_response(data=doc)

@member_categories_router.put("/{category_id}")
async def update_member_category(category_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": category_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.member_categories.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.member_categories.update_one(query, {"$set": update_data})
    updated = await db.member_categories.find_one(query)
    return success_response(data=updated)

@member_categories_router.delete("/{category_id}")
async def delete_member_category(category_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": category_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.member_categories.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return success_response(data={"message": "Categoria removida com sucesso"})

# ==================== MEMBER POSITIONS ====================
# Router separado para /church/member-positions
member_positions_router = APIRouter(prefix="/church/member-positions", tags=["Cargos de Membros"])

@member_positions_router.get("")
@member_positions_router.get("/")
async def list_member_positions(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    positions = await db.member_positions.find({"organizacao_id": org_id, "deletado_em": None}).sort("nome", 1).to_list(100)
    return success_response(data=positions)

@member_positions_router.post("")
@member_positions_router.post("/")
async def create_member_position(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    position = MemberPosition(
        nome=data["nome"],
        descricao=data.get("descricao"),
        nivel_hierarquico=data.get("nivel_hierarquico", data.get("nivel", 0)),
        organizacao_id=org_id
    )
    doc = position.model_dump()
    await db.member_positions.insert_one(doc)
    return success_response(data=doc)

@member_positions_router.put("/{position_id}")
async def update_member_position(position_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": position_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.member_positions.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Cargo não encontrado")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.member_positions.update_one(query, {"$set": update_data})
    updated = await db.member_positions.find_one(query)
    return success_response(data=updated)

@member_positions_router.delete("/{position_id}")
async def delete_member_position(position_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": position_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.member_positions.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cargo não encontrado")
    return success_response(data={"message": "Cargo removido com sucesso"})

# ==================== MENU CUSTOMIZATION ====================
# Router separado para /church/menu-customization
menu_customization_router = APIRouter(prefix="/church/menu-customization", tags=["Personalização do Menu"])

@menu_customization_router.get("")
@menu_customization_router.get("/")
async def get_menu_customization(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    customizations = await db.menu_personalizations.find({"organizacao_id": org_id, "deletado_em": None}).to_list(100)
    # Return as a dict keyed by chave_menu for easy frontend access
    result = {item["chave_menu"]: item.get("label_customizado", item.get("label_padrao", "")) for item in customizations}
    return success_response(data=result)

@menu_customization_router.put("")
@menu_customization_router.put("/")
async def update_menu_customization(items: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    user_id = current_user.get("user_id")
    
    for chave, label in items.items():
        await db.menu_personalizations.update_one(
            {"organizacao_id": org_id, "chave_menu": chave},
            {"$set": {
                "chave_menu": chave,
                "label_customizado": label,
                "organizacao_id": org_id,
                "atualizado_por": user_id,
                "atualizado_em": datetime.now(timezone.utc)
            }},
            upsert=True
        )
    
    return success_response(data={"message": "Menu atualizado com sucesso"})
