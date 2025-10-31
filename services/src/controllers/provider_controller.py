import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, case, or_, and_
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
)
from models.Tag import ProviderLicenseTag, ProviderLicenseTagResponse, TagResponse
from models.ServiceRequest import (
    ServiceRequest,
    ServiceRequestStatus,
    ServiceRequestProposal,
    Service,
    ServiceRequestType,
    ServiceStatus,
    ProposalStatus,
    Currency,
)
from models.Tag import ServiceRequestTag
from models.ServiceRequestSchemas import ServiceRequestResponse, CurrencyResponse
from controllers.service_request_controller import ServiceRequestController
from auth.auth_utils import get_password_hash
from utils.error_handler import error_handler
from controllers.tags_controllers import TagsController
from controllers.llm_controller import LLMController

logger = logging.getLogger(__name__)

llm_controller = LLMController()


def _normalize_to_utc_naive(value: Optional[datetime]) -> Optional[datetime]:
    """Devuelve un datetime naive en UTC para almacenar o comparar."""

    if value is None:
        return None

    if value.tzinfo is None:
        return value

    return value.astimezone(timezone.utc).replace(tzinfo=None)


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

        result = await db.execute(stmt)
        requests = list(result.scalars().unique().all())

        return [
            ServiceRequestController._build_response(request) for request in requests
        ]

    @staticmethod
    @error_handler(logger)
    async def list_provider_services(
        db: AsyncSession, user_id: int
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

        stmt = (
            select(Service)
            .options(
                selectinload(Service.request).selectinload(ServiceRequest.images),
                selectinload(Service.request),
                selectinload(Service.proposal),
                selectinload(Service.status_history),
                selectinload(Service.client),
            )
            .where(Service.provider_profile_id == profile.id)
            .order_by(
                case((Service.status == ServiceStatus.IN_PROGRESS, 0), else_=1),
                case((Service.status == ServiceStatus.CONFIRMED, 0), else_=1),
                case((Service.status == ServiceStatus.COMPLETED, 0), else_=1),
                Service.scheduled_start_at.asc(),
                Service.created_at.desc(),
            )
        )

        result = await db.execute(stmt)
        services = list(result.scalars().all())

        return [
            ProviderController._map_service_to_provider_response(service)
            for service in services
        ]

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
            current_utc = datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)
            normalized_start = current_utc
            normalized_end = None
            normalized_valid_until = None

        if (
            normalized_valid_until is not None
            and normalized_valid_until <= datetime.utcnow()
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

        return ProviderController._map_proposal_to_provider_response(persisted)

    @staticmethod
    def _map_proposal_to_provider_response(
        proposal: ServiceRequestProposal,
    ) -> ProviderProposalResponse:
        request = getattr(proposal, "request", None)
        client_name = None
        if request and getattr(request, "client", None):
            first = (request.client.first_name or "").strip()
            last = (request.client.last_name or "").strip()
            client_name = (
                " ".join(part for part in [first, last] if part).strip() or None
            )

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
        currency = getattr(proposal, "currency", None) if proposal else None
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
            address_snapshot=getattr(service, "address_snapshot", None),
            created_at=service.created_at,
            updated_at=service.updated_at,
            status_history=status_history,
        )


provider_controller = ProviderController()
