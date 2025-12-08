import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, case, or_, and_, func
from sqlalchemy.orm import selectinload, aliased
from fastapi import HTTPException, status
from models.User import User, UserRole
from models.ProviderProfile import (
    ProviderProfile,
    ProviderLicense,
    ProviderRegisterRequest,
    ProviderProfileUpdate,
    ProviderResponse,
    ProviderProfileResponse,
    ProviderLicenseResponse,
    ProviderLicenseCreate,
    ProviderProposalResponse,
    ProviderProposalCreate,
    ProviderServiceResponse,
    ProviderServiceRequestPreview,
    ProviderServiceStatusHistory,
    ProviderOverviewKpisResponse,
    ProviderRevenuePoint,
    ProviderRevenueStatsResponse,
    ProviderRatingBucket,
    ProviderRatingDistributionPoint,
    ProviderRatingDistributionResponse,
)
from models.Tag import ProviderLicenseTag, ProviderLicenseTagResponse, TagResponse
from models.ServiceRequest import (
    ServiceRequest,
    ServiceRequestStatus,
    ServiceRequestProposal,
    Service,
    ServiceRequestType,
    ServiceStatus,
    ServiceStatusHistory,
    ProposalStatus,
    Currency,
    ServiceReview,
)
from models.Tag import ServiceRequestTag
from models.Address import Address
from models.ServiceRequestSchemas import (
    ServiceRequestResponse,
    CurrencyResponse,
    ServiceReviewResponse,
)
from controllers.service_request_controller import ServiceRequestController
from auth.auth_utils import get_password_hash
from utils.error_handler import error_handler
from controllers.tags_controllers import TagsController
from controllers.llm_controller import LLMController
from services.notification_service import notification_service

logger = logging.getLogger(__name__)

llm_controller = LLMController()


def _normalize_to_utc_naive(value: Optional[datetime]) -> Optional[datetime]:
    """Devuelve un datetime naive en UTC-3 (Argentina) para almacenar o comparar."""

    if value is None:
        return None

    if value.tzinfo is None:
        return value

    # Convertir a UTC-3
    return value.astimezone(timezone(timedelta(hours=-3))).replace(tzinfo=None)


