"""Esquemas Pydantic para los endpoints de solicitudes de servicio."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from models.ServiceRequest import (
    ProposalStatus,
    ServiceRequestStatus,
    ServiceRequestType,
    ServiceStatus,
)
from models.Tag import ServiceRequestTagResponse

MAX_ATTACHMENTS = 6


class CurrencyResponse(BaseModel):
    """Moneda disponible para cotizaciones."""

    code: str
    name: str

    model_config = dict(from_attributes=True)


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
    tag_ids: List[int] = Field(
        default_factory=list,
        description="Tags sugeridos para la solicitud",
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
    status_history: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Historial de cambios de estado del servicio",
    )
    client_review: Optional["ServiceReviewResponse"] = Field(
        default=None,
        description="Calificación registrada por el cliente para este servicio",
    )
    created_at: datetime
    updated_at: datetime

    model_config = dict(from_attributes=True)


class ServiceRequestResponse(BaseModel):
    """Respuesta básica para una solicitud creada."""

    id: int
    client_id: int
    client_name: Optional[str] = Field(None, description="Nombre completo del cliente")
    client_avatar_url: Optional[str] = Field(
        None, description="URL del avatar del cliente"
    )
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
    address: Optional[str] = Field(
        default=None, description="Dirección asociada a la solicitud en formato legible"
    )
    address_details: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Snapshot completo de la dirección asociada (si está disponible)",
    )
    tags: List[ServiceRequestTagResponse] = Field(default_factory=list)
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


class ServiceReviewCreate(BaseModel):
    """Payload para registrar una calificación sobre un servicio."""

    rating: int = Field(
        ..., ge=1, le=5, description="Valor de 1 a 5 otorgado al servicio"
    )
    comment: Optional[str] = Field(
        default=None,
        max_length=600,
        description="Comentario opcional dirigido al prestador",
    )

    @field_validator("comment", mode="before")
    @classmethod
    def normalize_comment(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = " ".join(value.split())
        return cleaned or None


class ServiceReviewResponse(BaseModel):
    """Respuesta detallada para una calificación."""

    id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    model_config = dict(from_attributes=True)


class ServiceCancelRequest(BaseModel):
    """Payload opcional al cancelar un servicio."""

    reason: Optional[str] = Field(
        default=None,
        max_length=300,
        description="Motivo del reembolso solicitado",
    )


class PaymentHistoryItem(BaseModel):
    """Item del historial de pagos de un cliente."""

    id: str = Field(..., description="ID único compuesto o simple")
    service_id: int
    service_title: Optional[str]
    provider_name: str
    date: datetime
    amount: Decimal
    currency: str
    status: ServiceStatus

    model_config = dict(from_attributes=True)


class ServiceRequestRewriteInput(BaseModel):
    """Payload para reescribir título y descripción con AI."""

    title: str = Field(..., min_length=1, max_length=150)
    description: str = Field(..., min_length=1, max_length=2000)


class ServiceRequestRewriteOutput(BaseModel):
    """Respuesta con título y descripción reescritos por AI."""

    title: str
    description: str
    request_type: Optional[ServiceRequestType] = Field(
        default=None,
        description="Tipo de solicitud recomendado: FAST (urgente) o LICITACION (puede esperar)",
    )


# ============================================================================
# SCHEMAS PARA CLARIFICACIÓN DE TAGS (LangGraph Agent)
# ============================================================================


class ClarificationStatus(str, Enum):
    """Estado de la generación de tags con el agente LangGraph."""

    COMPLETED = "completed"
    NEEDS_CLARIFICATION = "needs_clarification"


class ServiceRequestCreateResponse(BaseModel):
    """
    Respuesta al crear una solicitud de servicio.

    Puede contener:
    - La solicitud creada (status=completed)
    - Una pregunta de clarificación (status=needs_clarification)
    """

    status: ClarificationStatus = Field(
        ..., description="Estado: completed o needs_clarification"
    )
    service_request: Optional[ServiceRequestResponse] = Field(
        default=None,
        description="La solicitud creada (solo si status=completed)",
    )
    clarification_question: Optional[str] = Field(
        default=None,
        description="Pregunta para el cliente (solo si status=needs_clarification)",
    )
    suggested_options: Optional[List[str]] = Field(
        default=None,
        description="Opciones sugeridas para responder la clarificación",
    )
    clarification_count: Optional[int] = Field(
        default=None,
        description="Número de clarificación actual (solo si status=needs_clarification)",
    )
    pending_request_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Datos de la solicitud pendiente para reenviar con la clarificación",
    )


class ClarificationResponse(BaseModel):
    """Payload para responder a una clarificación."""

    original_title: Optional[str] = Field(None, max_length=150)
    original_description: str = Field(..., min_length=20, max_length=2000)
    clarification_answer: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Respuesta del cliente a la pregunta de clarificación",
    )
    clarification_count: int = Field(
        default=1,
        ge=1,
        le=3,
        description="Número de clarificación actual (1-3)",
    )
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
    tag_ids: List[int] = Field(
        default_factory=list,
        description="Tags sugeridos para la solicitud",
    )
    attachments: List[ServiceRequestAttachment] = Field(
        default_factory=list, description="Hasta 6 imágenes para la solicitud"
    )

    @field_validator("clarification_answer")
    @classmethod
    def normalize_answer(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        return cleaned
