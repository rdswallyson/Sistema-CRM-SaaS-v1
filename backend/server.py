from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

app = FastAPI(title="Firmes - Church Management SaaS")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== ENUMS ====================
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN_CHURCH = "admin_church"
    TREASURER = "treasurer"
    MINISTRY_LEADER = "ministry_leader"
    SECRETARY = "secretary"
    MEMBER = "member"
    VISITOR = "visitor"

class MemberStatus(str, Enum):
    VISITOR = "visitor"
    NEW_CONVERT = "new_convert"
    MEMBER = "member"
    LEADER = "leader"

class PlanType(str, Enum):
    ESSENTIAL = "essential"
    STRATEGIC = "strategic"
    APOSTOLIC = "apostolic"
    ENTERPRISE = "enterprise"

class DonationType(str, Enum):
    TITHE = "tithe"
    OFFERING = "offering"
    SPECIAL = "special"
    RECURRING = "recurring"

class DiscipleshipStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAUSED = "paused"

class TrailDifficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

# ==================== MODELS ====================
class TenantBase(BaseModel):
    name: str
    logo_url: Optional[str] = None
    primary_color: str = "#4ade80"
    secondary_color: str = "#3b82f6"
    custom_domain: Optional[str] = None
    plan_type: PlanType = PlanType.ESSENTIAL
    member_limit: int = 100
    is_active: bool = True

class TenantCreate(TenantBase):
    admin_email: EmailStr
    admin_password: str
    admin_name: str

