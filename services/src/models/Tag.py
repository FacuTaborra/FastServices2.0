"""Modelos relacionados con etiquetas generadas por el LLM."""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from pydantic import BaseModel

from database.database import Base


class Tag(Base):
    """Etiqueta normalizada utilizada para matchear solicitudes y licencias."""

    __tablename__ = "tags"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    slug = Column(String(120), nullable=False, unique=True)
    name = Column(String(120), nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    service_request_links = relationship(
        "ServiceRequestTag",
        back_populates="tag",
        cascade="all, delete-orphan",
    )
    provider_license_links = relationship(
        "ProviderLicenseTag",
        back_populates="tag",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:  # pragma: no cover - representación auxiliar
        return f"<Tag(id={self.id}, slug='{self.slug}')>"


class ServiceRequestTag(Base):
    """Asociación entre una solicitud y un tag con un nivel de confianza."""

    __tablename__ = "service_request_tags"
    __table_args__ = (
        UniqueConstraint("request_id", "tag_id", name="uq_service_request_tag"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    request_id = Column(
        BigInteger,
        ForeignKey("service_requests.id", ondelete="CASCADE"),
        nullable=False,
    )
    tag_id = Column(
        BigInteger,
        ForeignKey("tags.id", ondelete="CASCADE"),
        nullable=False,
    )
    confidence = Column(Numeric(5, 4), nullable=True)
    source = Column(String(32), nullable=False, default="llm")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    request = relationship("ServiceRequest", back_populates="tag_links")
    tag = relationship("Tag", back_populates="service_request_links")


class ProviderLicenseTag(Base):
    """Asociación entre una licencia declarada y un tag inferido."""

    __tablename__ = "provider_license_tags"
    __table_args__ = (
        UniqueConstraint("license_id", "tag_id", name="uq_provider_license_tag"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    license_id = Column(
        BigInteger,
        ForeignKey("provider_licenses.id", ondelete="CASCADE"),
        nullable=False,
    )
    tag_id = Column(
        BigInteger,
        ForeignKey("tags.id", ondelete="CASCADE"),
        nullable=False,
    )
    confidence = Column(Numeric(5, 4), nullable=True)
    source = Column(String(32), nullable=False, default="llm")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    license = relationship("ProviderLicense", back_populates="tag_links")
    tag = relationship("Tag", back_populates="provider_license_links")


# ---------------------------------------------------------------------------
# Esquemas Pydantic
# ---------------------------------------------------------------------------


class TagResponse(BaseModel):
    id: int
    slug: str
    name: str
    description: Optional[str]

    model_config = dict(from_attributes=True)


class ServiceRequestTagResponse(BaseModel):
    tag: TagResponse
    confidence: Optional[float]
    source: str

    model_config = dict(from_attributes=True)


class ProviderLicenseTagResponse(BaseModel):
    tag: TagResponse
    confidence: Optional[float]
    source: str

    model_config = dict(from_attributes=True)


__all__ = [
    "Tag",
    "ServiceRequestTag",
    "ProviderLicenseTag",
    "TagResponse",
    "ServiceRequestTagResponse",
    "ProviderLicenseTagResponse",
]
