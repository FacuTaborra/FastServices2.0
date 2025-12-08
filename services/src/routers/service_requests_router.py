"""Router para endpoints de solicitudes de servicio."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.auth_utils import check_user_login
from controllers.service_request_controller import ServiceRequestController
from database.database import get_db
from controllers.llm_controller import LLMController
from models.ServiceRequest import ServiceRequestType
from models.ServiceRequestSchemas import (
    ServiceCancelRequest,
    ServiceRequestConfirmPayment,
    ServiceRequestCreate,
    ServiceRequestCreateResponse,
    ServiceRequestResponse,
    ServiceRequestRewriteInput,
    ServiceRequestRewriteOutput,
    ServiceRequestUpdate,
    ServiceReviewCreate,
    PaymentHistoryItem,
    ClarificationResponse,
)
from models.User import User

router = APIRouter(prefix="/service-requests", tags=["service_requests"])


@router.post(
    "",
    response_model=ServiceRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una solicitud de servicio (método tradicional)",
    description="Crea una solicitud usando el sistema tradicional de generación de tags.",
)
async def create_service_request_endpoint(
    payload: ServiceRequestCreate,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequestResponse:
    return await ServiceRequestController.create_request(db, current_user, payload)


@router.post(
    "/with-agent",
    response_model=ServiceRequestCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear solicitud con agente inteligente",
    description="""
    Crea una solicitud usando el agente LangGraph para generación inteligente de tags.
    
    Este endpoint puede devolver:
    - **status: completed** - La solicitud fue creada exitosamente con los tags generados
    - **status: needs_clarification** - El agente necesita más información para generar tags correctos
    
    Si el estado es `needs_clarification`, el cliente debe responder usando el endpoint
    `/service-requests/with-clarification` enviando la respuesta a la pregunta.
    """,
)
async def create_service_request_with_agent_endpoint(
    payload: ServiceRequestCreate,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequestCreateResponse:
    return await ServiceRequestController.create_request_with_agent(db, current_user, payload)


@router.post(
    "/with-clarification",
    response_model=ServiceRequestCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear solicitud con respuesta de clarificación",
    description="""
    Crea una solicitud después de proporcionar información adicional solicitada por el agente.
    
    Usa este endpoint cuando el endpoint `/with-agent` devolvió `status: needs_clarification`.
    Incluye la respuesta del usuario en el campo `clarification_answer` y el `clarification_count`.
    
    Este endpoint puede devolver:
    - **status: completed** - La solicitud fue creada exitosamente
    - **status: needs_clarification** - El agente necesita AÚN más información (máximo 3 preguntas)
    """,
)
async def create_service_request_with_clarification_endpoint(
    payload: ClarificationResponse,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequestResponse:
    return await ServiceRequestController.create_request_with_clarification(db, current_user, payload)


@router.get(
    "",
    response_model=List[ServiceRequestResponse],
    summary="Listar todas las solicitudes del cliente",
)
async def list_all_service_requests_endpoint(
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> List[ServiceRequestResponse]:
    return await ServiceRequestController.list_all_for_client(db, current_user)


@router.get(
    "/active",
    response_model=List[ServiceRequestResponse],
    summary="Listar solicitudes activas sin servicio asociado",
)
async def list_active_service_requests_endpoint(
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> List[ServiceRequestResponse]:
    return await ServiceRequestController.list_active_without_service(db, current_user)


@router.get(
    "/payments/history",
    response_model=List[PaymentHistoryItem],
    summary="Obtener el historial de pagos del cliente",
)
async def get_payment_history_endpoint(
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> List[PaymentHistoryItem]:
    return await ServiceRequestController.get_payment_history(db, current_user)


@router.post(
    "/rewrite",
    response_model=ServiceRequestRewriteOutput,
    summary="Reescribir título y descripción con AI",
)
async def rewrite_service_request_endpoint(
    payload: ServiceRequestRewriteInput,
    current_user: User = Depends(check_user_login),
) -> ServiceRequestRewriteOutput:
    """Usa AI para reescribir el título y descripción de forma más clara."""
    llm_controller = LLMController()
    result = llm_controller.rewrite_service_request(
        title=payload.title,
        description=payload.description,
    )

    request_type_str = result.get("request_type", "").upper()
    request_type = None
    if request_type_str == "FAST":
        request_type = ServiceRequestType.FAST
    elif request_type_str == "LICITACION":
        request_type = ServiceRequestType.LICITACION

    return ServiceRequestRewriteOutput(
        title=result.get("title", payload.title),
        description=result.get("description", payload.description),
        request_type=request_type,
    )


@router.get(
    "/{request_id}",
    response_model=ServiceRequestResponse,
    summary="Obtener el detalle de una solicitud",
)
async def get_service_request_endpoint(
    request_id: int,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequestResponse:
    return await ServiceRequestController.get_request_detail(
        db,
        current_user,
        request_id,
    )


@router.put(
    "/{request_id}",
    response_model=ServiceRequestResponse,
    summary="Actualizar parcialmente una solicitud",
)
async def update_service_request_endpoint(
    request_id: int,
    payload: ServiceRequestUpdate,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequestResponse:
    return await ServiceRequestController.update_request(
        db,
        current_user,
        request_id,
        payload,
    )


@router.post(
    "/{request_id}/cancel",
    response_model=ServiceRequestResponse,
    summary="Cancelar una licitación antes de confirmar un servicio",
)
async def cancel_service_request_endpoint(
    request_id: int,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequestResponse:
    return await ServiceRequestController.cancel_request(
        db,
        current_user,
        request_id,
    )


@router.post(
    "/{request_id}/confirm-payment",
    response_model=ServiceRequestResponse,
    summary="Confirmar el pago de una propuesta ganadora",
)
async def confirm_payment_endpoint(
    request_id: int,
    payload: ServiceRequestConfirmPayment,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequestResponse:
    return await ServiceRequestController.confirm_payment(
        db,
        current_user,
        request_id,
        payload,
    )


@router.post(
    "/{request_id}/service/cancel",
    response_model=ServiceRequestResponse,
    summary="Cancelar un servicio confirmado y solicitar reembolso",
)
async def cancel_service_endpoint(
    request_id: int,
    payload: ServiceCancelRequest | None = None,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequestResponse:
    return await ServiceRequestController.cancel_service(
        db,
        current_user,
        request_id,
        payload,
    )


@router.post(
    "/{request_id}/service/mark-in-progress",
    response_model=ServiceRequestResponse,
    summary="Marcar un servicio como en ejecución",
)
async def mark_service_in_progress_endpoint(
    request_id: int,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequestResponse:
    return await ServiceRequestController.mark_service_in_progress(
        db,
        current_user,
        request_id,
    )


@router.post(
    "/{request_id}/service/mark-on-route",
    response_model=ServiceRequestResponse,
    summary="Marcar un servicio como en camino",
)
async def mark_service_on_route_endpoint(
    request_id: int,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequestResponse:
    return await ServiceRequestController.mark_service_on_route(
        db,
        current_user,
        request_id,
    )


@router.post(
    "/{request_id}/service/review",
    response_model=ServiceRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar la calificación del servicio",
)
async def submit_service_review_endpoint(
    request_id: int,
    payload: ServiceReviewCreate,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequestResponse:
    return await ServiceRequestController.submit_service_review(
        db,
        current_user,
        request_id,
        payload,
    )
