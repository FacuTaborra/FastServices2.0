"""
Modelo de Usuario para FastServices.
Define la estructura del usuario y sus esquemas de validación.
"""

from datetime import datetime
from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, func
from pydantic import BaseModel, EmailStr, Field
from database.database import Base
import enum


class UserRole(enum.Enum):
    """Enum para los roles de usuario disponibles."""

    CLIENT = "client"
    PROVIDER = "provider"
    ADMIN = "admin"


class User(Base):
    """
    Modelo SQLAlchemy para la tabla users.

    Representa un usuario del sistema con información básica
    y roles para diferenciar entre clientes, proveedores y administradores.
    """

    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    role = Column(String(20), nullable=False, default="client")
    first_name = Column(String(60), nullable=False)
    last_name = Column(String(60), nullable=False)
    email = Column(String(120), nullable=False, unique=True, index=True)
    phone = Column(String(30), nullable=False, unique=True)
    password_hash = Column(String(60), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(
        DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp()
    )

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"


# Esquemas Pydantic para validación y serialización


class LoginRequest(BaseModel):
    """Esquema para request de login."""

    email: EmailStr
    password: str = Field(..., min_length=6)


class UserCreate(BaseModel):
    """Esquema para creación de usuario."""

    role: UserRole = UserRole.CLIENT
    first_name: str = Field(..., min_length=2, max_length=60)
    last_name: str = Field(..., min_length=2, max_length=60)
    email: EmailStr
    phone: str = Field(..., min_length=8, max_length=30)
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    """Esquema para respuesta de usuario (sin información sensible)."""

    id: int
    role: str
    first_name: str
    last_name: str
    email: str
    phone: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserInDB(BaseModel):
    """Esquema para usuario con password hasheado (uso interno)."""

    id: int
    email: str
    password_hash: str
    is_active: bool
    role: str

    class Config:
        from_attributes = True
