"""Esquemas Pydantic para los endpoints de solicitudes de servicio."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from models.ServiceRequest import (
    ProposalStatus,
    ServiceRequestStatus,
    ServiceRequestType,
    ServiceStatus,
)

MAX_ATTACHMENTS = 6


class ServiceRequestAttachment(BaseModel):
    """Archivo adjunto (imagen) asociado a una solicitud."""

    s3_key: str = Field(..., description="Clave S3 de la imagen")
    caption: Optional[str] = Field(
        None, max_length=150, description="Texto descriptivo de la imagen"
    )
    public_url: Optional[str] = Field(
        None, description="URL pública si ya está disponible"
    )
    sort_order: Optional[int] = Field(
        None, ge=0, le=MAX_ATTACHMENTS - 1, description="Orden de aparición"
    )

    @field_validator("s3_key")
    @classmethod
    def validate_s3_key(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("La clave S3 no puede estar vacía")
        return cleaned


class ServiceRequestCreate(BaseModel):
    """Payload para crear una solicitud de servicio."""

    title: Optional[str] = Field(None, max_length=150)
    description: str = Field(..., min_length=20, max_length=2000)
    request_type: ServiceRequestType = Field(
        default=ServiceRequestType.FAST,
        description="FAST (rápida) o LICITACION",
    )
    address_id: int = Field(
        ..., description="Identificador de la dirección del cliente"
    )
    preferred_start_at: Optional[datetime] = Field(
        None, description="Inicio deseado del servicio"
    )
    preferred_end_at: Optional[datetime] = Field(
        None, description="Fin deseado del servicio"
    )
    bidding_deadline: Optional[datetime] = Field(
        None,
        description="Fecha límite para recibir propuestas (solo LICITACION)",
    )
    license_type_ids: List[int] = Field(
        default_factory=list,
        description="Licencias sugeridas para la solicitud",
    )
    attachments: List[ServiceRequestAttachment] = Field(
        default_factory=list, description="Hasta 6 imágenes para la solicitud"
    )

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        return cleaned

    @model_validator(mode="after")
    def validate_model(self) -> "ServiceRequestCreate":
        if len(self.attachments) > MAX_ATTACHMENTS:
            raise ValueError(
                f"Se permiten como máximo {MAX_ATTACHMENTS} imágenes por solicitud"
            )

        if self.preferred_start_at and self.preferred_end_at:
            if self.preferred_end_at < self.preferred_start_at:
                raise ValueError(
                    "La fecha de fin preferida debe ser igual o posterior al inicio"
                )

        if self.request_type != ServiceRequestType.LICITACION:
            if self.bidding_deadline is not None:
                raise ValueError(
                    "Solo las licitaciones pueden definir un bidding_deadline"
                )

        return self


class ServiceRequestImageResponse(BaseModel):
    """Representación de una imagen ya asociada a la solicitud."""

    id: int
    s3_key: str
    public_url: Optional[str]
    caption: Optional[str]
    sort_order: int

    model_config = dict(from_attributes=True)


class ServiceRequestProposalResponse(BaseModel):
    """Resumen de una propuesta vinculada a la solicitud."""

    id: int
    provider_profile_id: int
    provider_display_name: str
    provider_rating_avg: Optional[Decimal]
    provider_total_reviews: Optional[int]
    provider_image_url: Optional[str]
    quoted_price: Decimal
    currency: str
    status: ProposalStatus
    proposed_start_at: Optional[datetime]
    proposed_end_at: Optional[datetime]
    valid_until: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = dict(from_attributes=True)


class ServiceSummaryResponse(BaseModel):
    """Resumen del servicio generado a partir de la solicitud."""

    id: int
    status: ServiceStatus
    proposal_id: Optional[int]
    scheduled_start_at: Optional[datetime]
    scheduled_end_at: Optional[datetime]
    total_price: Optional[Decimal]
    currency: Optional[str]
    address_snapshot: Optional[Dict[str, Any]]
    provider_profile_id: Optional[int]
    provider_display_name: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = dict(from_attributes=True)


class ServiceRequestResponse(BaseModel):
    """Respuesta básica para una solicitud creada."""

    id: int
    client_id: int
    address_id: Optional[int]
    title: Optional[str]
    description: str
    request_type: ServiceRequestType
    status: ServiceRequestStatus
    preferred_start_at: Optional[datetime]
    preferred_end_at: Optional[datetime]
    bidding_deadline: Optional[datetime]
    city_snapshot: Optional[str]
    lat_snapshot: Optional[Decimal]
    lon_snapshot: Optional[Decimal]
    license_type_ids: List[int] = Field(default_factory=list)
    attachments: List[ServiceRequestImageResponse] = Field(default_factory=list)
    proposal_count: int = Field(0, ge=0)
    proposals: List[ServiceRequestProposalResponse] = Field(default_factory=list)
    service: Optional[ServiceSummaryResponse] = Field(
        default=None, description="Servicio confirmado asociado a la solicitud"
    )
    created_at: datetime
    updated_at: datetime

    model_config = dict(from_attributes=True)


class ServiceRequestUpdate(BaseModel):
    """Payload parcial para actualizar una solicitud existente."""

    request_type: Optional[ServiceRequestType] = Field(
        default=None, description="Nuevo tipo de solicitud"
    )
    status: Optional[ServiceRequestStatus] = Field(
        default=None, description="Nuevo estado de la solicitud"
    )

    @model_validator(mode="after")
    def validate_fields(self) -> "ServiceRequestUpdate":
        if self.request_type is None and self.status is None:
            raise ValueError("Debes especificar al menos un campo para actualizar")
        return self


class ServiceRequestConfirmPayment(BaseModel):
    """Payload para confirmar el pago de una propuesta ganadora."""

    proposal_id: int = Field(..., description="Identificador de la propuesta aceptada")
    payment_reference: Optional[str] = Field(
        None,
        max_length=120,
        description="Referencia opcional del comprobante de pago",
    )


class ServiceCancelRequest(BaseModel):
    """Payload opcional al cancelar un servicio."""

    reason: Optional[str] = Field(
        default=None,
        max_length=300,
        description="Motivo del reembolso solicitado",
    )
