from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, Sequence, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.Address import Address
from models.ProviderProfile import ProviderProfile
from models.ServiceRequest import (
    ProposalStatus,
    Service,
    ServiceRequest,
    ServiceRequestProposal,
    ServiceRequestImage,
    ServiceRequestStatus,
    ServiceRequestType,
    ServiceStatus,
)
from models.Tag import Tag, ServiceRequestTag
from models.ServiceRequestSchemas import (
    MAX_ATTACHMENTS,
    ServiceRequestAttachment,
    ServiceRequestConfirmPayment,
    ServiceRequestCreate,
    ServiceRequestUpdate,
)
from models.User import User, UserRole
from utils.error_handler import error_handler
from controllers.tags_controllers import TagsController
from controllers.llm_controller import LLMController

logger = logging.getLogger(__name__)

llm_controller = LLMController()

SERVICE_REQUESTS_FOLDER = "service-requests"
MANAGEMENT_FEE_RATE = Decimal("0.02")
TWO_DECIMALS = Decimal("0.01")


class ServiceRequestService:
    """Lógica central para el manejo de solicitudes de servicio."""

    @staticmethod
    @error_handler(logger)
    async def create_service_request(
        db: AsyncSession, *, current_user: User, payload: ServiceRequestCreate
    ) -> ServiceRequest:
        """Crea una nueva solicitud en base a los datos recibidos."""

        ServiceRequestService._ensure_client_role(current_user)
        await ServiceRequestService._validate_tags(db, payload.tag_ids)

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

        await ServiceRequestService._attach_tags(
            db,
            request_id=new_request.id,
            tag_ids=payload.tag_ids,
        )

        await TagsController.generate_tags_for_service_request(
            db,
            new_request,
            llm_controller.create_tags_for_request,
        )

        await db.commit()

        request_with_relations = (
            await ServiceRequestService._fetch_request_with_relations(
                db, new_request.id
            )
        )

        return request_with_relations

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
    @error_handler(logger)
    async def _validate_tags(db: AsyncSession, tag_ids: Sequence[int]) -> None:
        unique_ids = {tag_id for tag_id in tag_ids if tag_id is not None}
        if not unique_ids:
            return

        stmt: Select[tuple[int]] = select(Tag.id).where(Tag.id.in_(unique_ids))
        result = await db.execute(stmt)
        existing_ids = {row[0] for row in result.all()}

        missing = unique_ids - existing_ids
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Los siguientes tags no existen: {sorted(missing)}",
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
    async def _attach_tags(
        db: AsyncSession, *, request_id: int, tag_ids: Iterable[int]
    ) -> None:
        unique_ids = {tag_id for tag_id in tag_ids if tag_id is not None}
        for tag_id in unique_ids:
            db.add(
                ServiceRequestTag(
                    request_id=request_id,
                    tag_id=tag_id,
                    source="llm",
                )
            )

    @staticmethod
    async def _fetch_request_with_relations(
        db: AsyncSession, request_id: int, *, client_id: Optional[int] = None
    ) -> ServiceRequest:
        stmt: Select[ServiceRequest] = (
            select(ServiceRequest)
            .options(
                selectinload(ServiceRequest.images),
                selectinload(ServiceRequest.tag_links).selectinload(
                    ServiceRequestTag.tag
                ),
                selectinload(ServiceRequest.proposals).options(
                    selectinload(ServiceRequestProposal.provider).options(
                        selectinload(ProviderProfile.user)
                    )
                ),
                selectinload(ServiceRequest.service).options(
                    selectinload(Service.provider).options(
                        selectinload(ProviderProfile.user)
                    ),
                    selectinload(Service.proposal),
                    selectinload(Service.status_history),
                ),
                selectinload(ServiceRequest.address),
            )
            .where(ServiceRequest.id == request_id)
        )
        if client_id is not None:
            stmt = stmt.where(ServiceRequest.client_id == client_id)
        result = await db.execute(stmt)
        service_request = result.scalar_one_or_none()
        if not service_request:
            if client_id is not None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="La solicitud no existe o no pertenece al usuario",
                )
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
                selectinload(ServiceRequest.tag_links).selectinload(
                    ServiceRequestTag.tag
                ),
                selectinload(ServiceRequest.proposals).options(
                    selectinload(ServiceRequestProposal.provider).options(
                        selectinload(ProviderProfile.user)
                    )
                ),
                selectinload(ServiceRequest.service),
                selectinload(ServiceRequest.address),
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
    async def list_all_for_client(
        db: AsyncSession, *, client_id: int
    ) -> List[ServiceRequest]:
        stmt: Select[ServiceRequest] = (
            select(ServiceRequest)
            .options(
                selectinload(ServiceRequest.images),
                selectinload(ServiceRequest.tag_links).selectinload(
                    ServiceRequestTag.tag
                ),
                selectinload(ServiceRequest.proposals).options(
                    selectinload(ServiceRequestProposal.provider).options(
                        selectinload(ProviderProfile.user)
                    )
                ),
                selectinload(ServiceRequest.service),
                selectinload(ServiceRequest.address),
            )
            .where(ServiceRequest.client_id == client_id)
            .order_by(ServiceRequest.created_at.desc())
        )

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_request_for_client(
        db: AsyncSession, *, client_id: int, request_id: int
    ) -> ServiceRequest:
        return await ServiceRequestService._fetch_request_with_relations(
            db, request_id, client_id=client_id
        )

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
            db, service_request.id, client_id=client_id
        )

    @staticmethod
    async def confirm_payment(
        db: AsyncSession,
        *,
        client_id: int,
        request_id: int,
        payload: ServiceRequestConfirmPayment,
    ) -> ServiceRequest:
        # Recuperar solicitud con propuestas y dirección
        service_request = await ServiceRequestService._fetch_request_with_relations(
            db, request_id, client_id=client_id
        )

        if service_request.service is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La solicitud ya tiene un servicio confirmado",
            )

        if service_request.status not in {
            ServiceRequestStatus.PUBLISHED,
            ServiceRequestStatus.CLOSED,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La solicitud debe estar publicada para confirmar el pago",
            )

        proposals = list(service_request.proposals or [])
        if not proposals:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La solicitud no tiene propuestas para aceptar",
            )

        orphan_proposals = {
            proposal
            for proposal in proposals
            if not proposal.provider_profile_id or proposal.provider is None
        }
        if orphan_proposals:
            logger.warning(
                "Skip %d orphan proposals without provider profile when confirming payment",
                len(orphan_proposals),
            )

        selected_proposal: ServiceRequestProposal | None = None
        for proposal in proposals:
            if proposal.id == payload.proposal_id:
                selected_proposal = proposal
                break

        if selected_proposal is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La propuesta indicada no pertenece a la solicitud",
            )

        if selected_proposal in orphan_proposals:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "El prestador seleccionado ya no está disponible. Elegí otra oferta"
                    " o solicitá nuevas propuestas antes de pagar."
                ),
            )

        if selected_proposal.status not in {
            ProposalStatus.PENDING,
            ProposalStatus.ACCEPTED,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La propuesta seleccionada no se encuentra disponible",
            )

        # Actualizar estados de propuestas
        for proposal in proposals:
            if proposal in orphan_proposals:
                continue
            if proposal.id == selected_proposal.id:
                proposal.status = ProposalStatus.ACCEPTED
            else:
                proposal.status = ProposalStatus.REJECTED

        # Marcar la solicitud como cerrada
        service_request.status = ServiceRequestStatus.CLOSED

        # Crear registro de servicio confirmado
        base_price = selected_proposal.quoted_price or Decimal("0")
        total_with_fee = (base_price * (Decimal("1") + MANAGEMENT_FEE_RATE)).quantize(
            TWO_DECIMALS, rounding=ROUND_HALF_UP
        )
        service_entity = Service(
            request_id=service_request.id,
            proposal_id=selected_proposal.id,
            client_id=service_request.client_id,
            provider_profile_id=selected_proposal.provider_profile_id,
            status=ServiceStatus.CONFIRMED,
            total_price=total_with_fee,
        )

        # Adjuntar snapshot de dirección si está disponible
        if service_request.address:
            service_entity.address_snapshot = {
                "street": service_request.address.street,
                "title": service_request.address.title,
                "city": service_request.address.city,
                "state": service_request.address.state,
                "postal_code": service_request.address.postal_code,
                "country": service_request.address.country,
                "additional_info": service_request.address.additional_info,
                "latitude": float(service_request.address.latitude)
                if service_request.address.latitude is not None
                else None,
                "longitude": float(service_request.address.longitude)
                if service_request.address.longitude is not None
                else None,
            }

        if service_request.request_type == ServiceRequestType.FAST:
            service_entity.scheduled_start_at = datetime.now(timezone.utc).replace(
                tzinfo=None, microsecond=0
            )
        elif selected_proposal.proposed_start_at:
            service_entity.scheduled_start_at = selected_proposal.proposed_start_at
        if selected_proposal.proposed_end_at:
            service_entity.scheduled_end_at = selected_proposal.proposed_end_at

        db.add(service_entity)

        await db.commit()

        return await ServiceRequestService._fetch_request_with_relations(
            db, service_request.id, client_id=client_id
        )

    @staticmethod
    @error_handler(logger)
    async def cancel_request(
        db: AsyncSession,
        *,
        client_id: int,
        request_id: int,
    ) -> ServiceRequest:
        service_request = await ServiceRequestService._fetch_request_with_relations(
            db, request_id, client_id=client_id
        )

        if service_request.service is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No podés cancelar una solicitud que ya generó un servicio",
            )

        if service_request.status == ServiceRequestStatus.CANCELLED:
            return service_request

        proposals = list(service_request.proposals or [])
        for proposal in proposals:
            if proposal.status not in {
                ProposalStatus.REJECTED,
                ProposalStatus.WITHDRAWN,
                ProposalStatus.EXPIRED,
            }:
                proposal.status = ProposalStatus.REJECTED

        service_request.status = ServiceRequestStatus.CANCELLED

        await db.commit()

        return await ServiceRequestService._fetch_request_with_relations(
            db, service_request.id, client_id=client_id
        )

    @staticmethod
    async def cancel_service(
        db: AsyncSession,
        *,
        client_id: int,
        request_id: int,
    ) -> ServiceRequest:
        service_request = await ServiceRequestService._fetch_request_with_relations(
            db, request_id, client_id=client_id
        )

        service = service_request.service
        if service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La solicitud no tiene un servicio asociado",
            )

        if service.status != ServiceStatus.CONFIRMED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden cancelar servicios confirmados",
            )

        now = datetime.now(timezone.utc)
        scheduled_start = service.scheduled_start_at
        if scheduled_start is not None:
            if scheduled_start.tzinfo is None:
                scheduled_start = scheduled_start.replace(tzinfo=timezone.utc)
            if scheduled_start <= now:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No podés cancelar un servicio que ya comenzó",
                )

        service.status = ServiceStatus.CANCELED
        service_request.status = ServiceRequestStatus.CANCELLED

        await db.commit()

        return await ServiceRequestService._fetch_request_with_relations(
            db, service_request.id, client_id=client_id
        )

    @staticmethod
    async def mark_service_in_progress(
        db: AsyncSession,
        *,
        client_id: int,
        request_id: int,
    ) -> ServiceRequest:
        service_request = await ServiceRequestService._fetch_request_with_relations(
            db, request_id, client_id=client_id
        )

        service = service_request.service
        if service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La solicitud no tiene un servicio asociado",
            )

        if service.status not in {ServiceStatus.CONFIRMED, ServiceStatus.IN_PROGRESS}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El servicio no puede pasar a en ejecución",
            )

        now = datetime.now(timezone.utc)
        scheduled_start = service.scheduled_start_at
        if scheduled_start is not None:
            if scheduled_start.tzinfo is None:
                scheduled_start = scheduled_start.replace(tzinfo=timezone.utc)
            if scheduled_start > now:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El servicio aún no alcanzó la fecha de inicio",
                )

        service.status = ServiceStatus.IN_PROGRESS

        await db.commit()

        return await ServiceRequestService._fetch_request_with_relations(
            db, service_request.id, client_id=client_id
        )


__all__ = ["ServiceRequestService"]
