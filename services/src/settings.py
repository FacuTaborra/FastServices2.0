"""
Configuración de la aplicación FastServices.
Gestiona variables de entorno y configuraciones de base de datos y JWT.
"""

import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Configuración de base de datos MySQL
DB_USER = os.getenv("DB_USER", "fs_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Fs_user2*+")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3307")
DB_NAME = os.getenv("DB_NAME", "fastservices")

# Connection string con driver asíncrono para SQLAlchemy
CONNECTION_STRING = os.getenv(
    "CONNECTION_STRING",
    f"mysql+aiomysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4",
)

# Configuración JWT para autenticación
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "MUY_SECRETO_CAMBIAR_EN_PRODUCCION")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Configuración de logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Debug mode (solo para desarrollo)
DEBUG_MODE = os.getenv("DEBUG", "false").lower() == "true"

# Configuración MinIO S3
S3_ENDPOINT = os.getenv("S3_ENDPOINT")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_REGION = os.getenv("S3_REGION", "us-east-1")

# URL pública base para las imágenes
S3_PUBLIC_URL_BASE = os.getenv("S3_PUBLIC_URL_BASE", f"{S3_ENDPOINT}/{S3_BUCKET_NAME}")