class ProviderController:
    @staticmethod
    @error_handler(logger)
    async def create_provider(
        db: AsyncSession, provider_data: ProviderRegisterRequest
    ) -> ProviderResponse:
        password_hash = get_password_hash(provider_data.password)

        new_user = User(
            role=UserRole.PROVIDER,
            first_name=provider_data.first_name,
            last_name=provider_data.last_name,
            email=provider_data.email,
            phone=provider_data.phone,
            date_of_birth=provider_data.date_of_birth,
            password_hash=password_hash,
        )

        db.add(new_user)
        await db.flush()

        provider_profile = ProviderProfile(
            user_id=new_user.id,
            bio=provider_data.bio or "Proveedor de servicios profesional",
            rating_avg=0.0,
            total_reviews=0,
        )

        db.add(provider_profile)
        await db.commit()

        result = await db.execute(
            select(User)
            .options(
                selectinload(User.provider_profile).selectinload(
                    ProviderProfile.licenses
                )
            )
            .where(User.id == new_user.id)
        )
        user_with_profile = result.scalar_one()

        return await ProviderController._build_provider_response(user_with_profile)

    @staticmethod
    async def _ensure_provider_profile(
        db: AsyncSession, user_id: int
    ) -> ProviderProfile:
        """Garantiza que exista un perfil de proveedor para el usuario dado."""

        result = await db.execute(
            select(ProviderProfile).where(ProviderProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if profile:
            return profile

        profile = ProviderProfile(
            user_id=user_id,
            bio="Proveedor de servicios profesional",
            rating_avg=0.0,
            total_reviews=0,
        )

        db.add(profile)
        await db.commit()
        await db.refresh(profile)

        return profile

    @staticmethod
    async def _load_provider_with_relations(
        db: AsyncSession, user_id: int
    ) -> Optional[User]:
        result = await db.execute(
            select(User)
            .options(
                selectinload(User.provider_profile)
                .selectinload(ProviderProfile.licenses)
                .selectinload(ProviderLicense.tag_links)
                .selectinload(ProviderLicenseTag.tag)
            )
            .where(
                User.id == user_id,
                User.role == UserRole.PROVIDER,
                User.is_active,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    @error_handler(logger)
    async def add_provider_licenses(
        db: AsyncSession, user_id: int, licenses_data: List[ProviderLicenseCreate]
    ) -> List[ProviderLicenseResponse]:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado"
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        if not licenses_data:
            return [
                ProviderLicenseResponse(
                    id=license.id,
                    provider_profile_id=license.provider_profile_id,
                    title=license.title,
                    description=license.description,
                    license_number=license.license_number,
                    issued_by=license.issued_by,
                    issued_at=license.issued_at,
                    expires_at=license.expires_at,
                    document_s3_key=license.document_s3_key,
                    document_url=license.document_url,
                    created_at=license.created_at,
                    updated_at=license.updated_at,
                )
                for license in profile.licenses
            ]

        new_licenses = []

        for item in licenses_data:
            license_model = ProviderLicense(
                provider_profile_id=profile.id,
                title=item.title,
                description=item.description,
                license_number=item.license_number,
                issued_by=item.issued_by,
                issued_at=item.issued_at,
                expires_at=item.expires_at,
                document_s3_key=item.document_s3_key,
                document_url=item.document_url,
            )
            db.add(license_model)
            new_licenses.append(license_model)

        await db.commit()

        for license_model in new_licenses:
            await db.refresh(license_model)

        if new_licenses:
            await TagsController.generate_tags_for_licenses(
                db, new_licenses, llm_controller.create_tag_of_licences
            )

        user = await ProviderController._load_provider_with_relations(db, user_id)
        profile = getattr(user, "provider_profile", None)

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil de proveedor no encontrado",
            )
        return [
            ProviderController._map_license_to_response(license)
            for license in profile.licenses
        ]

    @staticmethod
    async def _build_provider_response(user: User) -> ProviderResponse:
        """Construye la respuesta Pydantic con el perfil del proveedor."""
        profile = getattr(user, "provider_profile", None)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil de proveedor no encontrado",
            )

        licenses_data = getattr(profile, "licenses", []) or []

        licenses = [
            ProviderController._map_license_to_response(license)
            for license in licenses_data
        ]

        profile_response = ProviderProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            bio=profile.bio,
            rating_avg=profile.rating_avg,
            total_reviews=profile.total_reviews,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
            licenses=licenses,
        )

        return ProviderResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            phone=user.phone,
            date_of_birth=user.date_of_birth,
            role=getattr(user.role, "value", user.role),
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            profile_image_url=getattr(user, "profile_image_url", None),
            profile_image_s3_key=getattr(user, "profile_image_s3_key", None),
            profile_image_uploaded_at=getattr(user, "profile_image_uploaded_at", None),
            provider_profile=profile_response,
        )

    @staticmethod
    @error_handler(logger)
    async def get_provider_by_id(
        db: AsyncSession, provider_id: int
    ) -> Optional[ProviderResponse]:
        user = await ProviderController._load_provider_with_relations(db, provider_id)

        if not user:
            return None

        if not getattr(user, "provider_profile", None):
            await ProviderController._ensure_provider_profile(db, user.id)
            user = await ProviderController._load_provider_with_relations(
                db, provider_id
            )
            if not user:
                return None

        return await ProviderController._build_provider_response(user)

    @staticmethod
    def _map_license_to_response(license: ProviderLicense) -> ProviderLicenseResponse:
        tag_responses: List[ProviderLicenseTagResponse] = []
        for link in getattr(license, "tag_links", []) or []:
            tag = getattr(link, "tag", None)
            if not tag:
                continue
            tag_responses.append(
                ProviderLicenseTagResponse(
                    tag=TagResponse(
                        id=tag.id,
                        slug=tag.slug,
                        name=tag.name,
                        description=tag.description,
                    ),
                    confidence=float(link.confidence)
                    if link.confidence is not None
                    else None,
                    source=link.source,
                )
            )

        return ProviderLicenseResponse(
            id=license.id,
            provider_profile_id=license.provider_profile_id,
            title=license.title,
            description=license.description,
            license_number=license.license_number,
            issued_by=license.issued_by,
            issued_at=license.issued_at,
            expires_at=license.expires_at,
            document_s3_key=license.document_s3_key,
            document_url=license.document_url,
            created_at=license.created_at,
            updated_at=license.updated_at,
            tags=tag_responses,
        )

    @staticmethod
    @error_handler(logger)
    async def update_provider_profile(
        db: AsyncSession, user_id: int, profile_data: ProviderProfileUpdate
    ) -> Optional[ProviderResponse]:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            return None

        profile = getattr(user, "provider_profile", None)
        if not profile:
            await ProviderController._ensure_provider_profile(db, user.id)
            user = await ProviderController._load_provider_with_relations(db, user_id)
            if not user:
                return None
            profile = user.provider_profile

        if profile_data.bio is not None:
            profile.bio = profile_data.bio

        await db.commit()
        # Re-cargar usuario con relaciones para retornar información consistente
        user = await ProviderController._load_provider_with_relations(db, user_id)
        if not user:
            return None

        return await ProviderController._build_provider_response(user)

    @staticmethod
    @error_handler(logger)
    async def list_matching_service_requests(
        db: AsyncSession, user_id: int
    ) -> List[ServiceRequestResponse]:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado",
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        provider_city = None
        provider_state = None

        address_stmt = (
            select(Address)
            .where(Address.user_id == user.id, Address.is_active.is_(True))
            .order_by(Address.is_default.desc(), Address.created_at.desc())
            .limit(1)
        )
        provider_address_result = await db.execute(address_stmt)
        provider_address = provider_address_result.scalar_one_or_none()
        if provider_address:
            if provider_address.city:
                provider_city = provider_address.city.strip() or None
            if provider_address.state:
                provider_state = provider_address.state.strip() or None

        licenses = getattr(profile, "licenses", []) or []
        tag_ids = {
            link.tag_id
            for license in licenses
            for link in getattr(license, "tag_links", []) or []
            if getattr(link, "tag_id", None) is not None
        }

        if not tag_ids:
            return []

        provider_proposal_alias = aliased(ServiceRequestProposal)
        request_address_alias = aliased(Address)

        stmt = (
            select(ServiceRequest)
            .join(
                ServiceRequestTag,
                ServiceRequestTag.request_id == ServiceRequest.id,
            )
            .outerjoin(
                provider_proposal_alias,
                and_(
                    provider_proposal_alias.request_id == ServiceRequest.id,
                    provider_proposal_alias.provider_profile_id == profile.id,
                ),
            )
            .outerjoin(
                request_address_alias,
                request_address_alias.id == ServiceRequest.address_id,
            )
            .options(
                selectinload(ServiceRequest.client),
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
            .where(
                ServiceRequest.status == ServiceRequestStatus.PUBLISHED,
                ServiceRequestTag.tag_id.in_(tag_ids),
                provider_proposal_alias.id.is_(None),
            )
            .order_by(
                case(
                    (ServiceRequest.request_type == ServiceRequestType.FAST, 0),
                    else_=1,
                ),
                case(
                    (ServiceRequestTag.confidence.is_(None), 1),
                    else_=0,
                ),
                ServiceRequestTag.confidence.desc(),
                ServiceRequest.created_at.asc(),
            )
        )

        normalized_city = provider_city.lower() if provider_city else None
        normalized_state = provider_state.lower() if provider_state else None

        if normalized_city:
            city_expr = func.lower(
                func.coalesce(
                    func.nullif(func.trim(request_address_alias.city), ""),
                    func.nullif(func.trim(ServiceRequest.city_snapshot), ""),
                )
            )
            stmt = stmt.where(city_expr == normalized_city)

        if normalized_state:
            state_expr = func.lower(
                func.nullif(func.trim(request_address_alias.state), "")
            )
            stmt = stmt.where(state_expr == normalized_state)

        result = await db.execute(stmt)
        requests = list(result.scalars().unique().all())

        return [
            ServiceRequestController._build_response(request) for request in requests
        ]

    @staticmethod
    @error_handler(logger)
    async def list_provider_services(
        db: AsyncSession,
        user_id: int,
        completed_date: str | None = None,
        filter_type: str = "all",
    ) -> List[ProviderServiceResponse]:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado",
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        services: list[Service] = []

        # Query para servicios activos
        if filter_type in ("all", "active"):
            active_statuses = [
                ServiceStatus.IN_PROGRESS,
                ServiceStatus.ON_ROUTE,
                ServiceStatus.CONFIRMED,
            ]

            stmt_active = (
                select(Service)
                .options(
                    selectinload(Service.request).selectinload(ServiceRequest.images),
                    selectinload(Service.request),
                    selectinload(Service.proposal),
                    selectinload(Service.status_history),
                    selectinload(Service.reviews),
                    selectinload(Service.client),
                )
                .where(
                    Service.provider_profile_id == profile.id,
                    Service.status.in_(active_statuses),
                )
                .order_by(
                    case((Service.status == ServiceStatus.IN_PROGRESS, 0), else_=1),
                    case((Service.status == ServiceStatus.ON_ROUTE, 0), else_=1),
                    case((Service.status == ServiceStatus.CONFIRMED, 0), else_=1),
                    Service.scheduled_start_at.asc(),
                    Service.created_at.desc(),
                )
            )

            result_active = await db.execute(stmt_active)
            services.extend(list(result_active.scalars().all()))

        # Query para servicios completados (filtrados por fecha)
        if filter_type in ("all", "completed"):
            argentina_tz = timezone(timedelta(hours=-3))
            if completed_date:
                try:
                    target_date = datetime.strptime(completed_date, "%Y-%m-%d").date()
                except ValueError:
                    target_date = datetime.now(argentina_tz).date()
            else:
                target_date = datetime.now(argentina_tz).date()

            day_start = datetime.combine(target_date, datetime.min.time())
            day_end = datetime.combine(target_date, datetime.max.time())

            stmt_completed = (
                select(Service)
                .options(
                    selectinload(Service.request).selectinload(ServiceRequest.images),
                    selectinload(Service.request),
                    selectinload(Service.proposal),
                    selectinload(Service.status_history),
                    selectinload(Service.reviews),
                    selectinload(Service.client),
                )
                .where(
                    Service.provider_profile_id == profile.id,
                    Service.status == ServiceStatus.COMPLETED,
                    Service.updated_at >= day_start,
                    Service.updated_at <= day_end,
                )
                .order_by(Service.updated_at.desc())
            )

            result_completed = await db.execute(stmt_completed)
            services.extend(list(result_completed.scalars().all()))

        return [
            ProviderController._map_service_to_provider_response(service)
            for service in services
        ]

    @staticmethod
    @error_handler(logger)
    async def mark_service_on_route(
        db: AsyncSession, user_id: int, service_id: int
    ) -> ProviderServiceResponse:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado",
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        stmt = (
            select(Service)
            .options(
                selectinload(Service.request).selectinload(ServiceRequest.images),
                selectinload(Service.request),
                selectinload(Service.proposal),
                selectinload(Service.status_history),
                selectinload(Service.reviews),
                selectinload(Service.client),
            )
            .where(
                Service.id == service_id,
                Service.provider_profile_id == profile.id,
            )
        )

        result = await db.execute(stmt)
        service = result.scalar_one_or_none()

        if service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado para este proveedor",
            )

        if service.status not in {ServiceStatus.CONFIRMED, ServiceStatus.ON_ROUTE}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este servicio no puede marcarse como en camino",
            )

        if service.status == ServiceStatus.ON_ROUTE:
            return ProviderController._map_service_to_provider_response(service)

        scheduled_start = service.scheduled_start_at
        if scheduled_start is not None:
            if scheduled_start.tzinfo is not None:
                scheduled_start = scheduled_start.astimezone(
                    timezone(timedelta(hours=-3))
                ).replace(tzinfo=None)
            # Comparar con hora actual Argentina (UTC-3)
            current_utc = datetime.now(timezone(timedelta(hours=-3))).replace(
                tzinfo=None
            )
            # Permitir marcar en camino un poco antes (ej. 2 horas antes)
            # o estrictamente después. Asumimos estrictamente >= start para consistencia
            # con la solicitud, aunque "en camino" suele ser antes.
            # Ajuste: Permitimos marcar "En camino" si faltan menos de 2 horas para el inicio
            # o si ya pasó la hora.
            earliest_allowed = scheduled_start - timedelta(hours=2)

            if current_utc < earliest_allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Aún es muy temprano para salir hacia el servicio (máx. 2hs antes)",
                )

        previous_status = (
            service.status.value
            if isinstance(service.status, ServiceStatus)
            else service.status
        )
        service.status = ServiceStatus.ON_ROUTE

        history_entry = ServiceStatusHistory(
            service_id=service.id,
            from_status=previous_status,
            to_status=ServiceStatus.ON_ROUTE.value,
            changed_by=user_id,
            changed_at=datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None),
        )
        db.add(history_entry)

        await db.commit()

        refreshed_result = await db.execute(stmt)
        refreshed_service = refreshed_result.scalar_one()
        return ProviderController._map_service_to_provider_response(refreshed_service)

    @staticmethod
    @error_handler(logger)
    async def mark_service_in_progress(
        db: AsyncSession, user_id: int, service_id: int
    ) -> ProviderServiceResponse:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado",
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        stmt = (
            select(Service)
            .options(
                selectinload(Service.request).selectinload(ServiceRequest.images),
                selectinload(Service.request),
                selectinload(Service.proposal),
                selectinload(Service.status_history),
                selectinload(Service.reviews),
                selectinload(Service.client),
            )
            .where(
                Service.id == service_id,
                Service.provider_profile_id == profile.id,
            )
        )

        result = await db.execute(stmt)
        service = result.scalar_one_or_none()

        if service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado para este proveedor",
            )

        normalized_status = (
            service.status.value
            if isinstance(service.status, ServiceStatus)
            else service.status
        )

        allowed_statuses = {
            ServiceStatus.CONFIRMED.value,
            ServiceStatus.ON_ROUTE.value,
            ServiceStatus.IN_PROGRESS.value,
        }

        if normalized_status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este servicio no puede marcarse como en progreso",
            )

        if normalized_status == ServiceStatus.IN_PROGRESS.value:
            return ProviderController._map_service_to_provider_response(service)

        scheduled_start = service.scheduled_start_at
        if scheduled_start is not None:
            if scheduled_start.tzinfo is not None:
                scheduled_start = scheduled_start.astimezone(
                    timezone(timedelta(hours=-3))
                ).replace(tzinfo=None)
            # Comparar con hora actual Argentina (UTC-3)
            current_utc = datetime.now(timezone(timedelta(hours=-3))).replace(
                tzinfo=None
            )
            if scheduled_start > current_utc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El servicio aún no alcanzó la fecha de inicio",
                )

        previous_status = normalized_status
        service.status = ServiceStatus.IN_PROGRESS

        history_entry = ServiceStatusHistory(
            service_id=service.id,
            from_status=previous_status,
            to_status=ServiceStatus.IN_PROGRESS.value,
            changed_by=user_id,
            changed_at=datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None),
        )
        db.add(history_entry)

        await db.commit()

        refreshed_result = await db.execute(stmt)
        refreshed_service = refreshed_result.scalar_one()
        return ProviderController._map_service_to_provider_response(refreshed_service)

    @staticmethod
    @error_handler(logger)
    async def mark_service_completed(
        db: AsyncSession, user_id: int, service_id: int
    ) -> ProviderServiceResponse:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado",
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        stmt = (
            select(Service)
            .options(
                selectinload(Service.request).selectinload(ServiceRequest.images),
                selectinload(Service.request),
                selectinload(Service.proposal),
                selectinload(Service.status_history),
                selectinload(Service.reviews),
                selectinload(Service.client),
            )
            .where(
                Service.id == service_id,
                Service.provider_profile_id == profile.id,
            )
        )

        result = await db.execute(stmt)
        service = result.scalar_one_or_none()

        if service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado para este proveedor",
            )

        normalized_status = (
            service.status.value
            if isinstance(service.status, ServiceStatus)
            else service.status
        )

        allowed_statuses = {
            ServiceStatus.IN_PROGRESS.value,
            ServiceStatus.COMPLETED.value,
        }

        if normalized_status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este servicio no puede marcarse como completado",
            )

        if normalized_status == ServiceStatus.COMPLETED.value:
            return ProviderController._map_service_to_provider_response(service)

        previous_status = normalized_status
        service.status = ServiceStatus.COMPLETED

        history_entry = ServiceStatusHistory(
            service_id=service.id,
            from_status=previous_status,
            to_status=ServiceStatus.COMPLETED.value,
            changed_by=user_id,
            changed_at=datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None),
        )
        db.add(history_entry)

        await db.commit()

        # Notificar al cliente
        try:
            request_title = service.request.title if service.request else "tu servicio"
            await notification_service.send_notification_to_user(
                db,
                user_id=service.client_id,
                title="¡Servicio finalizado!",
                body=f"El prestador ha marcado como finalizado el servicio '{request_title}'.",
                data={
                    "requestId": service.request_id,
                    "type": "service_completed",
                },
            )
        except Exception as e:
            logger.error(f"Error enviando notificacion push: {e}")

        refreshed_result = await db.execute(stmt)
        refreshed_service = refreshed_result.scalar_one()
        return ProviderController._map_service_to_provider_response(refreshed_service)

    @staticmethod
    @error_handler(logger)
    async def list_provider_proposals(
        db: AsyncSession, user_id: int
    ) -> List[ProviderProposalResponse]:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado",
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        recent_threshold = datetime.utcnow() - timedelta(hours=24)

        stmt = (
            select(ServiceRequestProposal)
            .options(
                selectinload(ServiceRequestProposal.request).selectinload(
                    ServiceRequest.client
                ),
                selectinload(ServiceRequestProposal.request).selectinload(
                    ServiceRequest.address
                ),
                selectinload(ServiceRequestProposal.request).selectinload(
                    ServiceRequest.images
                ),
            )
            .where(ServiceRequestProposal.provider_profile_id == profile.id)
            .where(
                or_(
                    ServiceRequestProposal.status == ProposalStatus.PENDING,
                    and_(
                        ServiceRequestProposal.status == ProposalStatus.REJECTED,
                        ServiceRequestProposal.created_at >= recent_threshold,
                    ),
                )
            )
            .order_by(
                case(
                    (ServiceRequestProposal.status == ProposalStatus.PENDING, 0),
                    else_=1,
                ),
                ServiceRequestProposal.created_at.desc(),
            )
        )

        result = await db.execute(stmt)
        proposals = list(result.scalars().all())

        return [
            ProviderController._map_proposal_to_provider_response(proposal)
            for proposal in proposals
        ]

    @staticmethod
    @error_handler(logger)
    async def list_currencies(db: AsyncSession) -> List[CurrencyResponse]:
        result = await db.execute(
            select(Currency).order_by(Currency.name, Currency.code)
        )
        currencies = result.scalars().all()

        return [
            CurrencyResponse.model_validate(currency, from_attributes=True)
            for currency in currencies
        ]

    @staticmethod
    @error_handler(logger)
    async def create_provider_proposal(
        db: AsyncSession, user_id: int, payload: ProviderProposalCreate
    ) -> ProviderProposalResponse:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado",
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        currency_code = payload.currency.upper()
        currency_stmt = select(Currency.code).where(Currency.code == currency_code)
        currency_exists = await db.execute(currency_stmt)
        if currency_exists.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La moneda indicada no está soportada",
            )

        request_stmt = (
            select(ServiceRequest)
            .options(
                selectinload(ServiceRequest.proposals),
                selectinload(ServiceRequest.service),
                selectinload(ServiceRequest.client),
            )
            .where(ServiceRequest.id == payload.request_id)
        )
        request_result = await db.execute(request_stmt)
        service_request = request_result.scalar_one_or_none()

        if not service_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La solicitud indicada no existe",
            )

        if service_request.status != ServiceRequestStatus.PUBLISHED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="La solicitud no está disponible para presupuestar",
            )

        if getattr(service_request, "service", None) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="La solicitud ya tiene un servicio confirmado",
            )

        if service_request.client_id == user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No podés presupuestar tu propia solicitud",
            )

        existing_versions = [
            proposal.version
            for proposal in getattr(service_request, "proposals", []) or []
            if proposal.provider_profile_id == profile.id
        ]

        has_active_proposal = any(
            proposal.status in {ProposalStatus.PENDING, ProposalStatus.ACCEPTED}
            for proposal in getattr(service_request, "proposals", []) or []
            if proposal.provider_profile_id == profile.id
        )

        if has_active_proposal:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya tenés un presupuesto activo para esta solicitud",
            )

        next_version = max(existing_versions) + 1 if existing_versions else 1

        normalized_start = _normalize_to_utc_naive(payload.proposed_start_at)
        normalized_end = _normalize_to_utc_naive(payload.proposed_end_at)
        normalized_valid_until = _normalize_to_utc_naive(payload.valid_until)

        is_fast_request = service_request.request_type == ServiceRequestType.FAST

        if is_fast_request:
            # Usar hora actual Argentina (UTC-3)
            current_utc = datetime.now(timezone(timedelta(hours=-3))).replace(
                tzinfo=None, microsecond=0
            )
            normalized_start = current_utc
            normalized_end = None
            normalized_valid_until = None

        if (
            normalized_valid_until is not None
            and normalized_valid_until
            <= datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La fecha de vigencia debe ser futura",
            )

        new_proposal = ServiceRequestProposal(
            request_id=service_request.id,
            provider_profile_id=profile.id,
            version=next_version,
            quoted_price=payload.quoted_price,
            currency=currency_code,
            proposed_start_at=normalized_start,
            proposed_end_at=normalized_end,
            valid_until=normalized_valid_until,
            notes=payload.notes,
        )

        db.add(new_proposal)
        await db.commit()

        proposal_stmt = (
            select(ServiceRequestProposal)
            .options(
                selectinload(ServiceRequestProposal.request).selectinload(
                    ServiceRequest.client
                ),
                selectinload(ServiceRequestProposal.request).selectinload(
                    ServiceRequest.images
                ),
                selectinload(ServiceRequestProposal.request),
            )
            .where(ServiceRequestProposal.id == new_proposal.id)
        )
        refreshed_result = await db.execute(proposal_stmt)
        persisted = refreshed_result.scalar_one()

        # Notificar al cliente
        try:
            title_preview = (service_request.title or "")[:30]
            await notification_service.send_notification_to_user(
                db,
                user_id=service_request.client_id,
                title="Nueva propuesta recibida",
                body=f"Recibiste una oferta para '{title_preview}'",
                data={"requestId": service_request.id, "type": "proposal_received"},
            )
        except Exception as e:
            logger.error(f"Error enviando notificacion push: {e}")

        return ProviderController._map_proposal_to_provider_response(persisted)

    @staticmethod
    @error_handler(logger)
    async def reject_service_request(
        db: AsyncSession, user_id: int, request_id: int
    ) -> None:
        """
        Permite al proveedor rechazar una solicitud.
        Se crea una propuesta con estado REJECTED para que no vuelva a aparecer en matching-requests.
        """
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado",
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        # Verificar si ya existe una propuesta/interacción para esta solicitud
        existing_stmt = select(ServiceRequestProposal).where(
            ServiceRequestProposal.request_id == request_id,
            ServiceRequestProposal.provider_profile_id == profile.id,
        )
        existing_result = await db.execute(existing_stmt)
        existing_proposals = existing_result.scalars().all()

        if existing_proposals:
            # Si ya tiene propuestas, verificamos si alguna está activa
            # Si tiene una activa, no deberíamos "rechazar" la solicitud sin más,
            # pero para simplificar, si ya interactuó, asumimos que ya está manejado o
            # podemos marcar la última como rechazada si estaba pendiente.
            # Por ahora, si ya existe algo, retornamos éxito (idempotencia) o error si está aceptada.
            for prop in existing_proposals:
                if prop.status == ProposalStatus.ACCEPTED:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="No puedes rechazar una solicitud que ya tienes aceptada.",
                    )
            # Si no hay aceptadas, ya está "gestionada" (pendiente o rechazada), no hacemos nada.
            return

        # Si no existe propuesta, creamos una "dummy" con estado REJECTED
        # Usamos valores por defecto para campos obligatorios
        # Aseguramos que la moneda exista (usamos ARS por defecto, pero verificamos o usamos null si se permitiera)
        # Nota: La tabla requiere currency NOT NULL y FK. Asumimos 'ARS' existe.
        # Para evitar error FK, verificamos si ARS existe, si no, buscamos cualquiera disponible.

        currency_code = "ARG"
        # Verificar si ARS existe para evitar FK error
        currency_check = await db.execute(
            select(Currency.code).where(Currency.code == "ARS")
        )
        if not currency_check.scalar_one_or_none():
            # Fallback a la primera moneda disponible
            any_currency = await db.execute(select(Currency.code).limit(1))
            currency_code = any_currency.scalar_one_or_none()

            if not currency_code:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="No hay monedas configuradas en el sistema para procesar el rechazo.",
                )

        rejected_proposal = ServiceRequestProposal(
            request_id=request_id,
            provider_profile_id=profile.id,
            version=1,
            quoted_price=0,
            currency=currency_code,
            status=ProposalStatus.REJECTED,
            notes="Rechazada por el proveedor (oculta)",
            # proposed_start_at, valid_until pueden ser null
        )

        db.add(rejected_proposal)
        await db.commit()
        return

    @staticmethod
    def _map_proposal_to_provider_response(
        proposal: ServiceRequestProposal,
    ) -> ProviderProposalResponse:
        request = getattr(proposal, "request", None)
        client_name = None
        client_avatar_url = None
        if request and getattr(request, "client", None):
            first = (request.client.first_name or "").strip()
            last = (request.client.last_name or "").strip()
            client_name = (
                " ".join(part for part in [first, last] if part).strip() or None
            )
            client_avatar_url = getattr(request.client, "profile_image_url", None)

        attachments = []
        if request is not None:
            attachments = ServiceRequestController._serialize_attachments(request)

        return ProviderProposalResponse(
            id=proposal.id,
            request_id=proposal.request_id,
            provider_profile_id=proposal.provider_profile_id,
            version=proposal.version,
            status=proposal.status,
            quoted_price=proposal.quoted_price,
            currency=proposal.currency,
            notes=proposal.notes,
            valid_until=proposal.valid_until,
            created_at=proposal.created_at,
            updated_at=proposal.updated_at,
            request_title=getattr(request, "title", None),
            request_type=getattr(request, "request_type", None),
            request_status=getattr(request, "status", None),
            request_city=getattr(request, "city_snapshot", None),
            request_description=getattr(request, "description", None),
            request_created_at=getattr(request, "created_at", None),
            request_attachments=attachments,
            preferred_start_at=getattr(request, "preferred_start_at", None),
            preferred_end_at=getattr(request, "preferred_end_at", None),
            client_name=client_name,
            client_avatar_url=client_avatar_url,
        )

    @staticmethod
    def _map_service_to_provider_response(
        service: Service,
    ) -> ProviderServiceResponse:
        request = getattr(service, "request", None)
        request_preview = None
        if request is not None:
            attachments = ServiceRequestController._serialize_attachments(request)
            request_preview = ProviderServiceRequestPreview(
                id=request.id,
                title=getattr(request, "title", None),
                description=getattr(request, "description", None),
                request_type=getattr(request, "request_type", None),
                status=getattr(request, "status", None),
                city_snapshot=getattr(request, "city_snapshot", None),
                preferred_start_at=getattr(request, "preferred_start_at", None),
                preferred_end_at=getattr(request, "preferred_end_at", None),
                attachments=attachments,
            )

        proposal = getattr(service, "proposal", None)
        currency = getattr(service, "currency", None)
        if not currency and proposal is not None:
            currency = getattr(proposal, "currency", None)
        quoted_price = getattr(proposal, "quoted_price", None) if proposal else None

        client = getattr(service, "client", None)
        client_name = None
        client_phone = None
        if client is not None:
            first = (getattr(client, "first_name", "") or "").strip()
            last = (getattr(client, "last_name", "") or "").strip()
            client_name = (
                " ".join(part for part in [first, last] if part).strip() or None
            )
            client_phone = getattr(client, "phone", None)
            client_avatar_url = getattr(client, "profile_image_url", None)
        else:
            client_avatar_url = None

        status_history = []
        for change in sorted(
            list(getattr(service, "status_history", []) or []),
            key=lambda item: (
                getattr(item, "changed_at", None) or service.updated_at,
                getattr(item, "id", 0),
            ),
        ):
            status_history.append(
                ProviderServiceStatusHistory(
                    changed_at=change.changed_at,
                    from_status=change.from_status,
                    to_status=change.to_status,
                )
            )

        client_review_payload: ServiceReviewResponse | None = None
        for review in list(getattr(service, "reviews", []) or []):
            if review.rater_user_id == service.client_id:
                client_review_payload = ServiceReviewResponse(
                    id=review.id,
                    rating=review.rating,
                    comment=review.comment,
                    created_at=review.created_at,
                )
                break

        return ProviderServiceResponse(
            id=service.id,
            status=service.status,
            scheduled_start_at=service.scheduled_start_at,
            scheduled_end_at=service.scheduled_end_at,
            total_price=service.total_price,
            quoted_price=quoted_price,
            currency=currency,
            proposal_id=service.proposal_id,
            request_id=service.request_id,
            request=request_preview,
            client_id=service.client_id,
            client_name=client_name,
            client_phone=client_phone,
            client_avatar_url=client_avatar_url,
            address_snapshot=getattr(service, "address_snapshot", None),
            created_at=service.created_at,
            updated_at=service.updated_at,
            status_history=status_history,
            client_review=client_review_payload,
        )

    @staticmethod
    @error_handler(logger)
    async def get_provider_overview_stats(
        db: AsyncSession, user_id: int, currency: Optional[str] = None
    ) -> ProviderOverviewKpisResponse:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado",
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        profile_id = profile.id

        services_stmt = select(
            func.sum(
                case(
                    (Service.status != ServiceStatus.CANCELED, 1),
                    else_=0,
                )
            ).label("total_services"),
            func.sum(
                case(
                    (Service.status == ServiceStatus.COMPLETED, 1),
                    else_=0,
                )
            ).label("completed_services"),
        ).where(Service.provider_profile_id == profile_id)

        proposal_stmt = select(
            func.count(ServiceRequestProposal.id).label("total"),
            func.sum(
                case(
                    (ServiceRequestProposal.status == ProposalStatus.ACCEPTED, 1),
                    else_=0,
                )
            ).label("accepted"),
        ).where(ServiceRequestProposal.provider_profile_id == profile_id)

        reviews_stmt = select(
            func.count(ServiceReview.id).label("total_reviews"),
            func.avg(ServiceReview.rating).label("avg_rating"),
        ).where(ServiceReview.ratee_provider_profile_id == profile_id)

        completed_history_subq = (
            select(
                ServiceStatusHistory.service_id.label("service_id"),
                func.min(ServiceStatusHistory.changed_at).label("completed_at"),
            )
            .where(ServiceStatusHistory.to_status == ServiceStatus.COMPLETED.value)
            .group_by(ServiceStatusHistory.service_id)
            .subquery()
        )

        revenue_base = (
            select(func.coalesce(func.sum(Service.total_price), 0).label("amount"))
            .join(
                completed_history_subq,
                completed_history_subq.c.service_id == Service.id,
            )
            .where(
                Service.provider_profile_id == profile_id,
                Service.total_price.isnot(None),
            )
        )

        if currency:
            currency_code = currency.upper()
        else:
            currency_stmt = (
                select(Service.currency)
                .join(
                    completed_history_subq,
                    completed_history_subq.c.service_id == Service.id,
                )
                .where(
                    Service.provider_profile_id == profile_id,
                    Service.total_price.isnot(None),
                    Service.currency.isnot(None),
                )
                .order_by(completed_history_subq.c.completed_at.desc())
                .limit(1)
            )

            currency_result = await db.execute(currency_stmt)
            db_currency = currency_result.scalar_one_or_none()
            currency_code = db_currency or getattr(profile, "currency", None) or "ARS"

        # Filter metrics by currency to ensure consistency
        revenue_base = revenue_base.where(Service.currency == currency_code)
        services_stmt = services_stmt.where(Service.currency == currency_code)
        proposal_stmt = proposal_stmt.where(
            ServiceRequestProposal.currency == currency_code
        )

        # Usar hora actual Argentina (UTC-3) para KPIs
        now_utc = datetime.now(timezone(timedelta(hours=-3)))
        current_month_start = now_utc.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        current_month_start = current_month_start.replace(
            tzinfo=timezone(timedelta(hours=-3))
        )

        if current_month_start.month == 1:
            previous_month_start = current_month_start.replace(
                year=current_month_start.year - 1, month=12
            )
        else:
            previous_month_start = current_month_start.replace(
                month=current_month_start.month - 1
            )

        if current_month_start.month == 12:
            next_month_start = current_month_start.replace(
                year=current_month_start.year + 1, month=1
            )
        else:
            next_month_start = current_month_start.replace(
                month=current_month_start.month + 1
            )

        current_month_start_naive = current_month_start.replace(tzinfo=None)
        previous_month_start_naive = previous_month_start.replace(tzinfo=None)
        next_month_start_naive = next_month_start.replace(tzinfo=None)

        revenue_total_stmt = revenue_base

        revenue_current_stmt = revenue_base.where(
            completed_history_subq.c.completed_at >= current_month_start_naive,
            completed_history_subq.c.completed_at < next_month_start_naive,
        )

        revenue_previous_stmt = revenue_base.where(
            completed_history_subq.c.completed_at >= previous_month_start_naive,
            completed_history_subq.c.completed_at < current_month_start_naive,
        )

        services_result = await db.execute(services_stmt)
        services_row = services_result.one()
        total_services = int(services_row.total_services or 0)
        completed_services = int(services_row.completed_services or 0)

        proposals_result = await db.execute(proposal_stmt)
        proposals_row = proposals_result.one()
        total_proposals = int(proposals_row.total or 0)
        accepted_proposals = int(proposals_row.accepted or 0)

        reviews_result = await db.execute(reviews_stmt)
        reviews_row = reviews_result.one()
        total_reviews = int(reviews_row.total_reviews or 0)
        avg_rating_raw = reviews_row.avg_rating

        revenue_total_result = await db.execute(revenue_total_stmt)
        total_revenue_raw = revenue_total_result.scalar() or 0

        revenue_current_result = await db.execute(revenue_current_stmt)
        current_revenue_raw = revenue_current_result.scalar() or 0

        revenue_previous_result = await db.execute(revenue_previous_stmt)
        previous_revenue_raw = revenue_previous_result.scalar() or 0

        def to_decimal(value: object) -> Decimal:
            if value is None:
                return Decimal("0")
            if isinstance(value, Decimal):
                return value
            return Decimal(str(value))

        def quantize_optional(value: Optional[Decimal]) -> Optional[Decimal]:
            if value is None:
                return None
            return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        total_revenue = to_decimal(total_revenue_raw)
        current_revenue = to_decimal(current_revenue_raw)
        previous_revenue = to_decimal(previous_revenue_raw)

        acceptance_rate: Optional[Decimal]
        if total_proposals > 0:
            raw_rate = (Decimal(accepted_proposals) * Decimal("100")) / Decimal(
                total_proposals
            )
            acceptance_rate = quantize_optional(raw_rate)
        else:
            acceptance_rate = None

        average_rating = (
            quantize_optional(Decimal(str(avg_rating_raw)))
            if avg_rating_raw is not None
            else None
        )

        if previous_revenue > 0:
            change = (
                (current_revenue - previous_revenue) * Decimal("100")
            ) / previous_revenue
            revenue_change = quantize_optional(change)
        elif current_revenue > 0:
            revenue_change = quantize_optional(Decimal("100"))
        else:
            revenue_change = None

        return ProviderOverviewKpisResponse(
            total_services=total_services,
            completed_services=completed_services,
            acceptance_rate=acceptance_rate,
            total_proposals=total_proposals,
            accepted_proposals=accepted_proposals,
            average_rating=average_rating,
            total_reviews=total_reviews,
            total_revenue=total_revenue.quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            ),
            revenue_previous_month=previous_revenue.quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            ),
            revenue_change_percentage=revenue_change,
            currency=currency_code,
        )

    @staticmethod
    @error_handler(logger)
    async def get_provider_revenue_stats(
        db: AsyncSession, user_id: int, months: int, currency: Optional[str] = None
    ) -> ProviderRevenueStatsResponse:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado",
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        profile_id = profile.id

        normalized_months = max(1, min(months, 12))

        # Usar fecha actual Argentina (UTC-3) - incluye el mes actual
        argentina_tz = timezone(timedelta(hours=-3))
        now_argentina = datetime.now(argentina_tz)
        current_month_start = datetime(
            now_argentina.year, now_argentina.month, 1, 0, 0, 0, tzinfo=argentina_tz
        )

        def _add_months(date_value: datetime, offset: int) -> datetime:
            year = date_value.year
            month = date_value.month + offset
            while month > 12:
                month -= 12
                year += 1
            while month <= 0:
                month += 12
                year -= 1
            return date_value.replace(year=year, month=month, day=1)

        # Calcular el mes de inicio: retrocedemos (months - 1) meses desde el actual
        start_month = _add_months(current_month_start, -(normalized_months - 1))
        start_month_naive = start_month.replace(tzinfo=None)

        completed_history_subq = (
            select(
                ServiceStatusHistory.service_id.label("service_id"),
                func.min(ServiceStatusHistory.changed_at).label("completed_at"),
            )
            .where(ServiceStatusHistory.to_status == ServiceStatus.COMPLETED.value)
            .group_by(ServiceStatusHistory.service_id)
            .subquery()
        )

        period_expr = func.date_format(
            completed_history_subq.c.completed_at, "%Y-%m-01"
        )

        if currency:
            currency_code = currency.upper()
        else:
            currency_stmt = (
                select(Service.currency)
                .join(
                    completed_history_subq,
                    completed_history_subq.c.service_id == Service.id,
                )
                .where(
                    Service.provider_profile_id == profile_id,
                    Service.total_price.isnot(None),
                    Service.currency.isnot(None),
                )
                .order_by(completed_history_subq.c.completed_at.desc())
                .limit(1)
            )

            currency_result = await db.execute(currency_stmt)
            db_currency = currency_result.scalar_one_or_none()
            currency_code = db_currency or getattr(profile, "currency", None) or "ARS"

        revenue_stmt = (
            select(
                period_expr.label("period"),
                func.count(Service.id).label("completed_services"),
                func.coalesce(func.sum(Service.total_price), 0).label("total_revenue"),
                func.avg(Service.total_price).label("avg_ticket"),
            )
            .select_from(Service)
            .join(
                completed_history_subq,
                completed_history_subq.c.service_id == Service.id,
            )
            .where(
                Service.provider_profile_id == profile_id,
                Service.total_price.isnot(None),
                completed_history_subq.c.completed_at >= start_month_naive,
                Service.currency == currency_code,
            )
            .group_by(period_expr)
            .order_by(period_expr)
        )

        revenue_result = await db.execute(revenue_stmt)
        revenue_rows = revenue_result.fetchall()

        points_map: dict[str, dict[str, object]] = {}
        for row in revenue_rows:
            period = row.period
            if period is None:
                continue
            period_str = str(period)
            points_map[period_str] = {
                "total_revenue": row.total_revenue,
                "avg_ticket": row.avg_ticket,
                "completed_services": int(row.completed_services or 0),
            }

        points: List[ProviderRevenuePoint] = []
        month_cursor = start_month

        for _ in range(normalized_months):
            month_key = month_cursor.replace(tzinfo=None).strftime("%Y-%m-01")
            data = points_map.get(month_key, None)

            total_revenue_raw = data["total_revenue"] if data else 0
            avg_ticket_raw = data["avg_ticket"] if data else None
            completed_services = data["completed_services"] if data else 0

            total_revenue_decimal = (
                total_revenue_raw
                if isinstance(total_revenue_raw, Decimal)
                else Decimal(str(total_revenue_raw or 0))
            )
            total_revenue = total_revenue_decimal.quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            if avg_ticket_raw is None:
                avg_ticket = None
            else:
                avg_ticket_decimal = (
                    avg_ticket_raw
                    if isinstance(avg_ticket_raw, Decimal)
                    else Decimal(str(avg_ticket_raw))
                )
                avg_ticket = avg_ticket_decimal.quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )

            points.append(
                ProviderRevenuePoint(
                    month=month_key,
                    total_revenue=total_revenue,
                    avg_ticket=avg_ticket,
                    completed_services=completed_services,
                )
            )

            month_cursor = _add_months(month_cursor, 1)

        # Incluir el mes actual del servidor para diagnóstico
        server_current_month = current_month_start.strftime("%Y-%m-01")

        return ProviderRevenueStatsResponse(
            range_months=normalized_months,
            currency=currency_code,
            points=points,
            server_current_month=server_current_month,
        )

    @staticmethod
    @error_handler(logger)
    async def get_provider_rating_distribution(
        db: AsyncSession, user_id: int, months: int
    ) -> ProviderRatingDistributionResponse:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado",
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        profile_id = profile.id

        normalized_months = max(1, min(months, 12))

        # Usar fecha actual Argentina (UTC-3) - incluye el mes actual
        argentina_tz = timezone(timedelta(hours=-3))
        now_argentina = datetime.now(argentina_tz)
        current_month_start = datetime(
            now_argentina.year, now_argentina.month, 1, 0, 0, 0, tzinfo=argentina_tz
        )

        def _add_months(date_value: datetime, offset: int) -> datetime:
            year = date_value.year
            month = date_value.month + offset
            while month > 12:
                month -= 12
                year += 1
            while month <= 0:
                month += 12
                year -= 1
            return date_value.replace(year=year, month=month, day=1)

        # Calcular el mes de inicio: retrocedemos (months - 1) meses desde el actual
        start_month = _add_months(current_month_start, -(normalized_months - 1))
        start_month_naive = start_month.replace(tzinfo=None)

        period_expr = func.date_format(ServiceReview.created_at, "%Y-%m-01")

        ratings_stmt = (
            select(
                period_expr.label("period"),
                ServiceReview.rating.label("rating"),
                func.count(ServiceReview.id).label("count"),
            )
            .where(
                ServiceReview.ratee_provider_profile_id == profile_id,
                ServiceReview.created_at >= start_month_naive,
            )
            .group_by(period_expr, ServiceReview.rating)
            .order_by(period_expr, ServiceReview.rating)
        )

        ratings_result = await db.execute(ratings_stmt)
        ratings_rows = ratings_result.fetchall()

        distribution_map: dict[str, dict[str, object]] = {}

        for row in ratings_rows:
            period = row.period
            rating_value = row.rating

            if period is None or rating_value is None:
                continue

            rating_int = int(rating_value)
            if rating_int < 1 or rating_int > 5:
                continue

            period_str = str(period)

            entry = distribution_map.get(period_str)
            if entry is None:
                entry = {
                    "counts": {score: 0 for score in range(1, 6)},
                    "total": 0,
                    "sum": Decimal("0"),
                }
                distribution_map[period_str] = entry

            count = int(row.count or 0)
            entry_counts: dict[int, int] = entry["counts"]  # type: ignore[assignment]
            entry_counts[rating_int] = entry_counts.get(rating_int, 0) + count
            entry["total"] = int(entry["total"]) + count  # type: ignore[index]
            entry["sum"] = entry["sum"] + (Decimal(str(rating_int)) * Decimal(count))  # type: ignore[index]

        points: List[ProviderRatingDistributionPoint] = []
        month_cursor = start_month

        for _ in range(normalized_months):
            month_key = month_cursor.replace(tzinfo=None).strftime("%Y-%m-01")
            entry = distribution_map.get(month_key)

            if entry is None:
                counts = {score: 0 for score in range(1, 6)}
                total_reviews = 0
                rating_sum = Decimal("0")
            else:
                counts = dict(entry["counts"])  # type: ignore[assignment]
                total_reviews = int(entry["total"])  # type: ignore[arg-type]
                rating_sum = entry["sum"]  # type: ignore[assignment]

            buckets = [
                ProviderRatingBucket(rating=score, count=counts.get(score, 0))
                for score in range(5, 0, -1)
            ]

            if total_reviews > 0:
                average_decimal = (rating_sum / Decimal(total_reviews)).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                average_rating: Optional[Decimal] = average_decimal
            else:
                average_rating = None

            points.append(
                ProviderRatingDistributionPoint(
                    month=month_key,
                    total_reviews=total_reviews,
                    average_rating=average_rating,
                    buckets=buckets,
                )
            )

            month_cursor = _add_months(month_cursor, 1)

        # Incluir el mes actual del servidor para diagnóstico
        server_current_month = current_month_start.strftime("%Y-%m-01")

        return ProviderRatingDistributionResponse(
            range_months=normalized_months,
            points=points,
            server_current_month=server_current_month,
        )


provider_controller = ProviderController()
