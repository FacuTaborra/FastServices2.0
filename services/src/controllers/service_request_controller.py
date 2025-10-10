"""Controlador para operaciones sobre solicitudes de servicio."""

from __future__ import annotations

import logging
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models.ServiceRequest import ServiceRequest
from models.ServiceRequestSchemas import (
    ServiceRequestCreate,
    ServiceRequestImageResponse,
    ServiceRequestResponse,
)
from models.User import User
from services.service_request_service import ServiceRequestService

logger = logging.getLogger(__name__)


class ServiceRequestController:
    """Controlador de alto nivel para solicitudes de servicio."""

    @staticmethod
    async def create_request(
        db: AsyncSession, current_user: User, payload: ServiceRequestCreate
    ) -> ServiceRequestResponse:
        try:
            service_request = await ServiceRequestService.create_service_request(
                db, current_user=current_user, payload=payload
            )
            return ServiceRequestController._build_response(service_request)
        except HTTPException:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.exception("Error creando solicitud de servicio: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al crear la solicitud",
            ) from exc

    @staticmethod
    async def list_active_without_service(
        db: AsyncSession, current_user: User
    ) -> List[ServiceRequestResponse]:
        try:
            requests = await ServiceRequestService.list_active_without_service(
                db, client_id=current_user.id
            )
            return [
                ServiceRequestController._build_response(request)
                for request in requests
            ]
        except HTTPException:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.exception(
                "Error listando solicitudes activas del cliente %s: %s",
                current_user.id,
                exc,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al obtener las solicitudes activas",
            ) from exc

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _build_response(service_request: ServiceRequest) -> ServiceRequestResponse:
        attachments = ServiceRequestController._serialize_attachments(service_request)
        license_type_ids = sorted(
            {
                inference.license_type_id
                for inference in service_request.inferred_licenses
            }
        )

        return ServiceRequestResponse(
            id=service_request.id,
            client_id=service_request.client_id,
            address_id=service_request.address_id,
            title=service_request.title,
            description=service_request.description,
            request_type=service_request.request_type,
            status=service_request.status,
            preferred_start_at=service_request.preferred_start_at,
            preferred_end_at=service_request.preferred_end_at,
            bidding_deadline=service_request.bidding_deadline,
            city_snapshot=service_request.city_snapshot,
            lat_snapshot=service_request.lat_snapshot,
            lon_snapshot=service_request.lon_snapshot,
            license_type_ids=license_type_ids,
            attachments=attachments,
            created_at=service_request.created_at,
            updated_at=service_request.updated_at,
        )

    @staticmethod
    def _serialize_attachments(
        service_request: ServiceRequest,
    ) -> List[ServiceRequestImageResponse]:
        images = list(service_request.images or [])
        images.sort(key=lambda img: (img.sort_order or 0, img.id))
        return [ServiceRequestImageResponse.model_validate(img) for img in images]


__all__ = ["ServiceRequestController"]
