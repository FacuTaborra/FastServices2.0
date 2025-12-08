"""Modelos vinculados a la información de prestadores."""

from typing import Optional, List, Dict, Any
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
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator

from database.database import Base
from .Tag import ProviderLicenseTagResponse
from .ServiceRequest import (
    ServiceRequestType,
    ServiceRequestStatus,
    ServiceStatus,
    ProposalStatus,
)
from .ServiceRequestSchemas import ServiceRequestImageResponse, ServiceReviewResponse


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
    license_number = Column(String(120), nullable=True)
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
    """Esquema base para licencias/certificados de proveedor."""

    title: str = Field(..., max_length=150)
    description: Optional[str] = Field(
        None, description="Descripción de la licencia o certificado"
    )
    license_number: Optional[str] = Field(
        None, max_length=120, description="Numero identificatorio de la licencia"
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


class ProviderLicenseCreate(ProviderLicenseBase):
    """Esquema para crear una nueva licencia o certificado de idoneidad."""

    @field_validator("license_number", mode="before")
    @classmethod
    def normalize_license_number(cls, v):
        if v is None:
            return None
        stripped = v.strip()
        return stripped or None

    @field_validator("description", mode="before")
    @classmethod
    def normalize_description(cls, v):
        if v is None:
            return None
        stripped = v.strip()
        return stripped or None

    @field_validator("license_number", mode="after")
    @classmethod
    def validate_license_or_certificate(cls, v, info):
        description = info.data.get("description")
        if (v is None or v.strip() == "") and (
            not description or description.strip() == ""
        ):
            raise ValueError(
                "Debes ingresar un número de licencia o describir el certificado de idoneidad"
            )
        return v


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


class ProviderLicenseBulkCreate(BaseModel):
    """Carga múltiple de licencias para un proveedor."""

    licenses: List[ProviderLicenseCreate] = Field(
        default_factory=list, description="Listado de licencias a asociar"
    )


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


class ProviderProposalCreate(BaseModel):
    """Payload para registrar un nuevo presupuesto."""

    request_id: int = Field(..., gt=0)
    quoted_price: Decimal = Field(..., gt=0)
    currency: str = Field("ARS", min_length=3, max_length=3)
    proposed_start_at: Optional[datetime] = None
    proposed_end_at: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        normalized = value.strip().upper()
        if len(normalized) != 3 or not normalized.isascii():
            raise ValueError(
                "El código de moneda debe tener 3 caracteres alfanuméricos"
            )
        return normalized

    @field_validator("notes", mode="before")
    @classmethod
    def clean_notes(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @model_validator(mode="after")
    def validate_temporal_ranges(self) -> "ProviderProposalCreate":
        if self.proposed_start_at and self.proposed_end_at:
            if self.proposed_end_at < self.proposed_start_at:
                raise ValueError(
                    "La fecha de fin propuesta no puede ser anterior al inicio"
                )
        return self


class ProviderProposalResponse(BaseModel):
    """Resumen de propuestas/presupuestos enviados por el proveedor."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    request_id: int
    provider_profile_id: int
    version: int
    status: ProposalStatus
    quoted_price: Decimal
    currency: str
    notes: Optional[str]
    valid_until: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    request_title: Optional[str] = None
    request_type: Optional[ServiceRequestType] = None
    request_status: Optional[ServiceRequestStatus] = None
    request_city: Optional[str] = None
    request_description: Optional[str] = None
    request_created_at: Optional[datetime] = None
    request_attachments: List[ServiceRequestImageResponse] = Field(default_factory=list)
    preferred_start_at: Optional[datetime] = None
    preferred_end_at: Optional[datetime] = None
    client_name: Optional[str] = None
    client_avatar_url: Optional[str] = None


class ProviderServiceStatusHistory(BaseModel):
    """Historial de cambios de estado para un servicio confirmado."""

    model_config = ConfigDict(from_attributes=True)

    changed_at: datetime
    from_status: Optional[str] = None
    to_status: str


class ProviderServiceRequestPreview(BaseModel):
    """Resumen de la solicitud asociada al servicio del proveedor."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: Optional[str] = None
    description: Optional[str] = None
    request_type: Optional[ServiceRequestType] = None
    status: Optional[ServiceRequestStatus] = None
    city_snapshot: Optional[str] = None
    preferred_start_at: Optional[datetime] = None
    preferred_end_at: Optional[datetime] = None
    attachments: List[ServiceRequestImageResponse] = Field(default_factory=list)


class ProviderServiceResponse(BaseModel):
    """Servicio confirmado asignado al proveedor."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status: ServiceStatus
    scheduled_start_at: Optional[datetime] = None
    scheduled_end_at: Optional[datetime] = None
    total_price: Optional[Decimal] = None
    quoted_price: Optional[Decimal] = None
    currency: Optional[str] = None
    proposal_id: Optional[int] = None
    request_id: Optional[int] = None
    request: Optional[ProviderServiceRequestPreview] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_avatar_url: Optional[str] = None
    address_snapshot: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    status_history: List[ProviderServiceStatusHistory] = Field(default_factory=list)
    client_review: Optional[ServiceReviewResponse] = None


class ProviderOverviewKpisResponse(BaseModel):
    """Métricas generales para el tablero del proveedor."""

    model_config = ConfigDict(from_attributes=True)

    total_services: int = Field(
        0, description="Cantidad de servicios gestionados (no cancelados)"
    )
    completed_services: int = Field(0, description="Servicios finalizados con éxito")
    acceptance_rate: Optional[Decimal] = Field(
        None, description="Porcentaje de propuestas aceptadas respecto del total"
    )
    total_proposals: int = Field(0, description="Cantidad total de propuestas enviadas")
    accepted_proposals: int = Field(0, description="Propuestas aceptadas por clientes")
    average_rating: Optional[Decimal] = Field(
        None, description="Calificación promedio recibida por el proveedor"
    )
    total_reviews: int = Field(0, description="Total de reseñas recibidas")
    total_revenue: Decimal = Field(
        Decimal("0"), description="Facturación acumulada para servicios completados"
    )
    revenue_previous_month: Decimal = Field(
        Decimal("0"), description="Facturación del mes calendario anterior"
    )
    revenue_change_percentage: Optional[Decimal] = Field(
        None, description="Variación porcentual frente al mes anterior"
    )
    currency: str = Field(
        "ARS", description="Moneda utilizada en los montos de facturación"
    )


class ProviderRevenuePoint(BaseModel):
    """Valor mensual de facturación y ticket promedio."""

    model_config = ConfigDict(from_attributes=True)

    month: str = Field(..., description="Mes representado en formato YYYY-MM-01")
    total_revenue: Decimal = Field(
        Decimal("0"), description="Facturación total del mes"
    )
    avg_ticket: Optional[Decimal] = Field(None, description="Ticket promedio del mes")
    completed_services: int = Field(
        0, description="Cantidad de servicios completados en el mes"
    )


class ProviderRevenueStatsResponse(BaseModel):
    """Serie temporal de ingresos por mes."""

    model_config = ConfigDict(from_attributes=True)

    range_months: int = Field(..., description="Cantidad de meses considerados")
    currency: str = Field("ARS", description="Moneda de los montos")
    points: List[ProviderRevenuePoint] = Field(
        default_factory=list, description="Datos mensuales de facturación"
    )
    server_current_month: Optional[str] = Field(
        None, description="Mes actual según el servidor (debug)"
    )


class ProviderRatingBucket(BaseModel):
    """Cantidad de reseñas para un puntaje específico."""

    model_config = ConfigDict(from_attributes=True)

    rating: int = Field(..., ge=1, le=5, description="Valor de la calificación")
    count: int = Field(0, ge=0, description="Cantidad de reseñas con el puntaje")


class ProviderRatingDistributionPoint(BaseModel):
    """Distribución de calificaciones por mes."""

    model_config = ConfigDict(from_attributes=True)

    month: str = Field(..., description="Mes representado en formato YYYY-MM-01")
    total_reviews: int = Field(
        0, description="Cantidad total de reseñas recibidas en el mes"
    )
    average_rating: Optional[Decimal] = Field(
        None, description="Calificación promedio ponderada del mes"
    )
    buckets: List[ProviderRatingBucket] = Field(
        default_factory=list, description="Distribución por puntaje"
    )


class ProviderRatingDistributionResponse(BaseModel):
    """Serie temporal de satisfacción del cliente medida por reseñas."""

    model_config = ConfigDict(from_attributes=True)

    range_months: int = Field(..., description="Cantidad de meses considerados")
    points: List[ProviderRatingDistributionPoint] = Field(
        default_factory=list, description="Distribución mensual de calificaciones"
    )
    server_current_month: Optional[str] = Field(
        None, description="Mes actual según el servidor (debug)"
    )


class ProposalNotesRewriteInput(BaseModel):
    """Payload para reescribir notas de un presupuesto con AI."""

    request_id: int = Field(..., gt=0, description="ID de la solicitud original")
    notes: str = Field(
        ..., min_length=1, max_length=500, description="Notas a reescribir"
    )


class ProposalNotesRewriteOutput(BaseModel):
    """Respuesta con las notas reescritas por AI."""

    notes: str = Field(..., description="Notas reescritas")
