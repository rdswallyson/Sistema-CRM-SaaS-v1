import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent.parent
load_dotenv(ROOT_DIR / '.env')

class Settings:
    PROJECT_NAME: str = "Firmes - Church Management SaaS"
    API_V1_STR: str = "/api"
    
    MONGO_URL: str = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    DB_NAME: str = os.environ.get('DB_NAME', 'firmes_saas')
    
    JWT_SECRET: str = os.environ.get('JWT_SECRET', 'default-secret-key')
    JWT_ALGORITHM: str = os.environ.get('JWT_ALGORITHM', 'HS256')
    JWT_EXPIRATION_HOURS: int = int(os.environ.get("JWT_EXPIRATION_HOURS", 24))
    JWT_REFRESH_EXPIRATION_DAYS: int = int(os.environ.get("JWT_REFRESH_EXPIRATION_DAYS", 7))
    
    CORS_ORIGINS: list = os.environ.get('CORS_ORIGINS', '*').split(',')

settings = Settings()