class Tenant(TenantBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.MEMBER
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str
    tenant_id: Optional[str] = None
    church_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MemberBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    profession: Optional[str] = None
    photo_url: Optional[str] = None
    status: MemberStatus = MemberStatus.VISITOR
    baptism_date: Optional[str] = None
    conversion_date: Optional[str] = None
    family_id: Optional[str] = None
    family_role: Optional[str] = None  # head, spouse, child
    ministry_ids: List[str] = []
    spiritual_gifts: List[str] = []
    notes: Optional[str] = None
    custom_fields: Dict[str, Any] = {}

class MemberCreate(MemberBase):
    pass

class Member(MemberBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MinistryBase(BaseModel):
    name: str
    description: Optional[str] = None
    leader_id: Optional[str] = None
    goals: Optional[str] = None
    meeting_schedule: Optional[str] = None

class MinistryCreate(MinistryBase):
    pass

class Ministry(MinistryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    member_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== DEPARTMENTS (replaces Ministries) ====================
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: str = "building"
    responsavel_id: Optional[str] = None
    status: str = "active"  # active, archived
    goals: Optional[str] = None
    meeting_schedule: Optional[str] = None

class Department(DepartmentBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    member_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DepartmentMemberLink(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    department_id: str
    member_id: str
    tenant_id: str
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== GROUPS ====================
class GroupCategoryBase(BaseModel):
    name: str
    color: str = "#6366f1"
    status: str = "active"

class GroupCategory(GroupCategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    department_id: Optional[str] = None
    leader_id: Optional[str] = None
    status: str = "active"
    start_date: Optional[str] = None

class Group(GroupBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    member_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroupMemberLink(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str
    member_id: str
    tenant_id: str
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== ENSINO (TEACHING) MODELS ====================
class EstudoBase(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    nivel: str = "basico"
    arquivo: Optional[str] = None
    status: str = "active"
    escola_id: Optional[str] = None
    turma_id: Optional[str] = None

class Estudo(EstudoBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    data_criacao: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EscolaBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    responsavel_id: Optional[str] = None
    departamento_id: Optional[str] = None
    status: str = "active"

class Escola(EscolaBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TurmaBase(BaseModel):
    nome: str
    escola_id: Optional[str] = None
    professor_id: Optional[str] = None
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None
    status: str = "active"

class Turma(TurmaBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TurmaMembroLink(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    turma_id: str
    membro_id: str
    tenant_id: str
    data_entrada: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProgressoEnsinoBase(BaseModel):
    membro_id: str
    turma_id: Optional[str] = None
    estudo_id: Optional[str] = None
    status: str = "em_andamento"
    nota: Optional[float] = None
    observacao: Optional[str] = None

class ProgressoEnsino(ProgressoEnsinoBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    data_atualizacao: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== FINANCIAL MODELS ====================
class ContaFinanceiraBase(BaseModel):
    nome: str
    tipo: str = "banco"  # caixa, banco, carteira_digital
    saldo_inicial: float = 0.0
    status: str = "active"

class ContaFinanceira(ContaFinanceiraBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    saldo_atual: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoriaFinanceiraBase(BaseModel):
    nome: str
    tipo: str = "receita"  # receita, despesa
    cor: str = "#6366f1"
    status: str = "active"

class CategoriaFinanceira(CategoriaFinanceiraBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CentroCustoBase(BaseModel):
    nome: str
    tipo: str = "departamento"  # departamento, projeto, evento
    referencia_id: Optional[str] = None
    status: str = "active"

class CentroCusto(CentroCustoBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContatoFinanceiroBase(BaseModel):
    nome: str
    tipo: str = "contribuinte"  # fornecedor, contribuinte, parceiro
    email: Optional[str] = None
    telefone: Optional[str] = None
    documento: Optional[str] = None
    notas: Optional[str] = None
    status: str = "active"

class ContatoFinanceiro(ContatoFinanceiroBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransacaoBase(BaseModel):
    tipo: str = "receita"  # receita, despesa, transferencia
    valor: float
    data: str
    conta_id: Optional[str] = None
    conta_destino_id: Optional[str] = None
    categoria_id: Optional[str] = None
    centro_custo_id: Optional[str] = None
    departamento_id: Optional[str] = None
    grupo_id: Optional[str] = None
    membro_id: Optional[str] = None
    contato_id: Optional[str] = None
    descricao: Optional[str] = None
    anexo: Optional[str] = None
    status: str = "confirmado"  # pendente, confirmado, cancelado

class Transacao(TransacaoBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PeriodoBloqueadoBase(BaseModel):
    ano: int
    mes: int

class PeriodoBloqueado(PeriodoBloqueadoBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    bloqueado_por: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: str
    event_time: Optional[str] = None
    location: Optional[str] = None
    max_capacity: Optional[int] = None
    is_paid: bool = False
    price: float = 0.0
    ministry_id: Optional[str] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    registered_count: int = 0
    checked_in_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DonationBase(BaseModel):
    member_id: Optional[str] = None
    member_name: Optional[str] = None
    amount: float
    donation_type: DonationType = DonationType.OFFERING
    payment_method: str = "cash"
    notes: Optional[str] = None
    is_recurring: bool = False

class DonationCreate(DonationBase):
    pass

class Donation(DonationBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    donation_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== DISCIPLESHIP MODELS ====================
class TrailStepBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0
    content_type: str = "text"  # text, video, quiz, task
    content: Optional[str] = None
    duration_minutes: int = 30

class TrailStep(TrailStepBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class DiscipleshipTrailBase(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty: TrailDifficulty = TrailDifficulty.BEGINNER
    category: str = "general"  # new_convert, baptism, leadership, spiritual_growth, family
    estimated_weeks: int = 4
    is_active: bool = True
    steps: List[TrailStep] = []

class DiscipleshipTrailCreate(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty: TrailDifficulty = TrailDifficulty.BEGINNER
    category: str = "general"
    estimated_weeks: int = 4

class DiscipleshipTrail(DiscipleshipTrailBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MemberTrailProgressBase(BaseModel):
    member_id: str
    trail_id: str
    mentor_id: Optional[str] = None
    status: DiscipleshipStatus = DiscipleshipStatus.NOT_STARTED
    current_step: int = 0
    completed_steps: List[str] = []
    notes: Optional[str] = None

class MemberTrailProgress(MemberTrailProgressBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MentorshipBase(BaseModel):
    mentor_id: str
    disciple_id: str
    trail_id: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None

class Mentorship(MentorshipBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlanBase(BaseModel):
    name: str
    type: PlanType
    price_monthly: float
    price_yearly: float
    member_limit: int
    features: List[str] = []
    is_active: bool = True

class Plan(PlanBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PromotionBase(BaseModel):
    code: str
    discount_type: str = "percentage"  # percentage or fixed
    discount_value: float
    valid_until: str
    applicable_plans: List[str] = []
    is_active: bool = True

class Promotion(PromotionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    usage_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AttendanceRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    event_id: str
    member_id: str
    checked_in_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommunicationLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    channel: str  # email, sms, whatsapp
    recipient_ids: List[str] = []
    subject: Optional[str] = None
    message: str
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"

# ==================== MEMBER CATEGORIES ====================
class MemberCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#3b82f6"

class MemberCategory(MemberCategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== MEMBER POSITIONS (CARGOS) ====================
class MemberPositionBase(BaseModel):
    name: str
    description: Optional[str] = None
    hierarchy_level: int = 0

class MemberPosition(MemberPositionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== CUSTOM FIELDS ====================
class CustomFieldBase(BaseModel):
    name: str
    field_type: str = "text"  # text, number, date, select, checkbox
    options: List[str] = []
    is_required: bool = False
    is_active: bool = True
    order: int = 0

class CustomField(CustomFieldBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== MENU PERSONALIZATION ====================
class MenuPersonalizationBase(BaseModel):
    menu_key: str
    display_name: str

class MenuPersonalization(MenuPersonalizationBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str, tenant_id: Optional[str] = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "tenant_id": tenant_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def require_super_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Acesso negado. Requer Super Admin.")
    return current_user

async def require_church_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in [UserRole.SUPER_ADMIN, UserRole.ADMIN_CHURCH]:
        raise HTTPException(status_code=403, detail="Acesso negado. Requer Admin da Igreja.")
    return current_user

# ==================== PUBLIC ROUTES ====================
@api_router.get("/")
async def root():
    return {"message": "Firmes - API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register")
async def register_user(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        phone=user_data.phone,
        tenant_id=user_data.tenant_id
    )
    doc = user.model_dump()
    doc['password_hash'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    token = create_token(user.id, user.email, user.role, user.tenant_id)
    
    return {"token": token, "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role, "tenant_id": user.tenant_id}}

@api_router.post("/auth/login")
async def login_user(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail="Conta desativada")
    
    token = create_token(user['id'], user['email'], user['role'], user.get('tenant_id'))
    return {"token": token, "user": {"id": user['id'], "email": user['email'], "name": user['name'], "role": user['role'], "tenant_id": user.get('tenant_id')}}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

# ==================== SUPER ADMIN - TENANTS ====================
@api_router.post("/admin/tenants", response_model=Tenant)
async def create_tenant(tenant_data: TenantCreate, current_user: dict = Depends(require_super_admin)):
    tenant = Tenant(
        name=tenant_data.name,
        logo_url=tenant_data.logo_url,
        primary_color=tenant_data.primary_color,
        secondary_color=tenant_data.secondary_color,
        custom_domain=tenant_data.custom_domain,
        plan_type=tenant_data.plan_type,
        member_limit=tenant_data.member_limit
    )
    doc = tenant.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.tenants.insert_one(doc)
    
    # Create admin user for tenant
    admin_user = User(
        email=tenant_data.admin_email,
        name=tenant_data.admin_name,
        role=UserRole.ADMIN_CHURCH,
        tenant_id=tenant.id
    )
    admin_doc = admin_user.model_dump()
    admin_doc['password_hash'] = hash_password(tenant_data.admin_password)
    admin_doc['created_at'] = admin_doc['created_at'].isoformat()
    await db.users.insert_one(admin_doc)
    
    return tenant

@api_router.get("/admin/tenants")
async def list_tenants(current_user: dict = Depends(require_super_admin)):
    tenants = await db.tenants.find({}, {"_id": 0}).to_list(1000)
    return tenants

@api_router.get("/admin/tenants/{tenant_id}")
async def get_tenant(tenant_id: str, current_user: dict = Depends(require_super_admin)):
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Igreja não encontrada")
    return tenant

@api_router.put("/admin/tenants/{tenant_id}")
async def update_tenant(tenant_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_super_admin)):
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.tenants.update_one({"id": tenant_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Igreja não encontrada")
    return {"message": "Igreja atualizada com sucesso"}

@api_router.delete("/admin/tenants/{tenant_id}")
async def delete_tenant(tenant_id: str, current_user: dict = Depends(require_super_admin)):
    result = await db.tenants.delete_one({"id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Igreja não encontrada")
    return {"message": "Igreja removida com sucesso"}

# ==================== SUPER ADMIN - PLANS ====================
@api_router.post("/admin/plans", response_model=Plan)
async def create_plan(plan_data: PlanBase, current_user: dict = Depends(require_super_admin)):
    plan = Plan(**plan_data.model_dump())
    doc = plan.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.plans.insert_one(doc)
    return plan

@api_router.get("/admin/plans")
async def list_plans(current_user: dict = Depends(require_super_admin)):
    plans = await db.plans.find({}, {"_id": 0}).to_list(100)
    return plans

@api_router.get("/plans")
async def get_public_plans():
    plans = await db.plans.find({"is_active": True}, {"_id": 0}).to_list(100)
    return plans

# ==================== SUPER ADMIN - PROMOTIONS ====================
@api_router.post("/admin/promotions", response_model=Promotion)
async def create_promotion(promo_data: PromotionBase, current_user: dict = Depends(require_super_admin)):
    promo = Promotion(**promo_data.model_dump())
    doc = promo.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.promotions.insert_one(doc)
    return promo

@api_router.get("/admin/promotions")
async def list_promotions(current_user: dict = Depends(require_super_admin)):
    promos = await db.promotions.find({}, {"_id": 0}).to_list(100)
    return promos

# ==================== SUPER ADMIN - METRICS ====================
@api_router.get("/admin/metrics")
async def get_global_metrics(current_user: dict = Depends(require_super_admin)):
    total_churches = await db.tenants.count_documents({"is_active": True})
    total_members = await db.members.count_documents({})
    
    # Calculate MRR (simplified)
    tenants = await db.tenants.find({"is_active": True}, {"_id": 0, "plan_type": 1}).to_list(1000)
    plan_prices = {"essential": 97, "strategic": 197, "apostolic": 397, "enterprise": 997}
    mrr = sum(plan_prices.get(t.get('plan_type', 'essential'), 97) for t in tenants)
    
    # Get recent growth
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    new_churches = await db.tenants.count_documents({"created_at": {"$gte": thirty_days_ago}})
    
    return {
        "total_churches": total_churches,
        "total_members": total_members,
        "mrr": mrr,
        "new_churches_30d": new_churches,
        "churn_rate": 2.5  # Mock value
    }

# ==================== CHURCH ADMIN - MEMBERS ====================
@api_router.post("/church/members", response_model=Member)
async def create_member(member_data: MemberCreate, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    member = Member(**member_data.model_dump(), tenant_id=tenant_id)
    doc = member.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.members.insert_one(doc)
    return member

@api_router.get("/church/members")
async def list_members(
    current_user: dict = Depends(require_church_admin),
    page: int = 1,
    per_page: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    category_id: Optional[str] = None,
    position_id: Optional[str] = None,
):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id and current_user.get('role') != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    query = {"tenant_id": tenant_id} if tenant_id else {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]
    if status and status != "all":
        query["status"] = status
    if category_id:
        query["category_id"] = category_id
    if position_id:
        query["position_id"] = position_id
    
    total = await db.members.count_documents(query)
    skip = (page - 1) * per_page
    members = await db.members.find(query, {"_id": 0}).skip(skip).limit(per_page).to_list(per_page)
    
    return {
        "items": members,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }

# IMPORTANT: Birthday route MUST be placed BEFORE {member_id} route to avoid path conflict
@api_router.get("/church/members/birthdays")
async def get_member_birthdays(month: Optional[int] = None, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    query = {"tenant_id": tenant_id, "birth_date": {"$exists": True, "$ne": None, "$ne": ""}}
    members = await db.members.find(query, {"_id": 0}).to_list(5000)
    target_month = month or datetime.now(timezone.utc).month
    today_str = datetime.now(timezone.utc).strftime("%m-%d")
    birthdays = []
    for m in members:
        bd = m.get('birth_date', '')
        if not bd:
            continue
        try:
            parts = bd.split('-')
            if len(parts) == 3:
                bm = int(parts[1])
                bd_day = int(parts[2])
                if bm == target_month:
                    m['birth_day'] = bd_day
                    m['is_today'] = bd.endswith(today_str)
                    birthdays.append(m)
        except (ValueError, IndexError):
            continue
    birthdays.sort(key=lambda x: x.get('birth_day', 0))
    return birthdays

@api_router.get("/church/members/{member_id}")
async def get_member(member_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": member_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    member = await db.members.find_one(query, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    return member

@api_router.put("/church/members/{member_id}")
async def update_member(member_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": member_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.members.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    return {"message": "Membro atualizado com sucesso"}

@api_router.delete("/church/members/{member_id}")
async def delete_member(member_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": member_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    result = await db.members.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    # Remove department links for this member
    await db.department_members.delete_many({"member_id": member_id})
    # Remove group links for this member
    await db.group_members.delete_many({"member_id": member_id})
    return {"message": "Membro removido com sucesso"}

# ==================== CHURCH ADMIN - MINISTRIES ====================
@api_router.post("/church/ministries", response_model=Ministry)
async def create_ministry(ministry_data: MinistryCreate, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    ministry = Ministry(**ministry_data.model_dump(), tenant_id=tenant_id)
    doc = ministry.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.ministries.insert_one(doc)
    return ministry

@api_router.get("/church/ministries")
async def list_ministries(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    ministries = await db.ministries.find(query, {"_id": 0}).to_list(100)
    return ministries

@api_router.put("/church/ministries/{ministry_id}")
async def update_ministry(ministry_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": ministry_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    result = await db.ministries.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ministério não encontrado")
    return {"message": "Ministério atualizado com sucesso"}

@api_router.delete("/church/ministries/{ministry_id}")
async def delete_ministry(ministry_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": ministry_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    result = await db.ministries.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ministério não encontrado")
    return {"message": "Ministério removido com sucesso"}

# ==================== CHURCH ADMIN - DEPARTMENTS ====================
@api_router.post("/church/departments")
async def create_department(data: DepartmentBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    dept = Department(**data.model_dump(), tenant_id=tenant_id)
    doc = dept.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.departments.insert_one(doc)
    return dept

@api_router.get("/church/departments")
async def list_departments(status: Optional[str] = None, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    if status and status != "all":
        query["status"] = status
    departments = await db.departments.find(query, {"_id": 0}).to_list(200)
    # Enrich with member photos
    for dept in departments:
        links = await db.department_members.find(
            {"department_id": dept["id"], "tenant_id": tenant_id}, {"_id": 0, "member_id": 1}
        ).to_list(100)
        member_ids = [l["member_id"] for l in links]
        dept["member_count"] = len(member_ids)
        if member_ids:
            members_preview = await db.members.find(
                {"id": {"$in": member_ids[:5]}}, {"_id": 0, "id": 1, "name": 1, "photo_url": 1}
            ).to_list(5)
            dept["members_preview"] = members_preview
        else:
            dept["members_preview"] = []
        # Get responsavel name
        if dept.get("responsavel_id"):
            resp = await db.members.find_one({"id": dept["responsavel_id"]}, {"_id": 0, "name": 1, "photo_url": 1})
            dept["responsavel_name"] = resp.get("name") if resp else None
    return departments

@api_router.get("/church/departments/{dept_id}")
async def get_department(dept_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": dept_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    dept = await db.departments.find_one(query, {"_id": 0})
    if not dept:
        raise HTTPException(status_code=404, detail="Departamento não encontrado")
    # Get all members
    links = await db.department_members.find(
        {"department_id": dept_id, "tenant_id": tenant_id}, {"_id": 0}
    ).to_list(1000)
    member_ids = [l["member_id"] for l in links]
    joined_map = {l["member_id"]: l.get("joined_at", "") for l in links}
    members = []
    if member_ids:
        member_docs = await db.members.find(
            {"id": {"$in": member_ids}}, {"_id": 0}
        ).to_list(1000)
        # Enrich with position name
        positions = await db.member_positions.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(100)
        pos_map = {p["id"]: p["name"] for p in positions}
        for m in member_docs:
            m["joined_at"] = joined_map.get(m["id"], "")
            m["position_name"] = pos_map.get(m.get("position_id", ""), "")
            members.append(m)
    dept["members"] = members
    dept["member_count"] = len(members)
    # Responsavel info
    if dept.get("responsavel_id"):
        resp = await db.members.find_one({"id": dept["responsavel_id"]}, {"_id": 0, "name": 1, "photo_url": 1})
        dept["responsavel_name"] = resp.get("name") if resp else None
    return dept

@api_router.put("/church/departments/{dept_id}")
async def update_department(dept_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": dept_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.departments.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Departamento não encontrado")
    return {"message": "Departamento atualizado com sucesso"}

@api_router.delete("/church/departments/{dept_id}")
async def delete_department(dept_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": dept_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.departments.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Departamento não encontrado")
    # Remove all member links
    await db.department_members.delete_many({"department_id": dept_id, "tenant_id": tenant_id})
    return {"message": "Departamento removido com sucesso"}

# ==================== DEPARTMENT MEMBERS ====================
@api_router.post("/church/departments/{dept_id}/members")
async def add_members_to_department(dept_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    member_ids = data.get("member_ids", [])
    if not member_ids:
        raise HTTPException(status_code=400, detail="Nenhum membro selecionado")
    # Check department exists
    dept = await db.departments.find_one({"id": dept_id, "tenant_id": tenant_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Departamento não encontrado")
    added = 0
    for mid in member_ids:
        # Avoid duplicates
        exists = await db.department_members.find_one({"department_id": dept_id, "member_id": mid, "tenant_id": tenant_id})
        if exists:
            continue
        link = DepartmentMemberLink(department_id=dept_id, member_id=mid, tenant_id=tenant_id)
        doc = link.model_dump()
        doc["joined_at"] = doc["joined_at"].isoformat()
        await db.department_members.insert_one(doc)
        added += 1
    # Update member count
    count = await db.department_members.count_documents({"department_id": dept_id, "tenant_id": tenant_id})
    await db.departments.update_one({"id": dept_id}, {"$set": {"member_count": count}})
    return {"message": f"{added} membro(s) adicionado(s) ao departamento", "added": added}

@api_router.delete("/church/departments/{dept_id}/members/{member_id}")
async def remove_member_from_department(dept_id: str, member_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    result = await db.department_members.delete_one({"department_id": dept_id, "member_id": member_id, "tenant_id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    count = await db.department_members.count_documents({"department_id": dept_id, "tenant_id": tenant_id})
    await db.departments.update_one({"id": dept_id}, {"$set": {"member_count": count}})
    return {"message": "Membro removido do departamento"}

@api_router.get("/church/departments/{dept_id}/members")
async def list_department_members(dept_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    links = await db.department_members.find({"department_id": dept_id, "tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    member_ids = [l["member_id"] for l in links]
    joined_map = {l["member_id"]: l.get("joined_at", "") for l in links}
    if not member_ids:
        return []
    members = await db.members.find({"id": {"$in": member_ids}}, {"_id": 0}).to_list(1000)
    positions = await db.member_positions.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(100)
    pos_map = {p["id"]: p["name"] for p in positions}
    for m in members:
        m["joined_at"] = joined_map.get(m["id"], "")
        m["position_name"] = pos_map.get(m.get("position_id", ""), "")
    return members

# ==================== MIGRATION: Ministries -> Departments ====================
@api_router.post("/migrate/ministries-to-departments")
async def migrate_ministries_to_departments():
    """Migrate existing ministries data to departments collection"""
    ministries = await db.ministries.find({}, {"_id": 0}).to_list(1000)
    migrated = 0
    for m in ministries:
        exists = await db.departments.find_one({"id": m["id"]})
        if exists:
            continue
        dept_doc = {
            "id": m["id"],
            "tenant_id": m.get("tenant_id", ""),
            "name": m.get("name", ""),
            "description": m.get("description", ""),
            "icon": "building",
            "responsavel_id": m.get("leader_id"),
            "status": "active",
            "goals": m.get("goals"),
            "meeting_schedule": m.get("meeting_schedule"),
            "member_count": m.get("member_count", 0),
            "created_at": m.get("created_at", datetime.now(timezone.utc).isoformat()),
        }
        await db.departments.insert_one(dept_doc)
        migrated += 1
    return {"message": f"{migrated} ministério(s) migrado(s) para departamentos", "migrated": migrated}


# ==================== CHURCH ADMIN - GROUP CATEGORIES ====================
@api_router.post("/church/group-categories")
async def create_group_category(data: GroupCategoryBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    cat = GroupCategory(**data.model_dump(), tenant_id=tenant_id)
    doc = cat.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.group_categories.insert_one(doc)
    return cat

@api_router.get("/church/group-categories")
async def list_group_categories(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    return await db.group_categories.find(query, {"_id": 0}).to_list(100)

@api_router.put("/church/group-categories/{cat_id}")
async def update_group_category(cat_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": cat_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.group_categories.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return {"message": "Categoria atualizada"}

@api_router.delete("/church/group-categories/{cat_id}")
async def delete_group_category(cat_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": cat_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.group_categories.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return {"message": "Categoria removida"}

# ==================== CHURCH ADMIN - GROUPS ====================
@api_router.post("/church/groups")
async def create_group(data: GroupBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    group = Group(**data.model_dump(), tenant_id=tenant_id)
    doc = group.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.groups.insert_one(doc)
    return group

@api_router.get("/church/groups")
async def list_groups(
    status: Optional[str] = None,
    category_id: Optional[str] = None,
    department_id: Optional[str] = None,
    leader_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_church_admin),
):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    if status and status != "all":
        query["status"] = status
    if category_id:
        query["category_id"] = category_id
    if department_id:
        query["department_id"] = department_id
    if leader_id:
        query["leader_id"] = leader_id
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    groups = await db.groups.find(query, {"_id": 0}).to_list(500)

    # Enrich with related data
    all_categories = await db.group_categories.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(100)
    cat_map = {c["id"]: c for c in all_categories}
    all_departments = await db.departments.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(100)
    dept_map = {d["id"]: d.get("name", "") for d in all_departments}

    for g in groups:
        # Member count
        count = await db.group_members.count_documents({"group_id": g["id"], "tenant_id": tenant_id})
        g["member_count"] = count
        # Category info
        cat = cat_map.get(g.get("category_id", ""))
        g["category_name"] = cat.get("name", "") if cat else ""
        g["category_color"] = cat.get("color", "#6366f1") if cat else "#6366f1"
        # Department name
        g["department_name"] = dept_map.get(g.get("department_id", ""), "")
        # Leader name
        if g.get("leader_id"):
            leader = await db.members.find_one({"id": g["leader_id"]}, {"_id": 0, "name": 1, "photo_url": 1})
            g["leader_name"] = leader.get("name") if leader else ""
            g["leader_photo"] = leader.get("photo_url") if leader else ""
        else:
            g["leader_name"] = ""
            g["leader_photo"] = ""
        # Preview members
        links = await db.group_members.find({"group_id": g["id"], "tenant_id": tenant_id}, {"_id": 0, "member_id": 1}).limit(4).to_list(4)
        if links:
            preview_ids = [l["member_id"] for l in links]
            previews = await db.members.find({"id": {"$in": preview_ids}}, {"_id": 0, "id": 1, "name": 1, "photo_url": 1}).to_list(4)
            g["members_preview"] = previews
        else:
            g["members_preview"] = []

    return groups

@api_router.get("/church/groups/strategic-dashboard")
async def get_groups_strategic_dashboard(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")

    total_groups = await db.groups.count_documents({"tenant_id": tenant_id, "status": "active"})
    total_closed = await db.groups.count_documents({"tenant_id": tenant_id, "status": "closed"})
    total_participants = await db.group_members.count_documents({"tenant_id": tenant_id})

    # Groups by category
    groups = await db.groups.find({"tenant_id": tenant_id, "status": "active"}, {"_id": 0}).to_list(500)
    categories = await db.group_categories.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(100)
    cat_map = {c["id"]: c.get("name", "Sem categoria") for c in categories}

    by_category = {}
    for g in groups:
        cat_name = cat_map.get(g.get("category_id", ""), "Sem categoria")
        by_category[cat_name] = by_category.get(cat_name, 0) + 1

    # Groups by department
    departments = await db.departments.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(100)
    dept_map = {d["id"]: d.get("name", "Sem departamento") for d in departments}
    by_department = {}
    for g in groups:
        dept_name = dept_map.get(g.get("department_id", ""), "Sem departamento")
        by_department[dept_name] = by_department.get(dept_name, 0) + 1

    # Ranking by member count
    ranking = []
    for g in groups:
        count = await db.group_members.count_documents({"group_id": g["id"], "tenant_id": tenant_id})
        ranking.append({"id": g["id"], "name": g["name"], "member_count": count})
    ranking.sort(key=lambda x: x["member_count"], reverse=True)

    return {
        "total_groups": total_groups,
        "total_closed": total_closed,
        "total_participants": total_participants,
        "by_category": by_category,
        "by_department": by_department,
        "ranking": ranking[:10],
    }

@api_router.get("/church/groups/{group_id}")
async def get_group(group_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": group_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    group = await db.groups.find_one(query, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    # Members
    links = await db.group_members.find({"group_id": group_id, "tenant_id": tenant_id}, {"_id": 0}).to_list(2000)
    member_ids = [l["member_id"] for l in links]
    joined_map = {l["member_id"]: l.get("joined_at", "") for l in links}
    members = []
    if member_ids:
        member_docs = await db.members.find({"id": {"$in": member_ids}}, {"_id": 0}).to_list(2000)
        positions = await db.member_positions.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(100)
        pos_map = {p["id"]: p["name"] for p in positions}
        for m in member_docs:
            m["joined_at"] = joined_map.get(m["id"], "")
            m["position_name"] = pos_map.get(m.get("position_id", ""), "")
            members.append(m)
    group["members"] = members
    group["member_count"] = len(members)
    # Category
    if group.get("category_id"):
        cat = await db.group_categories.find_one({"id": group["category_id"]}, {"_id": 0})
        group["category_name"] = cat.get("name") if cat else ""
    # Department
    if group.get("department_id"):
        dept = await db.departments.find_one({"id": group["department_id"]}, {"_id": 0})
        group["department_name"] = dept.get("name") if dept else ""
    # Leader
    if group.get("leader_id"):
        leader = await db.members.find_one({"id": group["leader_id"]}, {"_id": 0, "name": 1, "photo_url": 1})
        group["leader_name"] = leader.get("name") if leader else ""
    return group

@api_router.put("/church/groups/{group_id}")
async def update_group(group_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": group_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.groups.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    return {"message": "Grupo atualizado"}

@api_router.delete("/church/groups/{group_id}")
async def delete_group(group_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": group_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.groups.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    await db.group_members.delete_many({"group_id": group_id, "tenant_id": tenant_id})
    return {"message": "Grupo removido"}

# ==================== GROUP MEMBERS ====================
@api_router.post("/church/groups/{group_id}/members")
async def add_members_to_group(group_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    member_ids = data.get("member_ids", [])
    if not member_ids:
        raise HTTPException(status_code=400, detail="Nenhum membro selecionado")
    group = await db.groups.find_one({"id": group_id, "tenant_id": tenant_id})
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    added = 0
    for mid in member_ids:
        exists = await db.group_members.find_one({"group_id": group_id, "member_id": mid, "tenant_id": tenant_id})
        if exists:
            continue
        link = GroupMemberLink(group_id=group_id, member_id=mid, tenant_id=tenant_id)
        doc = link.model_dump()
        doc["joined_at"] = doc["joined_at"].isoformat()
        await db.group_members.insert_one(doc)
        added += 1
    count = await db.group_members.count_documents({"group_id": group_id, "tenant_id": tenant_id})
    await db.groups.update_one({"id": group_id}, {"$set": {"member_count": count}})
    return {"message": f"{added} membro(s) adicionado(s)", "added": added}

@api_router.delete("/church/groups/{group_id}/members/{member_id}")
async def remove_member_from_group(group_id: str, member_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    result = await db.group_members.delete_one({"group_id": group_id, "member_id": member_id, "tenant_id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    count = await db.group_members.count_documents({"group_id": group_id, "tenant_id": tenant_id})
    await db.groups.update_one({"id": group_id}, {"$set": {"member_count": count}})
    return {"message": "Membro removido do grupo"}


# ==================== CHURCH ADMIN - EVENTS ====================
@api_router.post("/church/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    event = Event(**event_data.model_dump(), tenant_id=tenant_id)
    doc = event.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.events.insert_one(doc)
    return event

@api_router.get("/church/events")
async def list_events(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    events = await db.events.find(query, {"_id": 0}).to_list(100)
    return events

@api_router.get("/church/events/{event_id}")
async def get_event(event_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": event_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    event = await db.events.find_one(query, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return event

@api_router.put("/church/events/{event_id}")
async def update_event(event_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": event_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.events.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return {"message": "Evento atualizado com sucesso"}

@api_router.delete("/church/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": event_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    result = await db.events.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return {"message": "Evento removido com sucesso"}

@api_router.post("/church/events/{event_id}/checkin")
async def event_checkin(event_id: str, member_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    
    # Record attendance
    attendance = AttendanceRecord(tenant_id=tenant_id, event_id=event_id, member_id=member_id)
    doc = attendance.model_dump()
    doc['checked_in_at'] = doc['checked_in_at'].isoformat()
    await db.attendance.insert_one(doc)
    
    # Update event count
    await db.events.update_one({"id": event_id}, {"$inc": {"checked_in_count": 1}})
    
    return {"message": "Check-in realizado com sucesso", "attendance_id": attendance.id}


# ==================== FINANCIAL - HELPER: LOG ====================
async def log_financeiro(tenant_id: str, usuario: str, acao: str, transacao_id: str = None, dados_antes: dict = None, dados_depois: dict = None):
    log_doc = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "usuario": usuario,
        "acao": acao,
        "transacao_id": transacao_id,
        "dados_antes": dados_antes,
        "dados_depois": dados_depois,
        "data_hora": datetime.now(timezone.utc).isoformat(),
    }
    await db.financeiro_logs.insert_one(log_doc)

async def check_periodo_bloqueado(tenant_id: str, data_str: str):
    if not data_str:
        return False
    try:
        parts = data_str.split("-")
        ano, mes = int(parts[0]), int(parts[1])
        blocked = await db.periodos_bloqueados.find_one({"tenant_id": tenant_id, "ano": ano, "mes": mes}, {"_id": 0})
        return blocked is not None
    except Exception:
        return False


# ==================== FINANCIAL - CONTAS ====================
@api_router.post("/church/fin/contas")
async def create_conta(data: ContaFinanceiraBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    conta = ContaFinanceira(**data.model_dump(), tenant_id=tenant_id, saldo_atual=data.saldo_inicial)
    doc = conta.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contas_financeiras.insert_one(doc)
    await log_financeiro(tenant_id, current_user.get('email', ''), "criar_conta", dados_depois={"nome": data.nome})
    return conta

@api_router.get("/church/fin/contas")
async def list_contas(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    return await db.contas_financeiras.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.put("/church/fin/contas/{conta_id}")
async def update_conta(conta_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": conta_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    old = await db.contas_financeiras.find_one(query, {"_id": 0})
    if not old:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    safe = {k: v for k, v in updates.items() if k in ("nome", "tipo", "status")}
    await db.contas_financeiras.update_one(query, {"$set": safe})
    await log_financeiro(tenant_id, current_user.get('email', ''), "atualizar_conta", dados_antes={"nome": old.get("nome")}, dados_depois=safe)
    return {"message": "Conta atualizada"}

@api_router.delete("/church/fin/contas/{conta_id}")
async def delete_conta(conta_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": conta_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    has_tx = await db.transacoes.find_one({"$or": [{"conta_id": conta_id}, {"conta_destino_id": conta_id}]})
    if has_tx:
        raise HTTPException(status_code=400, detail="Conta possui transações vinculadas. Inative-a em vez de excluir.")
    result = await db.contas_financeiras.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    await log_financeiro(tenant_id, current_user.get('email', ''), "excluir_conta", dados_antes={"conta_id": conta_id})
    return {"message": "Conta removida"}


# ==================== FINANCIAL - CATEGORIAS ====================
@api_router.post("/church/fin/categorias")
async def create_cat_fin(data: CategoriaFinanceiraBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    cat = CategoriaFinanceira(**data.model_dump(), tenant_id=tenant_id)
    doc = cat.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.categorias_financeiras.insert_one(doc)
    return cat

@api_router.get("/church/fin/categorias")
async def list_cat_fin(tipo: Optional[str] = None, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    if tipo and tipo != "all":
        query["tipo"] = tipo
    return await db.categorias_financeiras.find(query, {"_id": 0}).sort("nome", 1).to_list(200)

@api_router.put("/church/fin/categorias/{cat_id}")
async def update_cat_fin(cat_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": cat_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.categorias_financeiras.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return {"message": "Categoria atualizada"}

@api_router.delete("/church/fin/categorias/{cat_id}")
async def delete_cat_fin(cat_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": cat_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.categorias_financeiras.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return {"message": "Categoria removida"}


# ==================== FINANCIAL - CENTROS DE CUSTO ====================
@api_router.post("/church/fin/centros-custo")
async def create_centro(data: CentroCustoBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    cc = CentroCusto(**data.model_dump(), tenant_id=tenant_id)
    doc = cc.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.centros_custos.insert_one(doc)
    return cc

@api_router.get("/church/fin/centros-custo")
async def list_centros(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    return await db.centros_custos.find(query, {"_id": 0}).sort("nome", 1).to_list(200)

@api_router.put("/church/fin/centros-custo/{cc_id}")
async def update_centro(cc_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": cc_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.centros_custos.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Centro de custo não encontrado")
    return {"message": "Centro de custo atualizado"}

@api_router.delete("/church/fin/centros-custo/{cc_id}")
async def delete_centro(cc_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": cc_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.centros_custos.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Centro de custo não encontrado")
    return {"message": "Centro de custo removido"}


# ==================== FINANCIAL - CONTATOS ====================
@api_router.post("/church/fin/contatos")
async def create_contato(data: ContatoFinanceiroBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    c = ContatoFinanceiro(**data.model_dump(), tenant_id=tenant_id)
    doc = c.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contatos_financeiros.insert_one(doc)
    return c

@api_router.get("/church/fin/contatos")
async def list_contatos(tipo: Optional[str] = None, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    if tipo and tipo != "all":
        query["tipo"] = tipo
    return await db.contatos_financeiros.find(query, {"_id": 0}).sort("nome", 1).to_list(500)

@api_router.put("/church/fin/contatos/{c_id}")
async def update_contato(c_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": c_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.contatos_financeiros.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    return {"message": "Contato atualizado"}

@api_router.delete("/church/fin/contatos/{c_id}")
async def delete_contato(c_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": c_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.contatos_financeiros.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    return {"message": "Contato removido"}


# ==================== FINANCIAL - TRANSACOES ====================
@api_router.post("/church/fin/transacoes")
async def create_transacao(data: TransacaoBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    if data.valor <= 0:
        raise HTTPException(status_code=400, detail="Valor deve ser positivo")
    blocked = await check_periodo_bloqueado(tenant_id, data.data)
    if blocked:
        raise HTTPException(status_code=400, detail="Periodo bloqueado. Não é possível criar transações neste mês.")
    tx = Transacao(**data.model_dump(), tenant_id=tenant_id)
    doc = tx.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.transacoes.insert_one(doc)
    # Update account balances
    if data.status == "confirmado":
        if data.tipo == "receita" and data.conta_id:
            await db.contas_financeiras.update_one({"id": data.conta_id}, {"$inc": {"saldo_atual": data.valor}})
        elif data.tipo == "despesa" and data.conta_id:
            await db.contas_financeiras.update_one({"id": data.conta_id}, {"$inc": {"saldo_atual": -data.valor}})
        elif data.tipo == "transferencia":
            if data.conta_id:
                await db.contas_financeiras.update_one({"id": data.conta_id}, {"$inc": {"saldo_atual": -data.valor}})
            if data.conta_destino_id:
                await db.contas_financeiras.update_one({"id": data.conta_destino_id}, {"$inc": {"saldo_atual": data.valor}})
    await log_financeiro(tenant_id, current_user.get('email', ''), "criar_transacao", transacao_id=tx.id, dados_depois={"tipo": data.tipo, "valor": data.valor})
    return tx

@api_router.get("/church/fin/transacoes")
async def list_transacoes(
    tipo: Optional[str] = None, status: Optional[str] = None,
    conta_id: Optional[str] = None, categoria_id: Optional[str] = None,
    centro_custo_id: Optional[str] = None, data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None, search: Optional[str] = None,
    current_user: dict = Depends(require_church_admin),
):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    if tipo and tipo != "all":
        query["tipo"] = tipo
    if status and status != "all":
        query["status"] = status
    if conta_id:
        query["$or"] = [{"conta_id": conta_id}, {"conta_destino_id": conta_id}]
    if categoria_id:
        query["categoria_id"] = categoria_id
    if centro_custo_id:
        query["centro_custo_id"] = centro_custo_id
    if data_inicio:
        query.setdefault("data", {})["$gte"] = data_inicio
    if data_fim:
        query.setdefault("data", {})["$lte"] = data_fim
    if search:
        query["descricao"] = {"$regex": search, "$options": "i"}
    txs = await db.transacoes.find(query, {"_id": 0}).sort("data", -1).to_list(2000)
    # Enrich
    for t in txs:
        if t.get("conta_id"):
            c = await db.contas_financeiras.find_one({"id": t["conta_id"]}, {"_id": 0, "nome": 1})
            t["conta_nome"] = c["nome"] if c else None
        if t.get("conta_destino_id"):
            c = await db.contas_financeiras.find_one({"id": t["conta_destino_id"]}, {"_id": 0, "nome": 1})
            t["conta_destino_nome"] = c["nome"] if c else None
        if t.get("categoria_id"):
            cat = await db.categorias_financeiras.find_one({"id": t["categoria_id"]}, {"_id": 0, "nome": 1, "cor": 1})
            t["categoria_nome"] = cat["nome"] if cat else None
            t["categoria_cor"] = cat["cor"] if cat else None
        if t.get("membro_id"):
            m = await db.members.find_one({"id": t["membro_id"]}, {"_id": 0, "name": 1})
            t["membro_nome"] = m["name"] if m else None
    return txs

@api_router.get("/church/fin/transacoes/{tx_id}")
async def get_transacao(tx_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": tx_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    tx = await db.transacoes.find_one(query, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return tx

@api_router.put("/church/fin/transacoes/{tx_id}")
async def update_transacao(tx_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": tx_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    old = await db.transacoes.find_one(query, {"_id": 0})
    if not old:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    if old.get("status") == "confirmado" and updates.get("status") != "cancelado":
        raise HTTPException(status_code=400, detail="Transação confirmada só pode ser cancelada (estorno)")
    blocked = await check_periodo_bloqueado(tenant_id, old.get("data", ""))
    if blocked:
        raise HTTPException(status_code=400, detail="Periodo bloqueado")
    await db.transacoes.update_one(query, {"$set": updates})
    # If cancelling a confirmed transaction, reverse balance
    if old.get("status") == "confirmado" and updates.get("status") == "cancelado":
        val = old.get("valor", 0)
        if old.get("tipo") == "receita" and old.get("conta_id"):
            await db.contas_financeiras.update_one({"id": old["conta_id"]}, {"$inc": {"saldo_atual": -val}})
        elif old.get("tipo") == "despesa" and old.get("conta_id"):
            await db.contas_financeiras.update_one({"id": old["conta_id"]}, {"$inc": {"saldo_atual": val}})
        elif old.get("tipo") == "transferencia":
            if old.get("conta_id"):
                await db.contas_financeiras.update_one({"id": old["conta_id"]}, {"$inc": {"saldo_atual": val}})
            if old.get("conta_destino_id"):
                await db.contas_financeiras.update_one({"id": old["conta_destino_id"]}, {"$inc": {"saldo_atual": -val}})
    await log_financeiro(tenant_id, current_user.get('email', ''), "atualizar_transacao", transacao_id=tx_id, dados_antes={"status": old.get("status")}, dados_depois=updates)
    return {"message": "Transação atualizada"}

@api_router.delete("/church/fin/transacoes/{tx_id}")
async def delete_transacao(tx_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": tx_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    old = await db.transacoes.find_one(query, {"_id": 0})
    if not old:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    if old.get("status") == "confirmado":
        raise HTTPException(status_code=400, detail="Transação confirmada não pode ser excluída. Cancele-a primeiro.")
    await db.transacoes.delete_one(query)
    await log_financeiro(tenant_id, current_user.get('email', ''), "excluir_transacao", transacao_id=tx_id)
    return {"message": "Transação removida"}


# ==================== FINANCIAL - LOGS ====================
@api_router.get("/church/fin/logs")
async def list_fin_logs(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    return await db.financeiro_logs.find(query, {"_id": 0}).sort("data_hora", -1).to_list(500)


# ==================== FINANCIAL - PERIODOS BLOQUEADOS ====================
@api_router.post("/church/fin/periodos-bloqueados")
async def bloquear_periodo(data: PeriodoBloqueadoBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    existing = await db.periodos_bloqueados.find_one({"tenant_id": tenant_id, "ano": data.ano, "mes": data.mes})
    if existing:
        raise HTTPException(status_code=400, detail="Periodo já bloqueado")
    pb = PeriodoBloqueado(**data.model_dump(), tenant_id=tenant_id, bloqueado_por=current_user.get('email', ''))
    doc = pb.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.periodos_bloqueados.insert_one(doc)
    await log_financeiro(tenant_id, current_user.get('email', ''), "bloquear_periodo", dados_depois={"ano": data.ano, "mes": data.mes})
    return pb

@api_router.get("/church/fin/periodos-bloqueados")
async def list_periodos_bloqueados(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    return await db.periodos_bloqueados.find(query, {"_id": 0}).sort([("ano", -1), ("mes", -1)]).to_list(100)

@api_router.delete("/church/fin/periodos-bloqueados/{pb_id}")
async def desbloquear_periodo(pb_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": pb_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    old = await db.periodos_bloqueados.find_one(query, {"_id": 0})
    if not old:
        raise HTTPException(status_code=404, detail="Periodo não encontrado")
    await db.periodos_bloqueados.delete_one(query)
    await log_financeiro(tenant_id, current_user.get('email', ''), "desbloquear_periodo", dados_antes={"ano": old.get("ano"), "mes": old.get("mes")})
    return {"message": "Periodo desbloqueado"}


# ==================== FINANCIAL - RESUMO & PAINEL ====================
@api_router.get("/church/fin/resumo")
async def get_fin_resumo(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    tq = {"tenant_id": tenant_id} if tenant_id else {}
    contas = await db.contas_financeiras.find({**tq, "status": "active"}, {"_id": 0}).to_list(100)
    saldo_total = sum(c.get("saldo_atual", 0) for c in contas)
    now = datetime.now(timezone.utc)
    mes_atual = f"{now.year}-{now.month:02d}"
    receitas_mes = 0
    despesas_mes = 0
    txs_mes = await db.transacoes.find({**tq, "status": "confirmado", "data": {"$regex": f"^{mes_atual}"}}, {"_id": 0, "tipo": 1, "valor": 1}).to_list(5000)
    for t in txs_mes:
        if t["tipo"] == "receita":
            receitas_mes += t["valor"]
        elif t["tipo"] == "despesa":
            despesas_mes += t["valor"]
    # By category
    all_txs = await db.transacoes.find({**tq, "status": "confirmado"}, {"_id": 0, "tipo": 1, "valor": 1, "categoria_id": 1, "data": 1}).to_list(10000)
    total_receitas = sum(t["valor"] for t in all_txs if t["tipo"] == "receita")
    total_despesas = sum(t["valor"] for t in all_txs if t["tipo"] == "despesa")
    by_cat = {}
    for t in all_txs:
        cid = t.get("categoria_id")
        if cid:
            by_cat.setdefault(cid, {"receita": 0, "despesa": 0})
            by_cat[cid][t["tipo"]] = by_cat[cid].get(t["tipo"], 0) + t["valor"]
    cat_data = []
    for cid, vals in by_cat.items():
        cat = await db.categorias_financeiras.find_one({"id": cid}, {"_id": 0, "nome": 1, "cor": 1})
        cat_data.append({"nome": cat["nome"] if cat else "Sem categoria", "cor": cat.get("cor", "#999") if cat else "#999", **vals})
    # Monthly flow (last 6 months)
    fluxo = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=i * 30)
        m = f"{d.year}-{d.month:02d}"
        r = sum(t["valor"] for t in all_txs if t["tipo"] == "receita" and t.get("data", "").startswith(m))
        dp = sum(t["valor"] for t in all_txs if t["tipo"] == "despesa" and t.get("data", "").startswith(m))
        fluxo.append({"mes": m, "receitas": r, "despesas": dp})
    return {
        "saldo_total": round(saldo_total, 2),
        "contas": [{"nome": c["nome"], "saldo": round(c.get("saldo_atual", 0), 2)} for c in contas],
        "receitas_mes": round(receitas_mes, 2),
        "despesas_mes": round(despesas_mes, 2),
        "resultado_mes": round(receitas_mes - despesas_mes, 2),
        "total_receitas": round(total_receitas, 2),
        "total_despesas": round(total_despesas, 2),
        "por_categoria": cat_data,
        "fluxo_mensal": fluxo,
    }

@api_router.get("/church/fin/painel-estrategico")
async def get_fin_painel(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    tq = {"tenant_id": tenant_id} if tenant_id else {}
    now = datetime.now(timezone.utc)
    all_txs = await db.transacoes.find({**tq, "status": "confirmado"}, {"_id": 0, "tipo": 1, "valor": 1, "data": 1, "categoria_id": 1, "centro_custo_id": 1}).to_list(10000)
    # Annual totals
    ano_atual = str(now.year)
    receita_anual = sum(t["valor"] for t in all_txs if t["tipo"] == "receita" and t.get("data", "").startswith(ano_atual))
    despesa_anual = sum(t["valor"] for t in all_txs if t["tipo"] == "despesa" and t.get("data", "").startswith(ano_atual))
    # Monthly comparison (12 months)
    comparativo = []
    for i in range(11, -1, -1):
        d = now - timedelta(days=i * 30)
        m = f"{d.year}-{d.month:02d}"
        r = sum(t["valor"] for t in all_txs if t["tipo"] == "receita" and t.get("data", "").startswith(m))
        dp = sum(t["valor"] for t in all_txs if t["tipo"] == "despesa" and t.get("data", "").startswith(m))
        comparativo.append({"mes": m, "receitas": round(r, 2), "despesas": round(dp, 2)})
    # Top expenses by category
    despesas_cat = {}
    for t in all_txs:
        if t["tipo"] == "despesa":
            cid = t.get("categoria_id", "sem_categoria")
            despesas_cat[cid] = despesas_cat.get(cid, 0) + t["valor"]
    top_despesas = []
    for cid, val in sorted(despesas_cat.items(), key=lambda x: x[1], reverse=True)[:10]:
        cat = await db.categorias_financeiras.find_one({"id": cid}, {"_id": 0, "nome": 1}) if cid != "sem_categoria" else None
        top_despesas.append({"nome": cat["nome"] if cat else "Sem categoria", "valor": round(val, 2)})
    # Health indicators
    total_r = sum(t["valor"] for t in all_txs if t["tipo"] == "receita")
    total_d = sum(t["valor"] for t in all_txs if t["tipo"] == "despesa")
    saude = "positiva" if total_r > total_d else "negativa" if total_d > total_r else "equilibrada"
    return {
        "receita_anual": round(receita_anual, 2),
        "despesa_anual": round(despesa_anual, 2),
        "resultado_anual": round(receita_anual - despesa_anual, 2),
        "comparativo_mensal": comparativo,
        "top_despesas": top_despesas,
        "saude_financeira": saude,
        "total_receitas": round(total_r, 2),
        "total_despesas": round(total_d, 2),
    }

@api_router.post("/church/fin/importar")
async def importar_transacoes(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    rows = data.get("rows", [])
    if not rows:
        raise HTTPException(status_code=400, detail="Nenhuma linha para importar")
    imported = 0
    errors = []
    for i, row in enumerate(rows):
        try:
            valor = float(row.get("valor", 0))
            if valor <= 0:
                errors.append(f"Linha {i+1}: valor inválido")
                continue
            tx_data = TransacaoBase(
                tipo=row.get("tipo", "receita"),
                valor=valor,
                data=row.get("data", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
                descricao=row.get("descricao", ""),
                conta_id=row.get("conta_id"),
                categoria_id=row.get("categoria_id"),
                status=row.get("status", "confirmado"),
            )
            tx = Transacao(**tx_data.model_dump(), tenant_id=tenant_id)
            doc = tx.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.transacoes.insert_one(doc)
            if tx_data.status == "confirmado" and tx_data.conta_id:
                inc = tx_data.valor if tx_data.tipo == "receita" else -tx_data.valor
                await db.contas_financeiras.update_one({"id": tx_data.conta_id}, {"$inc": {"saldo_atual": inc}})
            imported += 1
        except Exception as e:
            errors.append(f"Linha {i+1}: {str(e)}")
    await log_financeiro(tenant_id, current_user.get('email', ''), "importar_transacoes", dados_depois={"importadas": imported, "erros": len(errors)})
    return {"imported": imported, "errors": errors}


# ==================== CHURCH ADMIN - DONATIONS ====================
@api_router.post("/church/donations", response_model=Donation)
async def create_donation(donation_data: DonationCreate, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    donation = Donation(**donation_data.model_dump(), tenant_id=tenant_id)
    doc = donation.model_dump()
    doc['donation_date'] = doc['donation_date'].isoformat()
    await db.donations.insert_one(doc)
    return donation

@api_router.get("/church/donations")
async def list_donations(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    donations = await db.donations.find(query, {"_id": 0}).to_list(1000)
    return donations

@api_router.get("/church/financial/summary")
async def get_financial_summary(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    # Get current month donations
    start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {"$group": {
            "_id": "$donation_type",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    
    results = await db.donations.aggregate(pipeline).to_list(10)
    
    summary = {
        "total_tithes": 0,
        "total_offerings": 0,
        "total_special": 0,
        "total_recurring": 0,
        "grand_total": 0
    }
    
    for r in results:
        if r['_id'] == 'tithe':
            summary['total_tithes'] = r['total']
        elif r['_id'] == 'offering':
            summary['total_offerings'] = r['total']
        elif r['_id'] == 'special':
            summary['total_special'] = r['total']
        elif r['_id'] == 'recurring':
            summary['total_recurring'] = r['total']
    
    summary['grand_total'] = sum([summary['total_tithes'], summary['total_offerings'], summary['total_special'], summary['total_recurring']])
    
    return summary

# ==================== CHURCH ADMIN - DASHBOARD ====================
@api_router.get("/church/dashboard")
async def get_church_dashboard(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    # Get counts
    total_members = await db.members.count_documents({"tenant_id": tenant_id})
    total_visitors = await db.members.count_documents({"tenant_id": tenant_id, "status": "visitor"})
    total_ministries = await db.ministries.count_documents({"tenant_id": tenant_id})
    total_departments = await db.departments.count_documents({"tenant_id": tenant_id, "status": "active"})
    
    # Get financial summary
    pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    financial_result = await db.donations.aggregate(pipeline).to_list(1)
    total_revenue = financial_result[0]['total'] if financial_result else 0
    
    # Get upcoming events
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    upcoming_events = await db.events.find(
        {"tenant_id": tenant_id, "event_date": {"$gte": today}},
        {"_id": 0}
    ).sort("event_date", 1).limit(5).to_list(5)
    
    # Members by status
    status_pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_results = await db.members.aggregate(status_pipeline).to_list(10)
    members_by_status = {r['_id']: r['count'] for r in status_results}
    
    # Absent members (mock - would need last_attendance tracking)
    absent_members = []
    
    return {
        "total_members": total_members,
        "total_visitors": total_visitors,
        "total_ministries": total_ministries,
        "total_departments": total_departments,
        "monthly_revenue": total_revenue,
        "upcoming_events": upcoming_events,
        "members_by_status": members_by_status,
        "absent_members": absent_members,
        "growth_percentage": 12.5  # Mock
    }

# ==================== DISCIPLESHIP - TRAILS ====================
@api_router.post("/church/discipleship/trails")
async def create_trail(trail_data: DiscipleshipTrailCreate, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    trail = DiscipleshipTrail(**trail_data.model_dump(), tenant_id=tenant_id)
    doc = trail.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.discipleship_trails.insert_one(doc)
    return trail

@api_router.get("/church/discipleship/trails")
async def list_trails(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    # Get both tenant-specific trails and public trails (tenant_id = "")
    query = {"$or": [{"tenant_id": tenant_id}, {"tenant_id": ""}]} if tenant_id else {}
    trails = await db.discipleship_trails.find(query, {"_id": 0}).to_list(100)
    return trails

@api_router.get("/church/discipleship/trails/{trail_id}")
async def get_trail(trail_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    # Allow access to tenant trails or public trails
    query = {"id": trail_id, "$or": [{"tenant_id": tenant_id}, {"tenant_id": ""}]} if tenant_id else {"id": trail_id}
    
    trail = await db.discipleship_trails.find_one(query, {"_id": 0})
    if not trail:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    return trail

@api_router.put("/church/discipleship/trails/{trail_id}")
async def update_trail(trail_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": trail_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    result = await db.discipleship_trails.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    return {"message": "Trilha atualizada com sucesso"}

@api_router.delete("/church/discipleship/trails/{trail_id}")
async def delete_trail(trail_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": trail_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    result = await db.discipleship_trails.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    return {"message": "Trilha removida com sucesso"}

@api_router.post("/church/discipleship/trails/{trail_id}/steps")
async def add_trail_step(trail_id: str, step_data: TrailStepBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": trail_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    step = TrailStep(**step_data.model_dump())
    result = await db.discipleship_trails.update_one(
        query,
        {"$push": {"steps": step.model_dump()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    return {"message": "Etapa adicionada com sucesso", "step_id": step.id}

# ==================== DISCIPLESHIP - PROGRESS ====================
@api_router.post("/church/discipleship/enroll")
async def enroll_member_in_trail(
    member_id: str,
    trail_id: str,
    mentor_id: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    # Check if already enrolled
    existing = await db.member_trail_progress.find_one({
        "tenant_id": tenant_id,
        "member_id": member_id,
        "trail_id": trail_id,
        "status": {"$ne": "completed"}
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Membro já está inscrito nesta trilha")
    
    progress = MemberTrailProgress(
        member_id=member_id,
        trail_id=trail_id,
        mentor_id=mentor_id,
        tenant_id=tenant_id,
        status=DiscipleshipStatus.IN_PROGRESS,
        started_at=datetime.now(timezone.utc)
    )
    doc = progress.model_dump()
    doc['started_at'] = doc['started_at'].isoformat() if doc['started_at'] else None
    doc['completed_at'] = doc['completed_at'].isoformat() if doc['completed_at'] else None
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.member_trail_progress.insert_one(doc)
    
    return {"message": "Membro inscrito na trilha com sucesso", "progress_id": progress.id}

@api_router.get("/church/discipleship/progress")
async def list_all_progress(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    progress_list = await db.member_trail_progress.find(query, {"_id": 0}).to_list(1000)
    return progress_list

@api_router.get("/church/discipleship/progress/member/{member_id}")
async def get_member_progress(member_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"member_id": member_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    progress_list = await db.member_trail_progress.find(query, {"_id": 0}).to_list(100)
    return progress_list

@api_router.put("/church/discipleship/progress/{progress_id}/complete-step")
async def complete_trail_step(progress_id: str, step_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": progress_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    progress = await db.member_trail_progress.find_one(query, {"_id": 0})
    if not progress:
        raise HTTPException(status_code=404, detail="Progresso não encontrado")
    
    completed_steps = progress.get('completed_steps', [])
    if step_id not in completed_steps:
        completed_steps.append(step_id)
    
    current_step = progress.get('current_step', 0) + 1
    
    await db.member_trail_progress.update_one(
        query,
        {"$set": {
            "completed_steps": completed_steps,
            "current_step": current_step,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Etapa concluída com sucesso", "current_step": current_step}

@api_router.put("/church/discipleship/progress/{progress_id}/complete")
async def complete_trail(progress_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": progress_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    result = await db.member_trail_progress.update_one(
        query,
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Progresso não encontrado")
    
    return {"message": "Trilha concluída com sucesso!"}

# ==================== DISCIPLESHIP - MENTORSHIP ====================
@api_router.post("/church/discipleship/mentorship")
async def create_mentorship(mentorship_data: MentorshipBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    mentorship = Mentorship(**mentorship_data.model_dump(), tenant_id=tenant_id)
    doc = mentorship.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.mentorships.insert_one(doc)
    return mentorship

@api_router.get("/church/discipleship/mentorship")
async def list_mentorships(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    mentorships = await db.mentorships.find(query, {"_id": 0}).to_list(100)
    return mentorships

@api_router.get("/church/discipleship/mentorship/mentor/{mentor_id}")
async def get_mentor_disciples(mentor_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"mentor_id": mentor_id, "is_active": True}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    mentorships = await db.mentorships.find(query, {"_id": 0}).to_list(100)
    return mentorships

@api_router.get("/church/discipleship/stats")
async def get_discipleship_stats(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    total_trails = await db.discipleship_trails.count_documents({"tenant_id": tenant_id})
    total_enrolled = await db.member_trail_progress.count_documents({"tenant_id": tenant_id})
    in_progress = await db.member_trail_progress.count_documents({"tenant_id": tenant_id, "status": "in_progress"})
    completed = await db.member_trail_progress.count_documents({"tenant_id": tenant_id, "status": "completed"})
    total_mentorships = await db.mentorships.count_documents({"tenant_id": tenant_id, "is_active": True})
    
    return {
        "total_trails": total_trails,
        "total_enrolled": total_enrolled,
        "in_progress": in_progress,
        "completed": completed,
        "completion_rate": round((completed / total_enrolled * 100) if total_enrolled > 0 else 0, 1),
        "total_mentorships": total_mentorships
    }


# ==================== MEMBER CATEGORIES ====================
@api_router.post("/church/member-categories")
async def create_member_category(data: MemberCategoryBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    cat = MemberCategory(**data.model_dump(), tenant_id=tenant_id)
    doc = cat.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.member_categories.insert_one(doc)
    return cat

@api_router.get("/church/member-categories")
async def list_member_categories(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    return await db.member_categories.find(query, {"_id": 0}).to_list(100)

@api_router.put("/church/member-categories/{cat_id}")
async def update_member_category(cat_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": cat_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.member_categories.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return {"message": "Categoria atualizada com sucesso"}

@api_router.delete("/church/member-categories/{cat_id}")
async def delete_member_category(cat_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": cat_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.member_categories.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return {"message": "Categoria removida com sucesso"}

# ==================== MEMBER POSITIONS (CARGOS) ====================
@api_router.post("/church/member-positions")
async def create_member_position(data: MemberPositionBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    pos = MemberPosition(**data.model_dump(), tenant_id=tenant_id)
    doc = pos.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.member_positions.insert_one(doc)
    return pos

@api_router.get("/church/member-positions")
async def list_member_positions(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    return await db.member_positions.find(query, {"_id": 0}).sort("hierarchy_level", 1).to_list(100)

@api_router.put("/church/member-positions/{pos_id}")
async def update_member_position(pos_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": pos_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.member_positions.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cargo não encontrado")
    return {"message": "Cargo atualizado com sucesso"}

@api_router.delete("/church/member-positions/{pos_id}")
async def delete_member_position(pos_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": pos_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.member_positions.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cargo não encontrado")
    return {"message": "Cargo removido com sucesso"}

# ==================== CUSTOM FIELDS ====================
@api_router.post("/church/custom-fields")
async def create_custom_field(data: CustomFieldBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    field = CustomField(**data.model_dump(), tenant_id=tenant_id)
    doc = field.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.custom_fields.insert_one(doc)
    return field

@api_router.get("/church/custom-fields")
async def list_custom_fields(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    return await db.custom_fields.find(query, {"_id": 0}).sort("order", 1).to_list(100)

@api_router.put("/church/custom-fields/{field_id}")
async def update_custom_field(field_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": field_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.custom_fields.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campo não encontrado")
    return {"message": "Campo atualizado com sucesso"}

@api_router.delete("/church/custom-fields/{field_id}")
async def delete_custom_field(field_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": field_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.custom_fields.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campo não encontrado")
    return {"message": "Campo removido com sucesso"}

# ==================== MENU PERSONALIZATION ====================
@api_router.get("/church/menu-customization")
async def get_menu_customization(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    items = await db.menu_personalizacoes.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(100)
    return items

@api_router.put("/church/menu-customization")
async def update_menu_customization(items: List[MenuPersonalizationBase], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    for item in items:
        await db.menu_personalizacoes.update_one(
            {"tenant_id": tenant_id, "menu_key": item.menu_key},
            {"$set": {"display_name": item.display_name, "updated_at": datetime.now(timezone.utc).isoformat()},
             "$setOnInsert": {"id": str(uuid.uuid4()), "tenant_id": tenant_id, "menu_key": item.menu_key}},
            upsert=True
        )
    return {"message": "Menus atualizados com sucesso"}

@api_router.post("/seed/discipleship-trails")
async def seed_discipleship_trails():
    """Create default discipleship trails"""
    default_trails = [
        {
            "name": "Primeiros Passos",
            "description": "Trilha para novos convertidos conhecerem os fundamentos da fé",
            "difficulty": "beginner",
            "category": "new_convert",
            "estimated_weeks": 4,
            "steps": [
                {"id": str(uuid.uuid4()), "title": "Quem é Jesus?", "description": "Conhecendo o Salvador", "order": 1, "content_type": "text", "duration_minutes": 30},
                {"id": str(uuid.uuid4()), "title": "A Bíblia", "description": "Entendendo a Palavra de Deus", "order": 2, "content_type": "text", "duration_minutes": 30},
                {"id": str(uuid.uuid4()), "title": "Oração", "description": "Aprendendo a se comunicar com Deus", "order": 3, "content_type": "text", "duration_minutes": 30},
                {"id": str(uuid.uuid4()), "title": "A Igreja", "description": "A importância da comunhão", "order": 4, "content_type": "text", "duration_minutes": 30},
            ]
        },
        {
            "name": "Preparação para o Batismo",
            "description": "Estudo preparatório para o batismo nas águas",
            "difficulty": "beginner",
            "category": "baptism",
            "estimated_weeks": 3,
            "steps": [
                {"id": str(uuid.uuid4()), "title": "O Significado do Batismo", "description": "Por que nos batizamos?", "order": 1, "content_type": "text", "duration_minutes": 45},
                {"id": str(uuid.uuid4()), "title": "Arrependimento e Confissão", "description": "Preparando o coração", "order": 2, "content_type": "text", "duration_minutes": 45},
                {"id": str(uuid.uuid4()), "title": "Nova Vida em Cristo", "description": "O que muda após o batismo", "order": 3, "content_type": "text", "duration_minutes": 45},
            ]
        },
        {
            "name": "Crescimento Espiritual",
            "description": "Aprofundando sua caminhada com Deus",
            "difficulty": "intermediate",
            "category": "spiritual_growth",
            "estimated_weeks": 8,
            "steps": [
                {"id": str(uuid.uuid4()), "title": "Vida Devocional", "description": "Estabelecendo uma rotina com Deus", "order": 1, "content_type": "text", "duration_minutes": 40},
                {"id": str(uuid.uuid4()), "title": "Estudo Bíblico", "description": "Métodos de estudo da Palavra", "order": 2, "content_type": "text", "duration_minutes": 40},
                {"id": str(uuid.uuid4()), "title": "Dons Espirituais", "description": "Descobrindo seus dons", "order": 3, "content_type": "quiz", "duration_minutes": 60},
                {"id": str(uuid.uuid4()), "title": "Servindo na Igreja", "description": "Encontrando seu lugar no corpo", "order": 4, "content_type": "task", "duration_minutes": 30},
            ]
        },
        {
            "name": "Formação de Líderes",
            "description": "Desenvolvendo liderança segundo o coração de Deus",
            "difficulty": "advanced",
            "category": "leadership",
            "estimated_weeks": 12,
            "steps": [
                {"id": str(uuid.uuid4()), "title": "O Líder Servo", "description": "Princípios de liderança bíblica", "order": 1, "content_type": "text", "duration_minutes": 60},
                {"id": str(uuid.uuid4()), "title": "Caráter do Líder", "description": "Integridade e santidade", "order": 2, "content_type": "text", "duration_minutes": 60},
                {"id": str(uuid.uuid4()), "title": "Cuidando de Pessoas", "description": "Pastoreio e aconselhamento", "order": 3, "content_type": "text", "duration_minutes": 60},
                {"id": str(uuid.uuid4()), "title": "Multiplicação", "description": "Formando novos líderes", "order": 4, "content_type": "task", "duration_minutes": 90},
            ]
        },
        {
            "name": "Família Abençoada",
            "description": "Princípios bíblicos para a vida familiar",
            "difficulty": "intermediate",
            "category": "family",
            "estimated_weeks": 6,
            "steps": [
                {"id": str(uuid.uuid4()), "title": "O Plano de Deus para a Família", "description": "Fundamentos bíblicos", "order": 1, "content_type": "text", "duration_minutes": 45},
                {"id": str(uuid.uuid4()), "title": "Casamento Saudável", "description": "Comunicação e amor", "order": 2, "content_type": "text", "duration_minutes": 45},
                {"id": str(uuid.uuid4()), "title": "Educação de Filhos", "description": "Criando na disciplina do Senhor", "order": 3, "content_type": "text", "duration_minutes": 45},
                {"id": str(uuid.uuid4()), "title": "Finanças Familiares", "description": "Mordomia cristã", "order": 4, "content_type": "text", "duration_minutes": 45},
            ]
        }
    ]
    
    # Create trails for a default tenant (or without tenant for public)
    created = 0
    for trail_data in default_trails:
        existing = await db.discipleship_trails.find_one({"name": trail_data["name"], "tenant_id": {"$exists": False}}, {"_id": 0})
        if not existing:
            trail_data["id"] = str(uuid.uuid4())
            trail_data["tenant_id"] = ""  # Public trails
            trail_data["is_active"] = True
            trail_data["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.discipleship_trails.insert_one(trail_data)
            created += 1
    
    return {"message": f"{created} trilhas de discipulado criadas com sucesso"}

# ==================== COMMUNICATION ====================
@api_router.post("/church/communication/send")
async def send_communication(
    channel: str,
    recipient_ids: List[str],
    message: str,
    subject: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    # Log the communication (actual sending would require Twilio integration)
    comm_log = CommunicationLog(
        tenant_id=tenant_id,
        channel=channel,
        recipient_ids=recipient_ids,
        subject=subject,
        message=message,
        status="queued"  # In production, this would be updated after actual sending
    )
    doc = comm_log.model_dump()
    doc['sent_at'] = doc['sent_at'].isoformat()
    await db.communications.insert_one(doc)
    
    return {"message": f"Comunicação agendada via {channel}", "log_id": comm_log.id}

@api_router.get("/church/communication/history")
async def get_communication_history(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    history = await db.communications.find(query, {"_id": 0}).sort("sent_at", -1).limit(50).to_list(50)
    return history

# ==================== STRIPE PAYMENT ====================
@api_router.post("/payments/checkout")
async def create_checkout_session(
    request: Request,
    plan_type: str,
    billing_cycle: str = "monthly",
    current_user: dict = Depends(get_current_user)
):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    api_key = os.environ.get('STRIPE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe não configurado")
    
    # Define plan prices
    plan_prices = {
        "essential": {"monthly": 97.00, "yearly": 931.20},
        "strategic": {"monthly": 197.00, "yearly": 1891.20},
        "apostolic": {"monthly": 397.00, "yearly": 3811.20},
        "enterprise": {"monthly": 997.00, "yearly": 9571.20}
    }
    
    if plan_type not in plan_prices:
        raise HTTPException(status_code=400, detail="Plano inválido")
    
    amount = plan_prices[plan_type][billing_cycle]
    
    # Get origin from request
    origin = request.headers.get("origin", str(request.base_url).rstrip("/"))
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing"
    
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="brl",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": current_user['user_id'],
            "plan_type": plan_type,
            "billing_cycle": billing_cycle
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Store transaction
    transaction = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": current_user['user_id'],
        "amount": amount,
        "currency": "brl",
        "plan_type": plan_type,
        "billing_cycle": billing_cycle,
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": status.payment_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "event_type": webhook_response.event_type,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ==================== BIRTHDAY GREETINGS ====================
@api_router.get("/church/birthday-greetings/template")
async def get_birthday_template(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    template = await db.birthday_templates.find_one({"tenant_id": tenant_id}, {"_id": 0})
    if not template:
        return {
            "tenant_id": tenant_id,
            "message_template": "Feliz aniversário, {nome}! A igreja {igreja} deseja a você um dia cheio de bençãos e alegria. Que Deus continue abençoando sua vida!",
            "channel": "email",
            "subject": "Feliz Aniversário! - Igreja Firmes",
            "auto_send": False,
        }
    return template

@api_router.put("/church/birthday-greetings/template")
async def update_birthday_template(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    await db.birthday_templates.update_one(
        {"tenant_id": tenant_id},
        {"$set": {
            "message_template": data.get("message_template", ""),
            "channel": data.get("channel", "email"),
            "subject": data.get("subject", ""),
            "auto_send": data.get("auto_send", False),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        "$setOnInsert": {"id": str(uuid.uuid4()), "tenant_id": tenant_id}},
        upsert=True
    )
    return {"message": "Template atualizado com sucesso"}

@api_router.get("/church/birthday-greetings/status")
async def get_birthday_greeting_status(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    sent = await db.birthday_greetings_log.find(
        {"tenant_id": tenant_id, "sent_date": today}, {"_id": 0}
    ).to_list(500)
    sent_member_ids = [s["member_id"] for s in sent]
    return {"sent_date": today, "sent_member_ids": sent_member_ids}

@api_router.post("/church/birthday-greetings/send")
async def send_birthday_greetings(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")

    # Get template
    template = await db.birthday_templates.find_one({"tenant_id": tenant_id}, {"_id": 0})
    msg_template = template.get("message_template", "Feliz aniversário, {nome}!") if template else "Feliz aniversário, {nome}! A igreja deseja a você um dia abençoado!"
    channel = template.get("channel", "email") if template else "email"
    subject = template.get("subject", "Feliz Aniversário!") if template else "Feliz Aniversário!"

    # Get tenant name
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0, "name": 1})
    church_name = tenant.get("name", "Firmes") if tenant else "Firmes"

    # Get today's birthday members
    today = datetime.now(timezone.utc)
    today_str = today.strftime("%Y-%m-%d")
    today_md = today.strftime("%m-%d")
    query = {"tenant_id": tenant_id, "birth_date": {"$exists": True, "$ne": None, "$ne": ""}}
    members = await db.members.find(query, {"_id": 0}).to_list(5000)

    birthday_members = []
    for m in members:
        bd = m.get("birth_date", "")
        if bd and bd.endswith(today_md):
            birthday_members.append(m)

    if not birthday_members:
        return {"message": "Nenhum aniversariante hoje", "sent_count": 0}

    # Check already sent
    already_sent = await db.birthday_greetings_log.find(
        {"tenant_id": tenant_id, "sent_date": today_str}, {"_id": 0, "member_id": 1}
    ).to_list(500)
    already_sent_ids = {s["member_id"] for s in already_sent}

    sent_count = 0
    for member in birthday_members:
        if member["id"] in already_sent_ids:
            continue

        personalized_msg = msg_template.replace("{nome}", member.get("name", "")).replace("{igreja}", church_name)

        # Log to communications (same as existing system)
        comm_log = CommunicationLog(
            tenant_id=tenant_id,
            channel=channel,
            recipient_ids=[member["id"]],
            subject=subject,
            message=personalized_msg,
            status="sent"
        )
        doc = comm_log.model_dump()
        doc['sent_at'] = doc['sent_at'].isoformat()
        doc['is_birthday_greeting'] = True
        await db.communications.insert_one(doc)

        # Log to birthday greetings
        await db.birthday_greetings_log.insert_one({
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "member_id": member["id"],
            "member_name": member.get("name", ""),
            "sent_date": today_str,
            "channel": channel,
            "sent_at": datetime.now(timezone.utc).isoformat(),
        })
        sent_count += 1

    return {"message": f"Parabéns enviado para {sent_count} aniversariante(s)!", "sent_count": sent_count}

# ==================== SEED DATA ====================
@api_router.post("/seed/super-admin")
async def seed_super_admin():
    """Create initial super admin user"""
    existing = await db.users.find_one({"email": "admin@firmes.com"}, {"_id": 0})
    if existing:
        return {"message": "Super Admin já existe", "email": "admin@firmes.com"}
    
    admin = User(
        email="admin@firmes.com",
        name="Super Admin",
        role=UserRole.SUPER_ADMIN
    )
    doc = admin.model_dump()
    doc['password_hash'] = hash_password("admin123")
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return {"message": "Super Admin criado", "email": "admin@firmes.com", "password": "admin123"}

@api_router.post("/seed/plans")
async def seed_plans():
    """Create default plans"""
    plans_data = [
        {"name": "Essencial", "type": "essential", "price_monthly": 97.0, "price_yearly": 931.2, "member_limit": 100,
         "features": ["Até 100 membros", "Dashboard básico", "Gestão de membros", "Eventos", "Relatórios básicos"]},
        {"name": "Estratégico", "type": "strategic", "price_monthly": 197.0, "price_yearly": 1891.2, "member_limit": 500,
         "features": ["Até 500 membros", "Dashboard completo", "Todos os módulos", "Comunicação SMS/Email", "Relatórios avançados", "Suporte prioritário"]},
        {"name": "Apostólico", "type": "apostolic", "price_monthly": 397.0, "price_yearly": 3811.2, "member_limit": 2000,
         "features": ["Até 2000 membros", "Dashboard inteligente", "Todos os módulos", "WhatsApp integrado", "Automações", "API access", "White label"]},
        {"name": "Enterprise", "type": "enterprise", "price_monthly": 997.0, "price_yearly": 9571.2, "member_limit": 999999,
         "features": ["Membros ilimitados", "Tudo do Apostólico", "Múltiplas unidades", "Suporte dedicado", "Customizações", "SLA garantido"]}
    ]
    
    for plan_data in plans_data:
        existing = await db.plans.find_one({"type": plan_data["type"]}, {"_id": 0})
        if not existing:
            plan = Plan(**plan_data)
            doc = plan.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.plans.insert_one(doc)
    
    return {"message": "Planos criados com sucesso"}

# ==================== CHURCH ADMIN - ESTUDOS (STUDIES) ====================
@api_router.post("/church/estudos")
async def create_estudo(data: EstudoBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    estudo = Estudo(**data.model_dump(), tenant_id=tenant_id)
    doc = estudo.model_dump()
    doc['data_criacao'] = doc['data_criacao'].isoformat()
    await db.estudos.insert_one(doc)
    return estudo

@api_router.get("/church/estudos")
async def list_estudos(
    status: Optional[str] = None,
    nivel: Optional[str] = None,
    escola_id: Optional[str] = None,
    turma_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_church_admin),
):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    if status and status != "all":
        query["status"] = status
    if nivel and nivel != "all":
        query["nivel"] = nivel
    if escola_id:
        query["escola_id"] = escola_id
    if turma_id:
        query["turma_id"] = turma_id
    if search:
        query["titulo"] = {"$regex": search, "$options": "i"}
    estudos = await db.estudos.find(query, {"_id": 0}).sort("data_criacao", -1).to_list(500)
    # Enrich with escola and turma names
    for e in estudos:
        if e.get("escola_id"):
            escola = await db.escolas.find_one({"id": e["escola_id"]}, {"_id": 0, "nome": 1})
            e["escola_nome"] = escola["nome"] if escola else None
        if e.get("turma_id"):
            turma = await db.turmas.find_one({"id": e["turma_id"]}, {"_id": 0, "nome": 1})
            e["turma_nome"] = turma["nome"] if turma else None
    return estudos

@api_router.get("/church/estudos/{estudo_id}")
async def get_estudo(estudo_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": estudo_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    estudo = await db.estudos.find_one(query, {"_id": 0})
    if not estudo:
        raise HTTPException(status_code=404, detail="Estudo não encontrado")
    if estudo.get("escola_id"):
        escola = await db.escolas.find_one({"id": estudo["escola_id"]}, {"_id": 0, "nome": 1})
        estudo["escola_nome"] = escola["nome"] if escola else None
    if estudo.get("turma_id"):
        turma = await db.turmas.find_one({"id": estudo["turma_id"]}, {"_id": 0, "nome": 1})
        estudo["turma_nome"] = turma["nome"] if turma else None
    return estudo

@api_router.put("/church/estudos/{estudo_id}")
async def update_estudo(estudo_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": estudo_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.estudos.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Estudo não encontrado")
    return {"message": "Estudo atualizado"}

@api_router.delete("/church/estudos/{estudo_id}")
async def delete_estudo(estudo_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": estudo_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.estudos.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Estudo não encontrado")
    await db.progresso_ensino.delete_many({"estudo_id": estudo_id})
    return {"message": "Estudo removido"}


# ==================== CHURCH ADMIN - ESCOLAS (SCHOOLS) ====================
@api_router.post("/church/escolas")
async def create_escola(data: EscolaBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    escola = Escola(**data.model_dump(), tenant_id=tenant_id)
    doc = escola.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.escolas.insert_one(doc)
    return escola

@api_router.get("/church/escolas")
async def list_escolas(
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_church_admin),
):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    if status and status != "all":
        query["status"] = status
    if search:
        query["nome"] = {"$regex": search, "$options": "i"}
    escolas = await db.escolas.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    for e in escolas:
        if e.get("responsavel_id"):
            member = await db.members.find_one({"id": e["responsavel_id"]}, {"_id": 0, "name": 1})
            e["responsavel_nome"] = member["name"] if member else None
        if e.get("departamento_id"):
            dept = await db.departments.find_one({"id": e["departamento_id"]}, {"_id": 0, "name": 1})
            e["departamento_nome"] = dept["name"] if dept else None
        turma_count = await db.turmas.count_documents({"escola_id": e["id"], "tenant_id": tenant_id} if tenant_id else {"escola_id": e["id"]})
        e["turma_count"] = turma_count
    return escolas

@api_router.get("/church/escolas/{escola_id}")
async def get_escola(escola_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": escola_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    escola = await db.escolas.find_one(query, {"_id": 0})
    if not escola:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    if escola.get("responsavel_id"):
        member = await db.members.find_one({"id": escola["responsavel_id"]}, {"_id": 0, "name": 1})
        escola["responsavel_nome"] = member["name"] if member else None
    if escola.get("departamento_id"):
        dept = await db.departments.find_one({"id": escola["departamento_id"]}, {"_id": 0, "name": 1})
        escola["departamento_nome"] = dept["name"] if dept else None
    turmas = await db.turmas.find({"escola_id": escola_id, "tenant_id": tenant_id} if tenant_id else {"escola_id": escola_id}, {"_id": 0}).to_list(200)
    escola["turmas"] = turmas
    estudos = await db.estudos.find({"escola_id": escola_id, "tenant_id": tenant_id} if tenant_id else {"escola_id": escola_id}, {"_id": 0}).to_list(500)
    escola["estudos"] = estudos
    return escola

@api_router.put("/church/escolas/{escola_id}")
async def update_escola(escola_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": escola_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.escolas.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    return {"message": "Escola atualizada"}

@api_router.delete("/church/escolas/{escola_id}")
async def delete_escola(escola_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": escola_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.escolas.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    return {"message": "Escola removida"}


# ==================== CHURCH ADMIN - TURMAS (CLASSES) ====================
@api_router.post("/church/turmas")
async def create_turma(data: TurmaBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    turma = Turma(**data.model_dump(), tenant_id=tenant_id)
    doc = turma.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.turmas.insert_one(doc)
    return turma

@api_router.get("/church/turmas")
async def list_turmas(
    status: Optional[str] = None,
    escola_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_church_admin),
):
    tenant_id = current_user.get('tenant_id')
    query = {"tenant_id": tenant_id} if tenant_id else {}
    if status and status != "all":
        query["status"] = status
    if escola_id:
        query["escola_id"] = escola_id
    if search:
        query["nome"] = {"$regex": search, "$options": "i"}
    turmas = await db.turmas.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    for t in turmas:
        member_count = await db.turma_membros.count_documents({"turma_id": t["id"]})
        t["aluno_count"] = member_count
        if t.get("escola_id"):
            escola = await db.escolas.find_one({"id": t["escola_id"]}, {"_id": 0, "nome": 1})
            t["escola_nome"] = escola["nome"] if escola else None
        if t.get("professor_id"):
            prof = await db.members.find_one({"id": t["professor_id"]}, {"_id": 0, "name": 1})
            t["professor_nome"] = prof["name"] if prof else None
    return turmas

@api_router.get("/church/turmas/{turma_id}")
async def get_turma(turma_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": turma_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    turma = await db.turmas.find_one(query, {"_id": 0})
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    if turma.get("escola_id"):
        escola = await db.escolas.find_one({"id": turma["escola_id"]}, {"_id": 0, "nome": 1})
        turma["escola_nome"] = escola["nome"] if escola else None
    if turma.get("professor_id"):
        prof = await db.members.find_one({"id": turma["professor_id"]}, {"_id": 0, "name": 1})
        turma["professor_nome"] = prof["name"] if prof else None
    links = await db.turma_membros.find({"turma_id": turma_id}, {"_id": 0}).to_list(2000)
    members = []
    for link in links:
        member = await db.members.find_one({"id": link["membro_id"]}, {"_id": 0})
        if member:
            member["data_entrada"] = link.get("data_entrada")
            members.append(member)
    turma["alunos"] = members
    turma["aluno_count"] = len(members)
    estudos = await db.estudos.find({"turma_id": turma_id, "tenant_id": tenant_id} if tenant_id else {"turma_id": turma_id}, {"_id": 0}).to_list(500)
    turma["estudos"] = estudos
    return turma

@api_router.put("/church/turmas/{turma_id}")
async def update_turma(turma_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": turma_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.turmas.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return {"message": "Turma atualizada"}

@api_router.delete("/church/turmas/{turma_id}")
async def delete_turma(turma_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": turma_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.turmas.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    await db.turma_membros.delete_many({"turma_id": turma_id})
    await db.progresso_ensino.delete_many({"turma_id": turma_id})
    return {"message": "Turma removida"}

@api_router.post("/church/turmas/{turma_id}/membros")
async def add_turma_membros(turma_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    member_ids = data.get("member_ids", [])
    if not member_ids:
        raise HTTPException(status_code=400, detail="Lista de membros vazia")
    turma = await db.turmas.find_one({"id": turma_id}, {"_id": 0})
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    added = 0
    for mid in member_ids:
        existing = await db.turma_membros.find_one({"turma_id": turma_id, "membro_id": mid})
        if not existing:
            link = TurmaMembroLink(turma_id=turma_id, membro_id=mid, tenant_id=tenant_id or "")
            doc = link.model_dump()
            doc['data_entrada'] = doc['data_entrada'].isoformat()
            await db.turma_membros.insert_one(doc)
            added += 1
    return {"message": f"{added} aluno(s) adicionado(s)", "added": added}

@api_router.delete("/church/turmas/{turma_id}/membros/{member_id}")
async def remove_turma_membro(turma_id: str, member_id: str, current_user: dict = Depends(require_church_admin)):
    result = await db.turma_membros.delete_one({"turma_id": turma_id, "membro_id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Membro não encontrado nesta turma")
    return {"message": "Aluno removido da turma"}


# ==================== CHURCH ADMIN - PROGRESSO ENSINO ====================
@api_router.post("/church/progresso-ensino")
async def create_progresso(data: ProgressoEnsinoBase, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    progresso = ProgressoEnsino(**data.model_dump(), tenant_id=tenant_id)
    doc = progresso.model_dump()
    doc['data_atualizacao'] = doc['data_atualizacao'].isoformat()
    await db.progresso_ensino.insert_one(doc)
    return progresso

@api_router.get("/church/progresso-ensino/membro/{member_id}")
async def get_progresso_membro(member_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"membro_id": member_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    progressos = await db.progresso_ensino.find(query, {"_id": 0}).to_list(500)
    for p in progressos:
        if p.get("turma_id"):
            turma = await db.turmas.find_one({"id": p["turma_id"]}, {"_id": 0, "nome": 1})
            p["turma_nome"] = turma["nome"] if turma else None
        if p.get("estudo_id"):
            estudo = await db.estudos.find_one({"id": p["estudo_id"]}, {"_id": 0, "titulo": 1})
            p["estudo_titulo"] = estudo["titulo"] if estudo else None
    member = await db.members.find_one({"id": member_id}, {"_id": 0})
    turma_links = await db.turma_membros.find({"membro_id": member_id}, {"_id": 0}).to_list(100)
    turmas = []
    for link in turma_links:
        t = await db.turmas.find_one({"id": link["turma_id"]}, {"_id": 0, "nome": 1, "status": 1})
        if t:
            turmas.append(t)
    return {"member": member, "progressos": progressos, "turmas": turmas}

@api_router.put("/church/progresso-ensino/{progresso_id}")
async def update_progresso(progresso_id: str, updates: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": progresso_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    updates["data_atualizacao"] = datetime.now(timezone.utc).isoformat()
    result = await db.progresso_ensino.update_one(query, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Progresso não encontrado")
    return {"message": "Progresso atualizado"}

@api_router.delete("/church/progresso-ensino/{progresso_id}")
async def delete_progresso(progresso_id: str, current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": progresso_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.progresso_ensino.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Progresso não encontrado")
    return {"message": "Progresso removido"}


# ==================== CHURCH ADMIN - PAINEL ACADEMICO ====================
@api_router.get("/church/ensino/painel-academico")
async def get_painel_academico(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    tq = {"tenant_id": tenant_id} if tenant_id else {}
    total_escolas = await db.escolas.count_documents({**tq, "status": "active"})
    total_turmas = await db.turmas.count_documents({**tq, "status": "active"})
    total_turmas_concluidas = await db.turmas.count_documents({**tq, "status": "completed"})
    total_estudos = await db.estudos.count_documents({**tq, "status": "active"})
    total_alunos = len(await db.turma_membros.distinct("membro_id", tq if tq else {}))
    total_progresso = await db.progresso_ensino.count_documents(tq)
    total_concluidos = await db.progresso_ensino.count_documents({**tq, "status": "concluido"})
    taxa_conclusao = round((total_concluidos / total_progresso * 100), 1) if total_progresso > 0 else 0
    escolas = await db.escolas.find({**tq, "status": "active"}, {"_id": 0, "id": 1, "nome": 1}).to_list(100)
    escola_stats = []
    for e in escolas:
        tc = await db.turmas.count_documents({"escola_id": e["id"]})
        escola_stats.append({"nome": e["nome"], "turmas": tc})
    turmas = await db.turmas.find(tq, {"_id": 0, "id": 1, "nome": 1}).to_list(200)
    turma_ranking = []
    for t in turmas:
        ac = await db.turma_membros.count_documents({"turma_id": t["id"]})
        turma_ranking.append({"id": t["id"], "nome": t["nome"], "aluno_count": ac})
    turma_ranking.sort(key=lambda x: x["aluno_count"], reverse=True)
    by_nivel = {}
    for nivel in ["basico", "intermediario", "avancado"]:
        c = await db.estudos.count_documents({**tq, "nivel": nivel})
        if c > 0:
            by_nivel[nivel] = c
    return {
        "total_escolas": total_escolas,
        "total_turmas": total_turmas,
        "total_turmas_concluidas": total_turmas_concluidas,
        "total_estudos": total_estudos,
        "total_alunos": total_alunos,
        "taxa_conclusao": taxa_conclusao,
        "total_progresso": total_progresso,
        "total_concluidos": total_concluidos,
        "escola_stats": escola_stats,
        "turma_ranking": turma_ranking[:10],
        "by_nivel": by_nivel,
    }


# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
