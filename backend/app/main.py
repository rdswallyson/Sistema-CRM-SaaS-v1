from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import close_db_connection, db
from .core.middleware import MultiTenantMiddleware, PlanFeatureMiddleware
from .core.security import require_church_admin
from .core.response import success_response
from .routers import auth, members, departments, groups, teaching, financial, agenda, external_events, media, patrimony, support, saas_routers, master_panel
from .routers.discipleship import router as discipleship_router
from .routers.communication import router as communication_router, birthday_router
from .routers.groups import group_categories_router
from .routers.members import member_categories_router, member_positions_router, menu_customization_router
from .routers.financial import fin_router

app = FastAPI(title=settings.PROJECT_NAME)

# Middleware
app.add_middleware(PlanFeatureMiddleware)
app.add_middleware(MultiTenantMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(members.router, prefix="/api")
app.include_router(member_categories_router, prefix="/api")
app.include_router(member_positions_router, prefix="/api")
app.include_router(menu_customization_router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(group_categories_router, prefix="/api")
app.include_router(teaching.router, prefix="/api")
app.include_router(financial.router, prefix="/api")
app.include_router(fin_router, prefix="/api")
app.include_router(agenda.router, prefix="/api")
app.include_router(external_events.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(patrimony.router, prefix="/api")
app.include_router(support.router, prefix="/api")
app.include_router(discipleship_router, prefix="/api")
app.include_router(communication_router, prefix="/api")
app.include_router(birthday_router, prefix="/api")
app.include_router(saas_routers.router, prefix="/api")
app.include_router(master_panel.router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}

# Dashboard geral da igreja
@app.get("/api/church/dashboard")
async def church_dashboard(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    tq = {"organizacao_id": org_id, "deletado_em": None}
    
    total_membros = await db.members.count_documents({**tq, "status": "ativo"})
    total_grupos = await db.groups.count_documents(tq)
    total_departamentos = await db.departments.count_documents(tq)
    
    # Aniversariantes do mês
    from datetime import datetime
    mes_atual = datetime.now().month
    aniversariantes = await db.members.count_documents({
        **tq,
        "$expr": {"$eq": [{"$month": {"$dateFromString": {"dateString": "$data_nascimento", "onError": None}}}, mes_atual]}
    })
    
    # Novos membros últimos 30 dias
    from datetime import timedelta, timezone
    trinta_dias = datetime.now(timezone.utc) - timedelta(days=30)
    novos_membros = await db.members.count_documents({
        **tq,
        "criado_em": {"$gte": trinta_dias}
    })
    
    # Próximos eventos
    hoje = datetime.now().strftime("%Y-%m-%d")
    proximos_eventos = await db.events.find({
        **tq,
        "data_inicio": {"$gte": hoje}
    }).sort("data_inicio", 1).limit(5).to_list(5)
    
    return success_response(data={
        "total_membros": total_membros,
        "total_grupos": total_grupos,
        "total_departamentos": total_departamentos,
        "aniversariantes_mes": aniversariantes,
        "novos_membros_30d": novos_membros,
        "proximos_eventos": proximos_eventos
    })

@app.on_event("shutdown")
async def shutdown_event():
    await close_db_connection()
