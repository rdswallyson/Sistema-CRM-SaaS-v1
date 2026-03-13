from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client = AsyncIOMotorClient(settings.MONGO_URL)
db = client[settings.DB_NAME]

# SaaS Collections
db.organizacoes = db.get_collection("organizacoes")
db.planos = db.get_collection("planos")
db.assinaturas = db.get_collection("assinaturas")
db.configuracoes_white_label = db.get_collection("configuracoes_white_label")
db.filiais = db.get_collection("filiais")
db.usuarios_master = db.get_collection("usuarios_master")
db.logs_acesso_master = db.get_collection("logs_acesso_master")

# Existing Collections (ensure organizacao_id is present)
db.members = db.get_collection("members")
db.departments = db.get_collection("departments")
db.groups = db.get_collection("groups")
db.teaching = db.get_collection("teaching")
db.financial = db.get_collection("financial")
db.agenda = db.get_collection("agenda")
db.external_events = db.get_collection("external_events")
db.media = db.get_collection("media")
db.patrimony = db.get_collection("patrimony")
db.support = db.get_collection("support")
db.custom_fields = db.get_collection("custom_fields")
db.digital_cards = db.get_collection("digital_cards")
db.position_history = db.get_collection("position_history")
db.menu_personalizations = db.get_collection("menu_personalizations")
db.users = db.get_collection("users")
db.tenants = db.get_collection("tenants") # This will be replaced by organizacoes

async def close_db_connection():
    client.close()
