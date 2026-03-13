import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings
from enum import Enum

security = HTTPBearer()

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    MASTER_ADMIN = "master_admin"
    MASTER_SUPPORT = "master_support"
    ADMIN_CHURCH = "admin_church"
    TREASURER = "treasurer"
    MINISTRY_LEADER = "ministry_leader"
    SECRETARY = "secretary"
    MEMBER = "member"
    VISITOR = "visitor"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def create_token(user_id: str, email: str, role: str, organizacao_id: Optional[str] = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "organizacao_id": organizacao_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(user_id: str, email: str, role: str, organizacao_id: Optional[str] = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "organizacao_id": organizacao_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify JWT token and return payload without dependency injection."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

async def get_current_user_from_refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh Token inválido")

async def require_super_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado. Requer Super Admin.")
    return current_user

async def require_master_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in [UserRole.SUPER_ADMIN, UserRole.MASTER_ADMIN, UserRole.MASTER_SUPPORT]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado. Requer usuário Master.")
    return current_user

async def require_church_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in [UserRole.SUPER_ADMIN, UserRole.ADMIN_CHURCH]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado. Requer Admin da Igreja.")
    return current_user
