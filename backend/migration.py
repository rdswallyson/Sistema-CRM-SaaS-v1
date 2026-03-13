import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def migrate_data():
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client[settings.DB_NAME]

    # Get the first organization to associate existing data with
    # In a real scenario, you might have a more complex logic to map data to organizations
    organizacao = await db.organizacoes.find_one()
    if not organizacao:
        print("Nenhuma organização encontrada. Crie uma organização antes de executar a migração.")
        return

    organizacao_id = organizacao["id"]

    collections_to_migrate = [
        "members",
        "departments",
        "groups",
        "teaching",
        "financial",
        "agenda",
        "external_events",
        "media",
        "patrimony",
        "support",
        "custom_fields",
        "digital_cards",
        "position_history",
        "menu_personalizations",
        "users",
        "tenants" # This will be replaced by organizacoes
    ]

    for collection_name in collections_to_migrate:
        collection = db.get_collection(collection_name)
        result = await collection.update_many(
            {"organizacao_id": {"$exists": False}},
            {"$set": {"organizacao_id": organizacao_id}}
        )
        print(f"Coleção '{collection_name}': {result.modified_count} documentos migrados.")

    print("Migração de dados concluída.")

if __name__ == "__main__":
    asyncio.run(migrate_data())
