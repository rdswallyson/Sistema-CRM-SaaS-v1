from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from ..core.security import hash_password, verify_password, create_token, UserRole
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

@router.post("/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou senha incorretos")
    
    token = create_token(user["id"], user["email"], user["role"], user.get("tenant_id"))
    return success_response(data={"token": token, "user": user})

@router.post("/register")
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado")
    
    tenant_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    # Create Tenant
    tenant = {
        "id": tenant_id,
        "name": data.church_name or f"Igreja de {data.name}",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenants.insert_one(tenant)
    
    # Create User
    user = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "role": UserRole.ADMIN_CHURCH,
        "tenant_id": tenant_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token(user_id, data.email, UserRole.ADMIN_CHURCH, tenant_id)
    return success_response(data={"token": token, "user": user})
