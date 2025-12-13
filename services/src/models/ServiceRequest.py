"""Modelos para solicitudes de servicio y propuestas."""

from __future__ import annotations

from enum import Enum

from sqlalchemy import (
    JSON,
    BigInteger,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
    Index,
    CheckConstraint,
)
from sqlalchemy.orm import relationship

from database.database import Base


class ServiceRequestType(str, Enum):
    """Tipos posibles de solicitudes creadas por clientes."""

    FAST = "FAST"
    LICITACION = "LICITACION"
    RECONTRATACION = "RECONTRATACION"


class ServiceRequestStatus(str, Enum):
    """Estados de publicación de la solicitud."""

    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class ProposalStatus(str, Enum):
    """Estados posibles para una propuesta enviada por un proveedor."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"


class ServiceStatus(str, Enum):
    """Estados del servicio una vez confirmada la contratación."""

    CONFIRMED = "CONFIRMED"
    ON_ROUTE = "ON_ROUTE"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELED = "CANCELED"


class ServiceType(str, Enum):
    """Tipo de servicio (original vs derivado de follow-up)."""

    ORIGINAL = "ORIGINAL"  # Servicio normal/original
    WARRANTY = "WARRANTY"  # Servicio de garantía (sin costo)
    MAINTENANCE = "MAINTENANCE"  # Servicio de mantenimiento (con costo)


class ServiceRequest(Base):
    """Solicitudes de servicio creadas por clientes."""

    __tablename__ = "service_requests"
    __table_args__ = (
        CheckConstraint(
            "((request_type = 'LICITACION' AND bidding_deadline IS NOT NULL) OR (request_type IN ('FAST', 'RECONTRATACION') AND bidding_deadline IS NULL))",
            name="ck_service_requests_bidding_deadline",
        ),
        Index("ix_service_requests_city_snapshot", "city_snapshot"),
        Index("ix_service_requests_point", "lat_snapshot", "lon_snapshot"),
        Index(
            "ix_service_requests_type_city",
            "request_type",
            "city_snapshot",
            "created_at",
        ),
        Index("ix_service_requests_target_provider", "target_provider_profile_id"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    client_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    address_id = Column(
        BigInteger, ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True
    )
    parent_service_id = Column(
        BigInteger, ForeignKey("services.id", ondelete="SET NULL"), nullable=True
    )
    target_provider_profile_id = Column(
        BigInteger,
        ForeignKey("provider_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    city_snapshot = Column(String(100), nullable=True)
    lat_snapshot = Column(Numeric(9, 6), nullable=True)
    lon_snapshot = Column(Numeric(9, 6), nullable=True)

    title = Column(String(150), nullable=True)
    description = Column(Text, nullable=False)
    request_type = Column(
        SAEnum(ServiceRequestType, name="service_request_type"),
        nullable=False,
        default=ServiceRequestType.FAST,
    )
    status = Column(
        SAEnum(ServiceRequestStatus, name="service_request_status"),
        nullable=False,
        default=ServiceRequestStatus.DRAFT,
    )

    preferred_start_at = Column(DateTime, nullable=True)
    preferred_end_at = Column(DateTime, nullable=True)
    bidding_deadline = Column(DateTime, nullable=True)

    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(
        DateTime,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    client = relationship("User", back_populates="service_requests")
    address = relationship("Address", back_populates="service_requests")
    images = relationship(
        "ServiceRequestImage", back_populates="request", cascade="all, delete-orphan"
    )
    proposals = relationship(
        "ServiceRequestProposal", back_populates="request", cascade="all, delete-orphan"
    )
    service = relationship(
        "Service",
        back_populates="request",
        uselist=False,
        foreign_keys="Service.request_id",
    )
    tag_links = relationship(
        "ServiceRequestTag",
        back_populates="request",
        cascade="all, delete-orphan",
    )
    parent_service = relationship(
        "Service",
        foreign_keys=[parent_service_id],
        back_populates="rehire_requests",
        lazy="selectin",
    )
    target_provider = relationship(
        "ProviderProfile",
        foreign_keys=[target_provider_profile_id],
        back_populates="targeted_requests",
        lazy="selectin",
    )


class ServiceRequestImage(Base):
    """Imágenes asociadas a la solicitud."""

    __tablename__ = "service_request_images"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    request_id = Column(
        BigInteger,
        ForeignKey("service_requests.id", ondelete="CASCADE"),
        nullable=False,
    )
    s3_key = Column(String(255), nullable=False)
    public_url = Column(String(500), nullable=True)
    caption = Column(String(150), nullable=True)
    sort_order = Column(SmallInteger, nullable=False, default=0)
    uploaded_at = Column(DateTime, server_default=func.current_timestamp())

    request = relationship("ServiceRequest", back_populates="images")


class ServiceRequestProposal(Base):
    """Propuestas de presupuesto enviadas por proveedores."""

    __tablename__ = "service_request_proposals"
    __table_args__ = (
        UniqueConstraint(
            "request_id",
            "provider_profile_id",
            "version",
            name="uq_request_provider_proposal",
        ),
        Index("ix_proposals_req_status", "request_id", "status"),
        Index("ix_proposals_provider_status", "provider_profile_id", "status"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    request_id = Column(
        BigInteger,
        ForeignKey("service_requests.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider_profile_id = Column(
        BigInteger,
        ForeignKey("provider_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    version = Column(SmallInteger, nullable=False, default=1)
    status = Column(
        SAEnum(ProposalStatus, name="service_request_proposal_status"),
        nullable=False,
        default=ProposalStatus.PENDING,
    )
    quoted_price = Column(Numeric(12, 2), nullable=False)
    currency = Column(
        String(3),
        ForeignKey("currencies.code", ondelete="RESTRICT"),
        nullable=False,
        default="ARS",
    )
    proposed_start_at = Column(DateTime, nullable=True)
    proposed_end_at = Column(DateTime, nullable=True)
    valid_until = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(
        DateTime,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    request = relationship("ServiceRequest", back_populates="proposals")
    provider = relationship("ProviderProfile", back_populates="proposals")
    service = relationship("Service", back_populates="proposal", uselist=False)

    currency_ref = relationship("Currency", back_populates="proposals")


class Service(Base):
    """Servicio confirmado tras aceptar una propuesta."""

    __tablename__ = "services"
    __table_args__ = (
        Index("ix_services_provider_status", "provider_profile_id", "status"),
        Index("ix_services_client_status", "client_id", "status"),
        Index("ix_services_scheduled_start", "scheduled_start_at"),
        Index("ix_services_parent_service_id", "parent_service_id"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    request_id = Column(
        BigInteger,
        ForeignKey("service_requests.id", ondelete="SET NULL"),
        nullable=True,
    )
    proposal_id = Column(
        BigInteger,
        ForeignKey("service_request_proposals.id", ondelete="SET NULL"),
        nullable=True,
    )
    client_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    provider_profile_id = Column(
        BigInteger,
        ForeignKey("provider_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Campos para servicios derivados (garantía/mantenimiento)
    parent_service_id = Column(
        BigInteger,
        ForeignKey("services.id", ondelete="SET NULL"),
        nullable=True,
        comment="ID del servicio original si es garantía/mantenimiento",
    )
    service_type = Column(
        String(20),
        nullable=False,
        default=ServiceType.ORIGINAL.value,
        comment="Tipo: ORIGINAL, WARRANTY, MAINTENANCE",
    )
    warranty_days = Column(
        SmallInteger,
        nullable=False,
        default=30,
        comment="Días de garantía del servicio",
    )
    warranty_expires_at = Column(
        DateTime,
        nullable=True,
        comment="Fecha de expiración de la garantía",
    )
    warranty_claim_description = Column(
        Text,
        nullable=True,
        comment="Descripción del problema (solo para servicios WARRANTY)",
    )

    address_snapshot = Column(JSON, nullable=True)
    scheduled_start_at = Column(DateTime, nullable=True)
    scheduled_end_at = Column(DateTime, nullable=True)
    status = Column(
        SAEnum(ServiceStatus, name="service_status"),
        nullable=False,
        default=ServiceStatus.CONFIRMED,
    )
    total_price = Column(Numeric(12, 2), nullable=True)
    currency = Column(
        String(3),
        ForeignKey("currencies.code", ondelete="RESTRICT"),
        nullable=True,
    )

    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(
        DateTime,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    request = relationship(
        "ServiceRequest",
        back_populates="service",
        foreign_keys=[request_id],
    )
    proposal = relationship("ServiceRequestProposal", back_populates="service")
    client = relationship("User", back_populates="services_as_client")
    provider = relationship("ProviderProfile", back_populates="services")
    currency_ref = relationship("Currency")
    status_history = relationship(
        "ServiceStatusHistory",
        back_populates="service",
        cascade="all, delete-orphan",
    )
    reviews = relationship(
        "ServiceReview", back_populates="service", cascade="all, delete-orphan"
    )
    # Relación con servicio padre (para servicios de garantía/mantenimiento)
    parent_service = relationship(
        "Service",
        remote_side=[id],
        backref="child_services",
        foreign_keys=[parent_service_id],
    )
    # Solicitudes de recontratación derivadas de este servicio
    rehire_requests = relationship(
        "ServiceRequest",
        foreign_keys="ServiceRequest.parent_service_id",
        back_populates="parent_service",
        lazy="selectin",
    )


class Currency(Base):
    """Catálogo de monedas ISO-4217."""

    __tablename__ = "currencies"

    code = Column(String(3), primary_key=True)
    name = Column(String(64), nullable=False)

    proposals = relationship("ServiceRequestProposal", back_populates="currency_ref")


class ServiceReview(Base):
    """Calificaciones realizadas sobre un servicio."""

    __tablename__ = "service_reviews"
    __table_args__ = (
        UniqueConstraint("service_id", "rater_user_id", name="uq_service_rater"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_service_reviews_rating"),
        Index("ix_service_reviews_ratee_rating", "ratee_provider_profile_id", "rating"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    service_id = Column(
        BigInteger, ForeignKey("services.id", ondelete="CASCADE"), nullable=False
    )
    rater_user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    ratee_provider_profile_id = Column(
        BigInteger,
        ForeignKey("provider_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    rating = Column(SmallInteger, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )

    service = relationship("Service", back_populates="reviews")
    rater = relationship("User", back_populates="service_reviews_authored")
    provider_profile = relationship(
        "ProviderProfile", back_populates="reviews_received"
    )


class ServiceStatusHistory(Base):
    """Historial de cambios de estado de un servicio."""

    __tablename__ = "service_status_history"
    __table_args__ = (
        Index("ix_service_status_history_service", "service_id", "changed_at"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    service_id = Column(
        BigInteger, ForeignKey("services.id", ondelete="CASCADE"), nullable=False
    )
    from_status = Column(String(20), nullable=True)
    to_status = Column(String(20), nullable=False)
    changed_at = Column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )
    changed_by = Column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    service = relationship("Service", back_populates="status_history")
    changed_by_user = relationship("User", back_populates="service_status_changes")
