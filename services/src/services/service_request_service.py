"""Servicios de negocio para solicitudes de servicio."""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Iterable, Sequence, List

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.Address import Address
from models.ProviderProfile import LicenseType, ProviderProfile
from models.ServiceRequest import (
    RequestInferredLicense,
    ServiceRequest,
    ServiceRequestProposal,
    ServiceRequestImage,
    ServiceRequestStatus,
    ServiceRequestType,
    ValidationStatus,
)
from models.ServiceRequestSchemas import (
    MAX_ATTACHMENTS,
    ServiceRequestAttachment,
    ServiceRequestCreate,
    ServiceRequestUpdate,
)
from models.User import User, UserRole

logger = logging.getLogger(__name__)

SERVICE_REQUESTS_FOLDER = "service-requests"


class ServiceRequestService:
    """Lógica central para el manejo de solicitudes de servicio."""

    @staticmethod
    async def create_service_request(
        db: AsyncSession, *, current_user: User, payload: ServiceRequestCreate
    ) -> ServiceRequest:
        """Crea una nueva solicitud en base a los datos recibidos."""

        ServiceRequestService._ensure_client_role(current_user)
        await ServiceRequestService._validate_license_types(
            db, payload.license_type_ids
        )

        if (
            payload.request_type == ServiceRequestType.LICITACION
            and payload.bidding_deadline is None
        ):
            now = datetime.now(timezone.utc)
            auto_deadline = (now + timedelta(hours=72)).replace(
                minute=0, second=0, microsecond=0
            )
            payload.bidding_deadline = auto_deadline

        address = await ServiceRequestService._get_user_address(
            db, user_id=current_user.id, address_id=payload.address_id
        )

        ServiceRequestService._validate_temporal_fields(payload)

        normalized_title = ServiceRequestService._resolve_title(
            title=payload.title,
            description=payload.description,
            request_type=payload.request_type,
        )

        city_snapshot = address.city if address else None
        lat_snapshot = address.latitude if address else None
        lon_snapshot = address.longitude if address else None

        new_request = ServiceRequest(
            client_id=current_user.id,
            address_id=payload.address_id,
            title=normalized_title,
            description=payload.description,
            request_type=payload.request_type,
            status=ServiceRequestStatus.PUBLISHED,
            preferred_start_at=payload.preferred_start_at,
            preferred_end_at=payload.preferred_end_at,
            bidding_deadline=payload.bidding_deadline,
            city_snapshot=city_snapshot,
            lat_snapshot=lat_snapshot,
            lon_snapshot=lon_snapshot,
        )

        db.add(new_request)
        await db.flush()

        ServiceRequestService._validate_attachments(payload.attachments)
        await ServiceRequestService._attach_images(
            db, request_id=new_request.id, attachments=payload.attachments
        )

        await ServiceRequestService._create_inferred_licenses(
            db,
            request_id=new_request.id,
            license_type_ids=payload.license_type_ids,
        )

        await db.commit()

        request_with_relations = (
            await ServiceRequestService._fetch_request_with_relations(
                db, new_request.id
            )
        )

        return request_with_relations

    # ------------------------------------------------------------------
    # Validaciones
    # ------------------------------------------------------------------
    @staticmethod
    def _ensure_client_role(user: User) -> None:
        if user.role not in {UserRole.CLIENT, "client"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sólo los clientes pueden crear solicitudes",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="La cuenta del usuario está inactiva",
            )

    @staticmethod
    async def _validate_license_types(
        db: AsyncSession, license_type_ids: Sequence[int]
    ) -> None:
        unique_ids = {lt_id for lt_id in license_type_ids if lt_id is not None}
        if not unique_ids:
            return

        stmt: Select[tuple[int]] = select(LicenseType.id).where(
            LicenseType.id.in_(unique_ids)
        )
        result = await db.execute(stmt)
        existing_ids = {row[0] for row in result.all()}

        missing = unique_ids - existing_ids
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Los siguientes tipos de licencia no existen: {sorted(missing)}",
            )

    @staticmethod
    async def _get_user_address(
        db: AsyncSession, *, user_id: int, address_id: int
    ) -> Address:
        stmt: Select[Address] = select(Address).where(
            Address.id == address_id,
            Address.user_id == user_id,
            Address.is_active,
        )
        result = await db.execute(stmt)
        address = result.scalar_one_or_none()

        if address is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La dirección no existe o no pertenece al usuario",
            )

        return address

    @staticmethod
    def _validate_temporal_fields(payload: ServiceRequestCreate) -> None:
        if (
            payload.request_type == ServiceRequestType.LICITACION
            and payload.bidding_deadline
        ):
            now = datetime.now(timezone.utc)
            # Si la fecha es naïve la asumimos en UTC
            candidate = payload.bidding_deadline
            if candidate.tzinfo is None:
                candidate = candidate.replace(tzinfo=timezone.utc)

            if candidate <= now:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El bidding_deadline debe ser una fecha futura",
                )

            max_delta = timedelta(hours=72)
            if candidate - now > max_delta:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El bidding_deadline no puede superar las 72 horas.",
                )

        if payload.preferred_start_at and payload.preferred_end_at:
            if payload.preferred_end_at < payload.preferred_start_at:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La fecha de fin debe ser posterior a la de inicio",
                )

    @staticmethod
    def _resolve_title(
        *, title: str | None, description: str, request_type: ServiceRequestType
    ) -> str | None:
        if title:
            return title

        sanitized = " ".join(description.strip().split())
        words = sanitized.split(" ")
        snippet = " ".join(words[:8]) if words else sanitized
        prefix = "[LIC]" if request_type == ServiceRequestType.LICITACION else "[FAST]"
        generated = f"{prefix} {snippet}".strip()

        if len(generated) <= 150:
            return generated

        return generated[:147].rstrip() + "..."

    @staticmethod
    def _validate_attachments(attachments: Sequence[ServiceRequestAttachment]) -> None:
        if len(attachments) > MAX_ATTACHMENTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Solo se permiten {MAX_ATTACHMENTS} imágenes por solicitud",
            )

        keys = set()
        for attachment in attachments:
            if attachment.s3_key in keys:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Las imágenes adjuntas no pueden repetirse",
                )
            keys.add(attachment.s3_key)

    # ------------------------------------------------------------------
    # Operaciones auxiliares
    # ------------------------------------------------------------------
    @staticmethod
    async def _attach_images(
        db: AsyncSession,
        *,
        request_id: int,
        attachments: Sequence[ServiceRequestAttachment],
    ) -> None:
        for index, attachment in enumerate(attachments):
            normalized_key = ServiceRequestService._normalize_attachment_key(
                attachment.s3_key, request_id
            )

            image = ServiceRequestImage(
                request_id=request_id,
                s3_key=normalized_key,
                public_url=attachment.public_url,
                caption=attachment.caption,
                sort_order=attachment.sort_order
                if attachment.sort_order is not None
                else index,
            )
            db.add(image)

    @staticmethod
    def _normalize_attachment_key(original_key: str, request_id: int) -> str:
        key = original_key.strip().lstrip("/")
        if key.startswith(f"{SERVICE_REQUESTS_FOLDER}/"):
            return key
        return f"{SERVICE_REQUESTS_FOLDER}/{request_id}/{key}"

    @staticmethod
    async def _create_inferred_licenses(
        db: AsyncSession, *, request_id: int, license_type_ids: Iterable[int]
    ) -> None:
        unique_ids = {lt_id for lt_id in license_type_ids if lt_id is not None}
        for license_type_id in unique_ids:
            inference = RequestInferredLicense(
                request_id=request_id,
                license_type_id=license_type_id,
                confidence=None,
                validation_status=ValidationStatus.AUTO,
            )
            db.add(inference)

    @staticmethod
    async def _fetch_request_with_relations(
        db: AsyncSession, request_id: int
    ) -> ServiceRequest:
        stmt: Select[ServiceRequest] = (
            select(ServiceRequest)
            .options(
                selectinload(ServiceRequest.images),
                selectinload(ServiceRequest.inferred_licenses),
                selectinload(ServiceRequest.proposals).options(
                    selectinload(ServiceRequestProposal.provider).options(
                        selectinload(ProviderProfile.user)
                    )
                ),
            )
            .where(ServiceRequest.id == request_id)
        )
        result = await db.execute(stmt)
        service_request = result.scalar_one_or_none()
        if not service_request:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo recuperar la solicitud recién creada",
            )
        return service_request

    @staticmethod
    async def list_active_without_service(
        db: AsyncSession, *, client_id: int
    ) -> List[ServiceRequest]:
        stmt: Select[ServiceRequest] = (
            select(ServiceRequest)
            .options(
                selectinload(ServiceRequest.images),
                selectinload(ServiceRequest.inferred_licenses),
                selectinload(ServiceRequest.proposals).options(
                    selectinload(ServiceRequestProposal.provider).options(
                        selectinload(ProviderProfile.user)
                    )
                ),
            )
            .where(
                ServiceRequest.client_id == client_id,
                ServiceRequest.status == ServiceRequestStatus.PUBLISHED,
                ServiceRequest.service == None,  # noqa: E711
            )
            .order_by(ServiceRequest.created_at.desc())
        )

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def update_service_request(
        db: AsyncSession,
        *,
        client_id: int,
        request_id: int,
        payload: ServiceRequestUpdate,
    ) -> ServiceRequest:
        stmt: Select[ServiceRequest] = select(ServiceRequest).where(
            ServiceRequest.id == request_id,
            ServiceRequest.client_id == client_id,
        )
        result = await db.execute(stmt)
        service_request = result.scalar_one_or_none()

        if service_request is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La solicitud no existe o no pertenece al usuario",
            )

        has_changes = False

        if payload.status is not None:
            if (
                service_request.status == ServiceRequestStatus.CANCELLED
                and payload.status == ServiceRequestStatus.CANCELLED
            ):
                pass
            else:
                service_request.status = payload.status
                has_changes = True

        if payload.request_type is not None:
            if service_request.request_type == payload.request_type:
                pass
            else:
                if (
                    service_request.request_type != ServiceRequestType.FAST
                    and payload.request_type == ServiceRequestType.LICITACION
                ):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Solo las solicitudes FAST pueden pasar a licitación",
                    )

                service_request.request_type = payload.request_type
                has_changes = True

                if payload.request_type == ServiceRequestType.LICITACION:
                    now = datetime.now(timezone.utc)
                    bidding_deadline = (now + timedelta(hours=72)).replace(
                        minute=0, second=0, microsecond=0
                    )
                    service_request.bidding_deadline = bidding_deadline
                elif payload.request_type == ServiceRequestType.FAST:
                    service_request.bidding_deadline = None

        if has_changes:
            await db.commit()

        return await ServiceRequestService._fetch_request_with_relations(
            db, service_request.id
        )


__all__ = ["ServiceRequestService"]
