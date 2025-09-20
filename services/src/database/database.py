from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncAttrs
from sqlalchemy.orm import DeclarativeBase
import settings


class Base(AsyncAttrs, DeclarativeBase):
    pass


engine = create_async_engine(settings.CONNECTION_STRING, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
