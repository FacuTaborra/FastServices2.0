"""
Configuración de entorno para Alembic.
Este archivo conecta Alembic con tu configuración de SQLAlchemy.
"""

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, create_engine
from alembic import context
import sys
import os

# Agregar el directorio src al path para importar módulos
current_path = os.path.dirname(os.path.abspath(__file__))
parent_path = os.path.dirname(current_path)
sys.path.append(parent_path)

# Importar configuración y base de SQLAlchemy
import settings
from database.database import Base

# ¡IMPORTANTE! Importar TODOS los modelos aquí para que Alembic los detecte
from models.User import User
from models.Address import Address
from models.ProviderProfile import ProviderProfile
# 🚨 Cuando crees nuevos modelos, agrégalos aquí

# this is the Alembic Config object
config = context.config

# Configurar la URL de conexión dinámicamente
config.set_main_option("sqlalchemy.url", settings.CONNECTION_STRING)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """
    Ejecutar migraciones en modo 'offline'.

    Esto configura el contexto con solo una URL
    y no un Engine, aunque un Engine también es aceptable aquí.
    Saltándose la creación del Engine, ni siquiera necesitamos un DBAPI disponible.
    Las llamadas a context.execute() aquí emiten las declaraciones DDL dadas
    al script de salida.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,  # Detectar cambios en tipos de columnas
        compare_server_default=True,  # Detectar cambios en valores por defecto
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Ejecutar migraciones en modo 'online'.

    En este escenario necesitamos crear un Engine
    y asociar una conexión con el contexto.
    """

    # Crear engine síncrono para Alembic (Alembic no soporta async aún)
    connectable = create_engine(
        settings.CONNECTION_STRING.replace(
            "+aiomysql", "+pymysql"
        ),  # Usar pymysql para sincronía
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,  # Detectar cambios en tipos de columnas
            compare_server_default=True,  # Detectar cambios en valores por defecto
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
