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

app = FastAPI(title="Firmes na Fé - Church Management SaaS")
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
    status: MemberStatus = MemberStatus.VISITOR
    baptism_date: Optional[str] = None
    conversion_date: Optional[str] = None
    family_id: Optional[str] = None
    ministry_ids: List[str] = []
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
    return {"message": "Firmes na Fé - API", "version": "1.0.0"}

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
async def list_members(current_user: dict = Depends(require_church_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id and current_user.get('role') != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Tenant ID não encontrado")
    
    query = {"tenant_id": tenant_id} if tenant_id else {}
    members = await db.members.find(query, {"_id": 0}).to_list(1000)
    return members

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

# ==================== SEED DATA ====================
@api_router.post("/seed/super-admin")
async def seed_super_admin():
    """Create initial super admin user"""
    existing = await db.users.find_one({"email": "admin@firmesnafe.com"}, {"_id": 0})
    if existing:
        return {"message": "Super Admin já existe", "email": "admin@firmesnafe.com"}
    
    admin = User(
        email="admin@firmesnafe.com",
        name="Super Admin",
        role=UserRole.SUPER_ADMIN
    )
    doc = admin.model_dump()
    doc['password_hash'] = hash_password("admin123")
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return {"message": "Super Admin criado", "email": "admin@firmesnafe.com", "password": "admin123"}

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
