"""
Modelo de Usuario para FastServices.
Define la estructura del usuario y sus esquemas de validación.
"""

from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Boolean,
    DateTime,
    Date,
    func,
    Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from pydantic import BaseModel, EmailStr, Field, field_validator
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
    role = Column(
        SAEnum(UserRole, name="user_role"), nullable=False, default=UserRole.CLIENT
    )
    first_name = Column(String(60), nullable=False)
    last_name = Column(String(60), nullable=False)
    email = Column(String(120), nullable=False, unique=True, index=True)
    phone = Column(String(30), nullable=False, unique=True)
    date_of_birth = Column(Date, nullable=True)
    password_hash = Column(String(60), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    # Campos para imagen de perfil (integración con S3)
    profile_image_s3_key = Column(
        String(255), nullable=True, comment="Clave S3 de la imagen de perfil"
    )
    profile_image_url = Column(
        String(500), nullable=True, comment="URL pública de la imagen de perfil"
    )
    profile_image_uploaded_at = Column(
        DateTime, nullable=True, comment="Fecha de subida de la imagen"
    )

    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(
        DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp()
    )

    # Relaciones
    provider_profile = relationship(
        "ProviderProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    addresses = relationship(
        "Address",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="Address.is_default.desc(), Address.created_at.asc()",
    )
    service_requests = relationship(
        "ServiceRequest",
        back_populates="client",
        cascade="all, delete-orphan",
        foreign_keys="ServiceRequest.client_id",
    )
    services_as_client = relationship(
        "Service",
        back_populates="client",
        cascade="all, delete-orphan",
        foreign_keys="Service.client_id",
    )
    validated_inferences = relationship(
        "RequestInferredLicense",
        back_populates="validated_by_user",
        foreign_keys="RequestInferredLicense.validated_by",
        passive_deletes=True,
    )
    service_reviews_authored = relationship(
        "ServiceReview",
        back_populates="rater",
        foreign_keys="ServiceReview.rater_user_id",
        passive_deletes=True,
    )
    service_status_changes = relationship(
        "ServiceStatusHistory",
        back_populates="changed_by_user",
        foreign_keys="ServiceStatusHistory.changed_by",
        passive_deletes=True,
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
    date_of_birth: Optional[date] = Field(None, description="Fecha de nacimiento")
    password: str = Field(..., min_length=6)

    @field_validator("date_of_birth")
    @classmethod
    def validate_age(cls, v):
        if v is not None:
            today = date.today()
            age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
            if age < 18:
                raise ValueError("Debes ser mayor de 18 años para registrarte")
        return v


class UserResponse(BaseModel):
    """Esquema para respuesta de usuario (sin información sensible)."""

    id: int
    role: str
    first_name: str
    last_name: str
    email: str
    phone: str
    date_of_birth: Optional[date]
    is_active: bool

    # Campos de imagen de perfil
    profile_image_s3_key: Optional[str]
    profile_image_url: Optional[str]
    profile_image_uploaded_at: Optional[datetime]

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


class UserUpdate(BaseModel):
    """Esquema para actualización de datos de usuario."""

    first_name: Optional[str] = Field(
        None, min_length=2, max_length=60, description="Nombre del usuario"
    )
    last_name: Optional[str] = Field(
        None, min_length=2, max_length=60, description="Apellido del usuario"
    )
    phone: Optional[str] = Field(
        None, min_length=8, max_length=30, description="Teléfono del usuario"
    )
    date_of_birth: Optional[date] = Field(None, description="Fecha de nacimiento")

    # Campos de imagen de perfil
    profile_image_s3_key: Optional[str] = Field(
        None, description="Clave S3 de imagen de perfil"
    )
    profile_image_url: Optional[str] = Field(
        None, description="URL pública de imagen de perfil"
    )
    profile_image_uploaded_at: Optional[datetime] = Field(
        None, description="Fecha de subida de imagen"
    )

    @field_validator("date_of_birth")
    @classmethod
    def validate_age(cls, v):
        if v is not None:
            today = date.today()
            age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
            if age < 18:
                raise ValueError("Debes ser mayor de 18 años")
        return v


class ChangePasswordRequest(BaseModel):
    """Esquema para cambio de contraseña."""

    current_password: str = Field(..., min_length=6, description="Contraseña actual")
    new_password: str = Field(..., min_length=6, description="Nueva contraseña")
    confirm_password: str = Field(
        ..., min_length=6, description="Confirmar nueva contraseña"
    )
