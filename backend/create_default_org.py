import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.models.saas_models import Organizacao, OrganizacaoStatus
import uuid

async def create_default_organization():
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client[settings.DB_NAME]

    # Check if an organization already exists
    existing_org = await db.organizacoes.find_one()
    if existing_org:
        print("Uma organização já existe. Pulando a criação da organização padrão.")
        return

    # Create a default organization
    organizacao_id = str(uuid.uuid4())
    default_org = Organizacao(
        id=organizacao_id,
        organizacao_id=organizacao_id, # Explicitly set organizacao_id for the organization itself
        nome="Organização Padrão",
        slug="organizacao-padrao",
        status=OrganizacaoStatus.ATIVA
    )
    await db.organizacoes.insert_one(default_org.model_dump())
    print(f"Organização padrão criada com ID: {organizacao_id}")

    # Create a default user for this organization
    user_id = str(uuid.uuid4())
    from app.core.security import hash_password, UserRole
    default_user = {
        "id": user_id,
        "email": "admin@padrao.com",
        "password": hash_password("password"),
        "name": "Admin Padrão",
        "role": UserRole.ADMIN_CHURCH,
        "organizacao_id": organizacao_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(default_user)
    print(f"Usuário padrão criado para a organização padrão: {default_user['email']}")

    client.close()

if __name__ == "__main__":
    asyncio.run(create_default_organization())
