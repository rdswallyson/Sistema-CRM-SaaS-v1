from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from .security import verify_token
from .database import db
import logging

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
            "/api/auth/refresh",
            "/api/health",
            "/docs",
            "/openapi.json",
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
            
            if not user_id or not organizacao_id:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Token inválido"}
                )
            
            # Validate that organization exists and is active
            org = await db.organizacoes.find_one({
                "id": organizacao_id,
                "status": "ativa",
                "deletado_em": None
            })
            
            if not org:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Organização não encontrada ou inativa"}
                )
            
            # Validate that user belongs to this organization
            user = await db.users.find_one({
                "id": user_id,
                "organizacao_id": organizacao_id,
                "is_active": True,
                "deletado_em": None
            })
            
            if not user:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Usuário não tem acesso a esta organização"}
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
    """
    
    # Mapeamento de rotas para funcionalidades
    FEATURE_ROUTES = {
        "/api/church/financial": "modulo_financeiro",
        "/api/church/patrimony": "modulo_patrimonio",
        "/api/church/teaching": "modulo_ensino",
        "/api/church/groups": "modulo_grupos",
        "/api/church/agenda": "modulo_agenda",
        "/api/church/external-events": "modulo_eventos_externos",
        "/api/church/media": "modulo_midia",
        "/api/support": "modulo_suporte",
    }
    
    async def dispatch(self, request: Request, call_next):
        # Skip middleware for public routes
        if not hasattr(request.state, "user"):
            return await call_next(request)
        
        # Check if current route requires a specific feature
        feature_required = None
        for route_prefix, feature in self.FEATURE_ROUTES.items():
            if request.url.path.startswith(route_prefix):
                feature_required = feature
                break
        
        if not feature_required:
            return await call_next(request)
        
        # Get user's organization and check subscription
        organizacao_id = request.state.organizacao_id
        
        # Get active subscription
        subscription = await db.assinaturas.find_one({
            "organizacao_id": organizacao_id,
            "status": "ativa",
            "data_vencimento": {"$gte": datetime.now(timezone.utc).isoformat()},
            "deletado_em": None
        })
        
        if not subscription:
            return JSONResponse(
                status_code=403,
                content={"detail": "Assinatura expirada ou inativa"}
            )
        
        # Get plan details
        plano = await db.planos.find_one({"id": subscription["plano_id"]})
        
        if not plano or not plano.get(feature_required):
            return JSONResponse(
                status_code=403,
                content={"detail": f"Funcionalidade '{feature_required}' não disponível no seu plano"}
            )
        
        response = await call_next(request)
        return response
