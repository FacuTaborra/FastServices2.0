from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, Sequence, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import Select, select, or_
from sqlalchemy.exc import IntegrityError
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
    ServiceType,
    ServiceReview,
    ServiceStatusHistory,
)
from models.Tag import Tag, ServiceRequestTag
from models.ServiceRequestSchemas import (
    MAX_ATTACHMENTS,
    ServiceRequestAttachment,
    ServiceRequestConfirmPayment,
    ServiceRequestCreate,
    ServiceRequestUpdate,
    ServiceReviewCreate,
    PaymentHistoryItem,
    RehireRequestCreate,
    WarrantyClaimCreate,
)
from models.User import User, UserRole
from utils.error_handler import error_handler
from controllers.tags_controllers import TagsController
from controllers.llm_controller import LLMController
from services.notification_service import notification_service

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
            # Guardar en hora Argentina (UTC-3) naive, consistente con created_at
            now_ar = datetime.now(timezone(timedelta(hours=-3)))
            payload.bidding_deadline = (now_ar + timedelta(hours=72)).replace(
                tzinfo=None
            )

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
            # Guardar explícitamente con hora Argentina (UTC-3) para evitar conversiones en frontend
            created_at=datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None),
            updated_at=datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None),
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
            now = datetime.now(timezone(timedelta(hours=-3)))
            # Si la fecha es naïve la asumimos en UTC-3
            candidate = payload.bidding_deadline
            if candidate.tzinfo is None:
                candidate = candidate.replace(tzinfo=timezone(timedelta(hours=-3)))

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
        
        # RECONTRATACION no lleva prefijo, se distingue por el badge de color
        if request_type == ServiceRequestType.RECONTRATACION:
            generated = snippet.strip()
        elif request_type == ServiceRequestType.LICITACION:
            generated = f"[LIC] {snippet}".strip()
        else:
            generated = f"[FAST] {snippet}".strip()

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
                    selectinload(Service.reviews),
                ),
                selectinload(ServiceRequest.address),
                selectinload(ServiceRequest.target_provider).selectinload(
                    ProviderProfile.user
                ),
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
                selectinload(ServiceRequest.service).options(
                    selectinload(Service.provider).options(
                        selectinload(ProviderProfile.user)
                    ),
                    selectinload(Service.proposal),
                    selectinload(Service.status_history),
                    selectinload(Service.reviews),
                ),
                selectinload(ServiceRequest.address),
                selectinload(ServiceRequest.target_provider).selectinload(
                    ProviderProfile.user
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
    async def list_all_for_client(
        db: AsyncSession, *, client_id: int
    ) -> List[ServiceRequest]:
        # Calcular el límite de 24 horas para servicios cancelados
        cutoff_time = datetime.now(timezone(timedelta(hours=-3))).replace(
            tzinfo=None
        ) - timedelta(hours=24)

        stmt: Select[ServiceRequest] = (
            select(ServiceRequest)
            .outerjoin(Service, ServiceRequest.id == Service.request_id)
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
                    selectinload(Service.reviews),
                ),
                selectinload(ServiceRequest.address),
                selectinload(ServiceRequest.target_provider).selectinload(
                    ProviderProfile.user
                ),
            )
            .where(
                ServiceRequest.client_id == client_id,
                # Filtrar solicitudes canceladas (CANCELLED) de más de 24hs
                or_(
                    ServiceRequest.status != ServiceRequestStatus.CANCELLED,
                    ServiceRequest.updated_at >= cutoff_time,
                ),
                # Filtrar servicios cancelados (CANCELED) de más de 24hs
                or_(
                    Service.id.is_(None),  # Sin servicio asociado
                    Service.status != ServiceStatus.CANCELED,  # Servicio no cancelado
                    Service.updated_at >= cutoff_time,  # Cancelado hace menos de 24hs
                ),
            )
            .order_by(ServiceRequest.created_at.desc())
        )

        result = await db.execute(stmt)
        return list(result.scalars().unique().all())

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
                    # Guardar en hora Argentina (UTC-3) naive, consistente con created_at
                    now_ar = datetime.now(timezone(timedelta(hours=-3)))
                    service_request.bidding_deadline = (
                        now_ar + timedelta(hours=72)
                    ).replace(tzinfo=None)
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
            currency=selected_proposal.currency,
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
            # Guardar horario actual de Argentina (UTC-3) al confirmar
            service_entity.scheduled_start_at = datetime.now(
                timezone(timedelta(hours=-3))
            ).replace(tzinfo=None, microsecond=0)
        elif selected_proposal.proposed_start_at:
            service_entity.scheduled_start_at = selected_proposal.proposed_start_at
        if selected_proposal.proposed_end_at:
            service_entity.scheduled_end_at = selected_proposal.proposed_end_at

        db.add(service_entity)
        await db.flush()

        # Crear registro inicial de historial con hora Argentina (UTC-3)
        initial_history = ServiceStatusHistory(
            service_id=service_entity.id,
            from_status=None,
            to_status=ServiceStatus.CONFIRMED.value,
            changed_at=datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None),
        )
        db.add(initial_history)

        await db.commit()

        # Notificar al prestador
        try:
            provider_user_id = selected_proposal.provider.user_id
            if provider_user_id:
                await notification_service.send_notification_to_user(
                    db,
                    user_id=provider_user_id,
                    title="¡Presupuesto Aceptado!",
                    body=f"El cliente confirmó tu presupuesto para '{service_request.title}'.",
                    data={"requestId": service_request.id, "type": "proposal_accepted"},
                )
        except Exception as e:
            logger.error(f"Error enviando notificacion push: {e}")

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

        if service.status not in {ServiceStatus.CONFIRMED, ServiceStatus.ON_ROUTE}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden cancelar servicios confirmados o en camino",
            )

        # Si el estado es CONFIRMED o ON_ROUTE, se puede cancelar
        # (el estado ya indica si el servicio realmente comenzó o no)

        service.status = ServiceStatus.CANCELED
        service_request.status = ServiceRequestStatus.CANCELLED

        await db.commit()

        return await ServiceRequestService._fetch_request_with_relations(
            db, service_request.id, client_id=client_id
        )

    @staticmethod
    @error_handler(logger)
    async def submit_service_review(
        db: AsyncSession,
        *,
        client_id: int,
        request_id: int,
        payload: ServiceReviewCreate,
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

        normalized_status = (
            service.status.value
            if isinstance(service.status, ServiceStatus)
            else service.status
        )
        if normalized_status != ServiceStatus.COMPLETED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo podés calificar servicios completados",
            )

        provider_profile = service.provider
        if provider_profile is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El servicio no tiene un proveedor para calificar",
            )

        existing_review = next(
            (
                review
                for review in list(getattr(service, "reviews", []) or [])
                if review.rater_user_id == client_id
            ),
            None,
        )
        if existing_review is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya calificaste este servicio",
            )

        new_review = ServiceReview(
            service_id=service.id,
            rater_user_id=client_id,
            ratee_provider_profile_id=provider_profile.id,
            rating=payload.rating,
            comment=payload.comment,
        )
        db.add(new_review)

        try:
            await db.flush()
        except IntegrityError as exc:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya calificaste este servicio",
            ) from exc

        current_total = provider_profile.total_reviews or 0
        current_avg_value = provider_profile.rating_avg
        current_avg = (
            Decimal(current_avg_value)
            if current_avg_value is not None
            else Decimal("0")
        )

        new_total = current_total + 1
        aggregated = (current_avg * current_total) + Decimal(payload.rating)
        provider_profile.total_reviews = new_total
        provider_profile.rating_avg = (aggregated / Decimal(new_total)).quantize(
            TWO_DECIMALS, rounding=ROUND_HALF_UP
        )

        await db.commit()

        # Notificar al prestador
        try:
            provider_user_id = provider_profile.user_id
            if provider_user_id:
                await notification_service.send_notification_to_user(
                    db,
                    user_id=provider_user_id,
                    title="¡Nueva calificación recibida!",
                    body=f"Un cliente calificó tu servicio con {payload.rating} estrellas.",
                    data={"requestId": service_request.id, "type": "service_reviewed"},
                )
        except Exception as e:
            logger.error(f"Error enviando notificacion push: {e}")

        return await ServiceRequestService._fetch_request_with_relations(
            db, service_request.id, client_id=client_id
        )

    @staticmethod
    async def mark_service_on_route(
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

        if service.status not in {ServiceStatus.CONFIRMED, ServiceStatus.ON_ROUTE}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El servicio no puede marcarse como en camino",
            )

        if service.status == ServiceStatus.ON_ROUTE:
            return service_request

        service.status = ServiceStatus.ON_ROUTE

        await db.commit()

        # Notificar al cliente
        try:
            await notification_service.send_notification_to_user(
                db,
                user_id=client_id,
                title="¡Prestador en camino!",
                body=f"El prestador ya está yendo a tu domicilio para el servicio '{service_request.title}'.",
                data={"requestId": service_request.id, "type": "service_on_route"},
            )
        except Exception as e:
            logger.error(f"Error enviando notificacion push: {e}")

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

        if service.status not in {
            ServiceStatus.CONFIRMED,
            ServiceStatus.ON_ROUTE,
            ServiceStatus.IN_PROGRESS,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El servicio no puede pasar a en ejecución",
            )

        now = datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None)
        scheduled_start = service.scheduled_start_at
        if scheduled_start is not None:
            if scheduled_start.tzinfo is not None:
                scheduled_start = scheduled_start.replace(tzinfo=None)
            if scheduled_start > now:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El servicio aún no alcanzó la fecha de inicio",
                )

        service.status = ServiceStatus.IN_PROGRESS

        await db.commit()

        # Notificar al cliente
        try:
            await notification_service.send_notification_to_user(
                db,
                user_id=client_id,
                title="¡Servicio iniciado!",
                body=f"El prestador ha comenzado a trabajar en '{service_request.title}'.",
                data={"requestId": service_request.id, "type": "service_in_progress"},
            )
        except Exception as e:
            logger.error(f"Error enviando notificacion push: {e}")

        return await ServiceRequestService._fetch_request_with_relations(
            db, service_request.id, client_id=client_id
        )

    @staticmethod
    async def get_payment_history(
        db: AsyncSession, *, client_id: int
    ) -> List[PaymentHistoryItem]:
        """Recupera el historial de pagos (servicios confirmados) del cliente."""

        # Traemos los servicios donde el usuario es cliente, junto con info del request y provider
        stmt = (
            select(Service)
            .options(
                selectinload(Service.request),
                selectinload(Service.provider).selectinload(ProviderProfile.user),
            )
            .where(
                Service.client_id == client_id,
                Service.status
                != ServiceStatus.CANCELED,  # Opcional: mostrar cancelados como reembolsados?
                # Por ahora mostramos todo menos lo que no sea pago efectivo, aunque la logica de 'pago'
                # en este sistema es al confirmar.
                # Si se cancela despues, deberia figurar como reembolsado o similar.
                # Dejamos que se muestren todos los que alguna vez se confirmaron.
            )
            .order_by(Service.created_at.desc())
        )

        result = await db.execute(stmt)
        services = result.scalars().all()

        history = []
        for svc in services:
            # Construimos el item
            # Título del servicio viene de svc.request.title
            # Nombre prestador de svc.provider.user.first_name + last_name o fantasia

            provider_name = "Prestador"
            if svc.provider and svc.provider.user:
                provider_name = (
                    f"{svc.provider.user.first_name} {svc.provider.user.last_name}"
                )

            item = PaymentHistoryItem(
                id=str(svc.id),
                service_id=svc.id,
                service_title=svc.request.title
                if svc.request
                else "Servicio sin título",
                provider_name=provider_name,
                date=svc.created_at,  # Fecha de confirmacion del pago/servicio
                amount=svc.total_price or Decimal(0),
                currency=svc.currency or "ARS",
                status=svc.status,
            )
            history.append(item)

        return history

    @staticmethod
    @error_handler(logger)
    async def create_rehire_request(
        db: AsyncSession, *, current_user: User, payload: RehireRequestCreate
    ) -> ServiceRequest:
        """Crea una nueva solicitud de recontratación dirigida a un proveedor específico."""

        ServiceRequestService._ensure_client_role(current_user)

        # Obtener el servicio original con sus relaciones
        stmt = (
            select(Service)
            .options(
                selectinload(Service.request).selectinload(ServiceRequest.address),
                selectinload(Service.provider).selectinload(ProviderProfile.user),
            )
            .where(Service.id == payload.service_id)
        )
        result = await db.execute(stmt)
        original_service = result.scalar_one_or_none()

        if original_service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El servicio indicado no existe",
            )

        # Validar que el servicio pertenece al cliente
        if original_service.client_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No podés recontratar un servicio que no te pertenece",
            )

        # Validar que el servicio está completado
        normalized_status = (
            original_service.status.value
            if isinstance(original_service.status, ServiceStatus)
            else original_service.status
        )
        if normalized_status != ServiceStatus.COMPLETED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo podés recontratar servicios que estén completados",
            )

        # Obtener dirección del servicio original
        original_request = original_service.request
        if original_request is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El servicio no tiene una solicitud asociada",
            )

        address = original_request.address
        address_id = original_request.address_id

        # Obtener proveedor target
        provider_profile = original_service.provider
        if provider_profile is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El servicio no tiene un proveedor asociado",
            )

        # Usar título del payload o generar uno automático
        generated_title = ServiceRequestService._resolve_title(
            title=payload.title,
            description=payload.description,
            request_type=ServiceRequestType.RECONTRATACION,
        )

        city_snapshot = address.city if address else original_request.city_snapshot
        lat_snapshot = address.latitude if address else original_request.lat_snapshot
        lon_snapshot = address.longitude if address else original_request.lon_snapshot

        # Crear la nueva solicitud
        new_request = ServiceRequest(
            client_id=current_user.id,
            address_id=address_id,
            parent_service_id=original_service.id,
            target_provider_profile_id=provider_profile.id,
            title=generated_title,
            description=payload.description,
            request_type=ServiceRequestType.RECONTRATACION,
            status=ServiceRequestStatus.PUBLISHED,
            city_snapshot=city_snapshot,
            lat_snapshot=lat_snapshot,
            lon_snapshot=lon_snapshot,
            created_at=datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None),
            updated_at=datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None),
        )

        db.add(new_request)
        await db.flush()

        # Adjuntar imágenes si las hay
        ServiceRequestService._validate_attachments(payload.attachments)
        await ServiceRequestService._attach_images(
            db, request_id=new_request.id, attachments=payload.attachments
        )

        await db.commit()

        # Notificar al proveedor
        try:
            provider_user_id = provider_profile.user_id
            if provider_user_id:
                provider_name = "Cliente"
                if current_user.first_name:
                    provider_name = current_user.first_name
                await notification_service.send_notification_to_user(
                    db,
                    user_id=provider_user_id,
                    title="¡Nueva solicitud de recontratación!",
                    body=f"{provider_name} quiere volver a contratarte para un nuevo trabajo.",
                    data={"requestId": new_request.id, "type": "rehire_request"},
                )
        except Exception as e:
            logger.error(f"Error enviando notificacion push de recontratación: {e}")

        return await ServiceRequestService._fetch_request_with_relations(
            db, new_request.id
        )

    @staticmethod
    @error_handler(logger)
    async def create_warranty_claim(
        db: AsyncSession, *, current_user: User, service_id: int, payload: WarrantyClaimCreate
    ) -> ServiceRequest:
        """
        Reabre un servicio completado para atender un reclamo de garantía.
        
        En lugar de crear un servicio separado, el servicio original vuelve a estado
        CONFIRMED y se registra la descripción del reclamo. El historial de estados
        refleja todo el ciclo de vida del servicio.
        """

        ServiceRequestService._ensure_client_role(current_user)

        # Obtener el servicio con sus relaciones
        stmt = (
            select(Service)
            .options(
                selectinload(Service.request).selectinload(ServiceRequest.address),
                selectinload(Service.provider).selectinload(ProviderProfile.user),
            )
            .where(Service.id == service_id)
        )
        result = await db.execute(stmt)
        service = result.scalar_one_or_none()

        if service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El servicio indicado no existe",
            )

        # Validar que el servicio pertenece al cliente
        if service.client_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No podés solicitar garantía de un servicio que no te pertenece",
            )

        # Validar que el servicio está completado
        normalized_status = (
            service.status.value
            if isinstance(service.status, ServiceStatus)
            else service.status
        )
        if normalized_status != ServiceStatus.COMPLETED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo podés solicitar garantía de servicios completados",
            )

        # Validar que está dentro del período de garantía
        now = datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None)
        warranty_expires = service.warranty_expires_at

        if warranty_expires is None:
            # Si no tiene fecha de garantía, calcularla desde updated_at + 30 días
            service_completed_at = service.updated_at or service.created_at
            warranty_expires = service_completed_at + timedelta(days=30)

        if now > warranty_expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El período de garantía de 30 días ha expirado",
            )

        # Validar que tiene proveedor
        provider_profile = service.provider
        if provider_profile is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El servicio no tiene un proveedor asociado",
            )

        # Validar que tiene request asociado
        if service.request_id is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El servicio no tiene una solicitud asociada",
            )

        # Reabrir el servicio: cambiar estado a CONFIRMED
        previous_status = normalized_status
        service.status = ServiceStatus.CONFIRMED
        service.warranty_claim_description = payload.description
        service.updated_at = now

        # Registrar en el historial el cambio de estado por garantía
        history_entry = ServiceStatusHistory(
            service_id=service.id,
            from_status=previous_status,
            to_status=ServiceStatus.CONFIRMED.value,
            changed_by=current_user.id,
            changed_at=now,
        )
        db.add(history_entry)

        await db.commit()

        # Notificar al proveedor
        try:
            provider_user_id = provider_profile.user_id
            if provider_user_id:
                request_title = service.request.title if service.request else "tu servicio"

                await notification_service.send_notification_to_user(
                    db,
                    user_id=provider_user_id,
                    title="¡Solicitud de garantía!",
                    body=f"Un cliente ha solicitado garantía para '{request_title}'. Coordiná la visita sin costo.",
                    data={"requestId": service.request_id, "type": "warranty_claim"},
                )
        except Exception as e:
            logger.error(f"Error enviando notificacion push de garantía: {e}")

        # Retornar el ServiceRequest con el servicio reabierto
        return await ServiceRequestService._fetch_request_with_relations(
            db, service.request_id, client_id=current_user.id
        )


__all__ = ["ServiceRequestService"]
