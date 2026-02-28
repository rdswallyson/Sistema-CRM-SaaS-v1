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
