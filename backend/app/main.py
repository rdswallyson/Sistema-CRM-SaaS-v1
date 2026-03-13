from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import close_db_connection
from .routers import auth, members, departments, groups, teaching, financial, agenda, external_events, media

app = FastAPI(title=settings.PROJECT_NAME)

# Middleware
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
app.include_router(departments.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(teaching.router, prefix="/api")
app.include_router(financial.router, prefix="/api")
app.include_router(agenda.router, prefix="/api")
app.include_router(external_events.router, prefix="/api")
app.include_router(media.router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}

@app.on_event("shutdown")
async def shutdown_event():
    await close_db_connection()
