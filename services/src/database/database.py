from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncAttrs,
    AsyncSession,
)
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator
import settings


class Base(AsyncAttrs, DeclarativeBase):
    pass


engine = create_async_engine(settings.CONNECTION_STRING, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Función generadora para obtener una sesión de base de datos.
    Se usa como dependencia en FastAPI para inyectar la sesión en los endpoints.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
