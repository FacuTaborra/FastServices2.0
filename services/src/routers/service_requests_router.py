"""Router para endpoints de solicitudes de servicio."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.auth_utils import check_user_login
from controllers.service_request_controller import ServiceRequestController
from database.database import get_db
from models.ServiceRequestSchemas import (
    ServiceRequestCreate,
    ServiceRequestResponse,
    ServiceRequestUpdate,
)
from models.User import User

router = APIRouter(prefix="/service-requests", tags=["service_requests"])


@router.post(
    "",
    response_model=ServiceRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una solicitud de servicio",
)
async def create_service_request_endpoint(
    payload: ServiceRequestCreate,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequestResponse:
    """Crea una nueva solicitud de servicio para el cliente autenticado."""
    return await ServiceRequestController.create_request(db, current_user, payload)


@router.get(
    "/active",
    response_model=List[ServiceRequestResponse],
    summary="Listar solicitudes activas sin servicio asociado",
)
async def list_active_service_requests_endpoint(
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> List[ServiceRequestResponse]:
    """Obtiene las solicitudes publicadas del cliente que aún no tienen un servicio generado."""
    return await ServiceRequestController.list_active_without_service(db, current_user)


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
    """Permite modificar estado o tipo de una solicitud existente."""
    return await ServiceRequestController.update_request(
        db,
        current_user,
        request_id,
        payload,
    )
