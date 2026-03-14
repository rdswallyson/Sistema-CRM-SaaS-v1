from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from ..core.security import hash_password, verify_password, create_token, UserRole, create_refresh_token, get_current_user_from_refresh_token, get_current_user
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
    
    # Remove password from response
    user_data = {k: v for k, v in user.items() if k not in ["password", "_id"]}
    
    access_token = create_token(user["id"], user["email"], user["role"], user.get("organizacao_id"))
    refresh_token = create_refresh_token(user["id"], user["email"], user["role"], user.get("organizacao_id"))
    return success_response(data={"token": access_token, "access_token": access_token, "refresh_token": refresh_token, "user": user_data})

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
        organizacao_id=organizacao_id,  # Self-referencing for multi-tenant base model
        nome=data.church_name or f"Igreja de {data.name}",
        slug=data.church_name.lower().replace(' ', '-') if data.church_name else 'igreja-' + data.name.lower().replace(' ', '-'),
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
        "deletado_em": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    user_data = {k: v for k, v in user.items() if k not in ["password", "_id"]}
    
    access_token = create_token(user_id, data.email, UserRole.ADMIN_CHURCH, organizacao_id)
    refresh_token = create_refresh_token(user_id, data.email, UserRole.ADMIN_CHURCH, organizacao_id)
    return success_response(data={"token": access_token, "access_token": access_token, "refresh_token": refresh_token, "user": user_data})

@router.get("/auth/me")
@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info from token."""
    user = await db.users.find_one({"id": current_user["user_id"], "deletado_em": None})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    user_data = {k: v for k, v in user.items() if k not in ["password", "_id"]}
    return success_response(data=user_data)

@router.post("/refresh-token")
async def refresh_access_token(data: TokenRefresh):
    payload = get_current_user_from_refresh_token.__wrapped__ if hasattr(get_current_user_from_refresh_token, '__wrapped__') else None
    try:
        import jwt as pyjwt
        from ..core.config import settings
        decoded = pyjwt.decode(data.refresh_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        new_access_token = create_token(decoded["user_id"], decoded["email"], decoded["role"], decoded.get("organizacao_id"))
        return success_response(data={"access_token": new_access_token, "token": new_access_token})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido")
