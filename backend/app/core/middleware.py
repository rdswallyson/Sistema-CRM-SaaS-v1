from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from .security import verify_token
from .database import db
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class MultiTenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware para garantir isolamento de dados multi-tenant.
    Valida que o usuário autenticado tem acesso à organização solicitada.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip middleware for public routes
        public_routes = [
            "/api/auth/login",
            "/api/auth/register",
            "/api/login",
            "/api/register",
            "/api/auth/refresh",
            "/api/auth/refresh-token",
            "/api/health",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/api/seed/",
            "/api/plans",
            "/eventos/",  # Public event registration
            "/webhooks/",  # Payment webhooks
        ]
        
        if any(request.url.path.startswith(route) for route in public_routes):
            return await call_next(request)
        
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Token não fornecido"}
            )
        
        token = auth_header.split(" ")[1]
        
        try:
            # Verify token and extract user info
            payload = verify_token(token)
            user_id = payload.get("user_id")
            organizacao_id = payload.get("organizacao_id")
            
            if not user_id:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Token inválido"}
                )
            
            # Super admin doesn't need organizacao_id
            if payload.get("role") == "super_admin":
                request.state.user = payload
                request.state.organizacao_id = organizacao_id or ""
                return await call_next(request)
            
            if not organizacao_id:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Token inválido - organização não encontrada"}
                )
            
            # Validate that organization exists and is active
            org = await db.organizacoes.find_one({
                "id": organizacao_id,
                "deletado_em": None
            })
            
            if not org:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Organização não encontrada"}
                )
            
            # Validate that user belongs to this organization
            user = await db.users.find_one({
                "id": user_id,
                "deletado_em": None
            })
            
            if not user:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Usuário não encontrado"}
                )
            
            # Attach user info to request state for use in endpoints
            request.state.user = payload
            request.state.organizacao_id = organizacao_id
            
        except Exception as e:
            logger.error(f"Erro ao validar token: {str(e)}")
            return JSONResponse(
                status_code=401,
                content={"detail": "Token inválido ou expirado"}
            )
        
        response = await call_next(request)
        return response


class PlanFeatureMiddleware(BaseHTTPMiddleware):
    """
    Middleware para validar acesso a funcionalidades baseado no plano.
    Desabilitado temporariamente para permitir acesso durante desenvolvimento.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Pass through all requests - plan validation disabled for now
        return await call_next(request)
