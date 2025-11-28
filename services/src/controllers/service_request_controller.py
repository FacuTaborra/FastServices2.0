from __future__ import annotations

import logging
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from models.ServiceRequest import ServiceRequest
from models.ServiceRequestSchemas import (
    ServiceRequestConfirmPayment,
    ServiceRequestCreate,
    ServiceRequestImageResponse,
    ServiceRequestProposalResponse,
    ServiceRequestTagResponse,
    ServiceRequestResponse,
    ServiceSummaryResponse,
    ServiceRequestUpdate,
    ServiceCancelRequest,
    ServiceReviewCreate,
    ServiceReviewResponse,
    PaymentHistoryItem,
)
from models.User import User
from services.service_request_service import ServiceRequestService
from utils.error_handler import error_handler

logger = logging.getLogger(__name__)


class ServiceRequestController:
    @staticmethod
    @error_handler(logger)
    async def create_request(
        db: AsyncSession, current_user: User, payload: ServiceRequestCreate
    ) -> ServiceRequestResponse:
        service_request = await ServiceRequestService.create_service_request(
            db, current_user=current_user, payload=payload
        )
        return ServiceRequestController._build_response(service_request)

    @staticmethod
    @error_handler(logger)
    async def list_active_without_service(
        db: AsyncSession, current_user: User
    ) -> List[ServiceRequestResponse]:
        requests = await ServiceRequestService.list_active_without_service(
            db, client_id=current_user.id
        )
        return [
            ServiceRequestController._build_response(request) for request in requests
        ]

    @staticmethod
    @error_handler(logger)
    async def list_all_for_client(
        db: AsyncSession, current_user: User
    ) -> List[ServiceRequestResponse]:
        requests = await ServiceRequestService.list_all_for_client(
            db, client_id=current_user.id
        )
        return [
            ServiceRequestController._build_response(request) for request in requests
        ]

    @staticmethod
    @error_handler(logger)
    async def get_request_detail(
        db: AsyncSession, current_user: User, request_id: int
    ) -> ServiceRequestResponse:
        service_request = await ServiceRequestService.get_request_for_client(
            db,
            client_id=current_user.id,
            request_id=request_id,
        )
        return ServiceRequestController._build_response(service_request)

    @staticmethod
    @error_handler(logger)
    async def update_request(
        db: AsyncSession,
        current_user: User,
        request_id: int,
        payload: ServiceRequestUpdate,
    ) -> ServiceRequestResponse:
        updated_request = await ServiceRequestService.update_service_request(
            db,
            client_id=current_user.id,
            request_id=request_id,
            payload=payload,
        )
        return ServiceRequestController._build_response(updated_request)

    @staticmethod
    @error_handler(logger)
    async def cancel_request(
        db: AsyncSession,
        current_user: User,
        request_id: int,
    ) -> ServiceRequestResponse:
        updated_request = await ServiceRequestService.cancel_request(
            db,
            client_id=current_user.id,
            request_id=request_id,
        )
        return ServiceRequestController._build_response(updated_request)

    @staticmethod
    @error_handler(logger)
    async def confirm_payment(
        db: AsyncSession,
        current_user: User,
        request_id: int,
        payload: ServiceRequestConfirmPayment,
    ) -> ServiceRequestResponse:
        updated_request = await ServiceRequestService.confirm_payment(
            db,
            client_id=current_user.id,
            request_id=request_id,
            payload=payload,
        )
        return ServiceRequestController._build_response(updated_request)

    @staticmethod
    async def cancel_service(
        db: AsyncSession,
        current_user: User,
        request_id: int,
        payload: ServiceCancelRequest | None,
    ) -> ServiceRequestResponse:
        del payload  # Motivo opcional (no almacenado aún)
        updated_request = await ServiceRequestService.cancel_service(
            db,
            client_id=current_user.id,
            request_id=request_id,
        )
        return ServiceRequestController._build_response(updated_request)

    @staticmethod
    async def mark_service_in_progress(
        db: AsyncSession,
        current_user: User,
        request_id: int,
    ) -> ServiceRequestResponse:
        updated_request = await ServiceRequestService.mark_service_in_progress(
            db,
            client_id=current_user.id,
            request_id=request_id,
        )
        return ServiceRequestController._build_response(updated_request)

    @staticmethod
    async def mark_service_on_route(
        db: AsyncSession,
        current_user: User,
        request_id: int,
    ) -> ServiceRequestResponse:
        updated_request = await ServiceRequestService.mark_service_on_route(
            db,
            client_id=current_user.id,
            request_id=request_id,
        )
        return ServiceRequestController._build_response(updated_request)

    @staticmethod
    @error_handler(logger)
    async def submit_service_review(
        db: AsyncSession,
        current_user: User,
        request_id: int,
        payload: ServiceReviewCreate,
    ) -> ServiceRequestResponse:
        updated_request = await ServiceRequestService.submit_service_review(
            db,
            client_id=current_user.id,
            request_id=request_id,
            payload=payload,
        )
        return ServiceRequestController._build_response(updated_request)

    @staticmethod
    @error_handler(logger)
    async def get_payment_history(
        db: AsyncSession, current_user: User
    ) -> List[PaymentHistoryItem]:
        return await ServiceRequestService.get_payment_history(
            db, client_id=current_user.id
        )

    @staticmethod
    def _build_response(service_request: ServiceRequest) -> ServiceRequestResponse:
        attachments = ServiceRequestController._serialize_attachments(service_request)
        tag_links = sorted(
            list(service_request.tag_links or []),
            key=lambda link: (
                (link.tag.slug if getattr(link, "tag", None) else ""),
                link.id,
            ),
        )
        tags = [ServiceRequestTagResponse.model_validate(link) for link in tag_links]

        proposals = ServiceRequestController._serialize_proposals(service_request)
        service_summary = ServiceRequestController._build_service_summary(
            service_request
        )

        address_details: dict | None = None
        address_label: str | None = None
        if service_request.address is not None:
            address_obj = service_request.address
            address_details = {
                "id": address_obj.id,
                "title": address_obj.title,
                "street": address_obj.street,
                "city": address_obj.city,
                "state": address_obj.state,
                "postal_code": address_obj.postal_code,
                "country": address_obj.country,
                "additional_info": address_obj.additional_info,
                "latitude": float(address_obj.latitude)
                if address_obj.latitude is not None
                else None,
                "longitude": float(address_obj.longitude)
                if address_obj.longitude is not None
                else None,
            }

            parts = [address_obj.street, address_obj.city, address_obj.state]
            if address_obj.postal_code:
                parts.append(address_obj.postal_code)
            if address_obj.country and address_obj.country.lower() not in {""}:
                parts.append(address_obj.country)
            address_label = (
                ", ".join(
                    segment.strip()
                    for segment in parts
                    if isinstance(segment, str) and segment.strip()
                )
                or None
            )

            if not address_label and service_request.city_snapshot:
                address_label = service_request.city_snapshot
        elif service_request.city_snapshot:
            address_label = service_request.city_snapshot

        client_name = None
        client_avatar_url = None
        if getattr(service_request, "client", None):
            first = (service_request.client.first_name or "").strip()
            last = (service_request.client.last_name or "").strip()
            client_name = (
                " ".join(part for part in [first, last] if part).strip() or None
            )
            client_avatar_url = getattr(
                service_request.client, "profile_image_url", None
            )

        return ServiceRequestResponse(
            id=service_request.id,
            client_id=service_request.client_id,
            client_name=client_name,
            client_avatar_url=client_avatar_url,
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
            address=address_label,
            address_details=address_details,
            tags=tags,
            attachments=attachments,
            proposal_count=len(proposals),
            proposals=proposals,
            service=service_summary,
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

    @staticmethod
    def _serialize_proposals(
        service_request: ServiceRequest,
    ) -> List[ServiceRequestProposalResponse]:
        proposals = list(service_request.proposals or [])
        proposals.sort(key=lambda proposal: (proposal.quoted_price, proposal.id))

        serialized: List[ServiceRequestProposalResponse] = []
        for proposal in proposals:
            provider_name = "Proveedor sin nombre"
            provider_rating = None
            provider_reviews = None
            provider_image_url = None
            if proposal.provider:
                provider_rating = getattr(proposal.provider, "rating_avg", None)
                provider_reviews = getattr(proposal.provider, "total_reviews", None)

            if proposal.provider and proposal.provider.user:
                user = proposal.provider.user
                first = (user.first_name or "").strip()
                last = (user.last_name or "").strip()
                provider_name = (
                    " ".join(part for part in [first, last] if part).strip()
                    or provider_name
                )
                provider_image_url = getattr(user, "profile_image_url", None)

            serialized.append(
                ServiceRequestProposalResponse(
                    id=proposal.id,
                    provider_profile_id=proposal.provider_profile_id,
                    provider_display_name=provider_name,
                    provider_rating_avg=provider_rating,
                    provider_total_reviews=provider_reviews,
                    provider_image_url=provider_image_url,
                    quoted_price=proposal.quoted_price,
                    currency=proposal.currency,
                    status=proposal.status,
                    proposed_start_at=proposal.proposed_start_at,
                    proposed_end_at=proposal.proposed_end_at,
                    valid_until=proposal.valid_until,
                    notes=proposal.notes,
                    created_at=proposal.created_at,
                    updated_at=proposal.updated_at,
                )
            )

        return serialized

    @staticmethod
    def _build_service_summary(
        service_request: ServiceRequest,
    ) -> ServiceSummaryResponse | None:
        service = getattr(service_request, "service", None)
        if not service:
            return None
        provider_name = None
        if service.provider and service.provider.user:
            first = (service.provider.user.first_name or "").strip()
            last = (service.provider.user.last_name or "").strip()
            provider_name = (
                " ".join(part for part in [first, last] if part).strip() or None
            )

        currency = getattr(service, "currency", None)
        if currency is None and service.proposal is not None:
            currency = service.proposal.currency

        history_items = sorted(
            list(service.status_history or []),
            key=lambda item: (item.changed_at or item.id or 0),
        )
        history_payload = [
            {
                "id": history.id,
                "service_id": history.service_id,
                "from_status": history.from_status,
                "to_status": history.to_status,
                "changed_at": history.changed_at,
                "changed_by": history.changed_by,
            }
            for history in history_items
        ]

        client_review_payload: ServiceReviewResponse | None = None
        for review in list(getattr(service, "reviews", []) or []):
            if review.rater_user_id == service_request.client_id:
                client_review_payload = ServiceReviewResponse(
                    id=review.id,
                    rating=review.rating,
                    comment=review.comment,
                    created_at=review.created_at,
                )
                break

        return ServiceSummaryResponse(
            id=service.id,
            status=service.status,
            proposal_id=service.proposal_id,
            scheduled_start_at=service.scheduled_start_at,
            scheduled_end_at=service.scheduled_end_at,
            total_price=service.total_price,
            currency=currency,
            address_snapshot=service.address_snapshot,
            provider_profile_id=service.provider_profile_id,
            provider_display_name=provider_name,
            status_history=history_payload,
            client_review=client_review_payload,
            created_at=service.created_at,
            updated_at=service.updated_at,
        )


service_request_controller = ServiceRequestController()
