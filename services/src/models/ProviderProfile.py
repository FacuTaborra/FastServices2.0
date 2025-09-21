"""
Modelo de perfil de proveedor de servicios.
Contiene información adicional para usuarios con rol 'provider'.
"""

from typing import Optional
from decimal import Decimal
from datetime import datetime, date
from sqlalchemy import (
    Column,
    BigInteger,
    Text,
    DECIMAL,
    Integer,
    Boolean,
    TIMESTAMP,
    ForeignKey,
    func,
)
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, ConfigDict, field_validator
from database.database import Base


class ProviderProfile(Base):
    """
    Modelo SQLAlchemy para perfiles de proveedores de servicios.
    Extiende la información del usuario con datos específicos de negocio.
    """

    __tablename__ = "provider_profiles"

    # Campos de la tabla
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    bio = Column(Text, nullable=True)
    rating_avg = Column(DECIMAL(3, 2), default=0.0)
    total_reviews = Column(Integer, default=0)
    is_online = Column(Boolean, default=False, nullable=False)
    service_radius_km = Column(Integer, default=10)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())

    # Relaciones
    user = relationship("User", back_populates="provider_profile")


# === Esquemas Pydantic para validación ===


class ProviderProfileBase(BaseModel):
    """Esquema base para ProviderProfile."""

    bio: Optional[str] = Field(
        None, max_length=1000, description="Biografía del proveedor"
    )
    service_radius_km: Optional[int] = Field(
        10, ge=1, le=100, description="Radio de servicio en kilómetros"
    )


class ProviderProfileCreate(ProviderProfileBase):
    """Esquema para crear un nuevo perfil de proveedor."""

    pass


class ProviderProfileUpdate(BaseModel):
    """Esquema para actualizar un perfil de proveedor."""

    bio: Optional[str] = Field(None, max_length=1000)
    service_radius_km: Optional[int] = Field(None, ge=1, le=100)
    is_online: Optional[bool] = None


class ProviderProfileResponse(ProviderProfileBase):
    """Esquema de respuesta para ProviderProfile."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    rating_avg: Decimal = Field(description="Promedio de calificaciones")
    total_reviews: int = Field(description="Total de reseñas recibidas")
    is_online: bool = Field(description="Estado en línea del proveedor")
    created_at: datetime = Field(description="Fecha de creación del perfil")


class ProviderRegisterRequest(BaseModel):
    """Esquema para registro completo de proveedor (usuario + perfil)."""

    # Datos del usuario
    first_name: str = Field(
        ..., min_length=2, max_length=60, description="Nombre del proveedor"
    )
    last_name: str = Field(
        ..., min_length=2, max_length=60, description="Apellido del proveedor"
    )
    email: str = Field(..., description="Email del proveedor")
    phone: str = Field(
        ..., min_length=8, max_length=30, description="Teléfono del proveedor"
    )
    date_of_birth: Optional[date] = Field(None, description="Fecha de nacimiento")
    password: str = Field(..., min_length=6, description="Contraseña")

    # Datos del perfil
    bio: Optional[str] = Field(
        None, max_length=1000, description="Biografía del proveedor"
    )
    service_radius_km: Optional[int] = Field(
        10, ge=1, le=100, description="Radio de servicio en kilómetros"
    )

    @field_validator("date_of_birth")
    @classmethod
    def validate_age(cls, v):
        if v is not None:
            today = date.today()
            age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
            if age < 18:
                raise ValueError(
                    "Debes ser mayor de 18 años para registrarte como proveedor"
                )
        return v


class ProviderLoginRequest(BaseModel):
    """Esquema para login de proveedor."""

    email: str = Field(..., description="Email del proveedor")
    password: str = Field(..., description="Contraseña")


class ProviderResponse(BaseModel):
    """Esquema completo de respuesta para proveedor (usuario + perfil)."""

    model_config = ConfigDict(from_attributes=True)

    # Datos del usuario
    id: int
    first_name: str
    last_name: str
    email: str
    phone: str
    date_of_birth: Optional[date]
    role: str
    is_active: bool
    created_at: datetime

    # Datos del perfil
    provider_profile: ProviderProfileResponse
