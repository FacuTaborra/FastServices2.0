"""Modelos vinculados a la información de prestadores."""

from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date
from sqlalchemy import (
    Column,
    BigInteger,
    Text,
    DECIMAL,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, ConfigDict, field_validator

from database.database import Base
from .Tag import ProviderLicenseTagResponse


class ProviderProfile(Base):
    """
    Modelo SQLAlchemy para perfiles de proveedores de servicios.
    Extiende la informacion del usuario con datos especificos de negocio.
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
    rating_avg = Column(DECIMAL(3, 2), nullable=False, default=0.0)
    total_reviews = Column(Integer, nullable=False, default=0)
    created_at = Column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    # Relaciones
    user = relationship("User", back_populates="provider_profile")
    licenses = relationship(
        "ProviderLicense",
        back_populates="provider_profile",
        cascade="all, delete-orphan",
    )
    proposals = relationship("ServiceRequestProposal", back_populates="provider")
    services = relationship("Service", back_populates="provider")
    reviews_received = relationship(
        "ServiceReview", back_populates="provider_profile", cascade="all"
    )


class ProviderLicense(Base):
    """
    Modelo SQLAlchemy para licencias profesionales asociadas a proveedores.
    """

    __tablename__ = "provider_licenses"
    __table_args__ = (
        UniqueConstraint(
            "provider_profile_id",
            "license_number",
            name="uq_provider_license_unique",
        ),
    )

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    provider_profile_id = Column(
        BigInteger,
        ForeignKey("provider_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    license_number = Column(String(120), nullable=False)
    issued_by = Column(String(120), nullable=True)
    issued_at = Column(Date, nullable=True)
    expires_at = Column(Date, nullable=True)
    document_s3_key = Column(String(255), nullable=True)
    document_url = Column(String(500), nullable=True)
    created_at = Column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    provider_profile = relationship("ProviderProfile", back_populates="licenses")
    tag_links = relationship(
        "ProviderLicenseTag",
        back_populates="license",
        cascade="all, delete-orphan",
    )


# === Esquemas Pydantic para validación ===


class ProviderProfileBase(BaseModel):
    """Esquema base para ProviderProfile."""

    bio: Optional[str] = Field(
        None, max_length=1000, description="Biografia del proveedor"
    )


class ProviderLicenseBase(BaseModel):
    """Esquema de respuesta para licencias de proveedor."""

    title: str = Field(..., max_length=150)
    description: Optional[str] = Field(None, description="Descripción de la licencia")
    license_number: str = Field(
        ..., max_length=120, description="Numero identificatorio de la licencia"
    )
    issued_by: Optional[str] = Field(
        None, max_length=120, description="Entidad emisora de la licencia"
    )
    issued_at: Optional[date] = Field(
        None, description="Fecha de emision de la licencia"
    )
    expires_at: Optional[date] = Field(
        None, description="Fecha de expiracion de la licencia"
    )
    document_s3_key: Optional[str] = Field(
        None, description="Clave S3 del archivo adjunto"
    )
    document_url: Optional[str] = Field(
        None, description="URL pública del archivo adjunto"
    )


class ProviderLicenseResponse(ProviderLicenseBase):
    """Esquema de respuesta para licencias de proveedor."""

    id: int
    provider_profile_id: int
    created_at: datetime
    updated_at: datetime
    tags: List[ProviderLicenseTagResponse] = Field(
        default_factory=list, description="Tags asociados a la licencia"
    )

    model_config = ConfigDict(from_attributes=True)


class ProviderProfileCreate(ProviderProfileBase):
    """Esquema para crear un nuevo perfil de proveedor."""

    pass


class ProviderProfileUpdate(BaseModel):
    """Esquema para actualizar un perfil de proveedor."""

    bio: Optional[str] = Field(None, max_length=1000)


class ProviderProfileResponse(ProviderProfileBase):
    """Esquema de respuesta para ProviderProfile."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    rating_avg: Decimal = Field(description="Promedio de calificaciones")
    total_reviews: int = Field(description="Total de resenas recibidas")
    created_at: datetime = Field(description="Fecha de creacion del perfil")
    updated_at: datetime = Field(description="Fecha de ultima actualizacion del perfil")
    licenses: List[ProviderLicenseResponse] = Field(
        default_factory=list, description="Licencias profesionales del proveedor"
    )


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
        None, max_length=1000, description="Biografia del proveedor"
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
    updated_at: datetime
    profile_image_url: Optional[str]
    profile_image_s3_key: Optional[str]
    profile_image_uploaded_at: Optional[datetime]

    # Datos del perfil
    provider_profile: ProviderProfileResponse
