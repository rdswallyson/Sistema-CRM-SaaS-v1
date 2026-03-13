from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from ..core.security import hash_password, verify_password, create_token, UserRole, create_refresh_token, get_current_user_from_refresh_token
from ..models.saas_models import Organizacao, OrganizacaoStatus, Plano, Assinatura, AssinaturaStatus
from ..core.database import db
from ..core.response import success_response, error_response
import uuid
from datetime import datetime, timezone

router = APIRouter(tags=["Auth"])

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    church_name: Optional[str] = None

class TokenRefresh(BaseModel):
    refresh_token: str

@router.post("/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email, "deletado_em": None})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou senha incorretos")
    
    access_token = create_token(user["id"], user["email"], user["role"], user.get("organizacao_id"))
    refresh_token = create_refresh_token(user["id"], user["email"], user["role"], user.get("organizacao_id"))
    return success_response(data={"access_token": access_token, "refresh_token": refresh_token, "user": user})

@router.post("/register")
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email, "deletado_em": None})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado")
    
    organizacao_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    # Create Organizacao
    organizacao = Organizacao(
        id=organizacao_id,
        nome=data.church_name or f"Igreja de {data.name}",
        slug=data.church_name.lower().replace(" ", "-") if data.church_name else f"igreja-{data.name.lower().replace(" ", "-")}",
        status=OrganizacaoStatus.ATIVA
    )
    await db.organizacoes.insert_one(organizacao.model_dump())
    
    # Create User
    user = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "role": UserRole.ADMIN_CHURCH,
        "organizacao_id": organizacao_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    access_token = create_token(user_id, data.email, UserRole.ADMIN_CHURCH, organizacao_id)
    refresh_token = create_refresh_token(user_id, data.email, UserRole.ADMIN_CHURCH, organizacao_id)
    return success_response(data={"access_token": access_token, "refresh_token": refresh_token, "user": user})

@router.post("/refresh-token")
async def refresh_access_token(data: TokenRefresh):
    payload = await get_current_user_from_refresh_token(HTTPAuthorizationCredentials(scheme="Bearer", credentials=data.refresh_token))
    new_access_token = create_token(payload["user_id"], payload["email"], payload["role"], payload.get("organizacao_id"))
    return success_response(data={"access_token": new_access_token})
