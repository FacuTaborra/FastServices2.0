from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.database import get_db
from models.ProviderProfile import (
    ProviderRegisterRequest,
    ProviderResponse,
    ProviderProfileUpdate,
    ProviderLicenseResponse,
    ProviderLicenseBulkCreate,
    ProviderProposalResponse,
    ProviderProposalCreate,
    ProviderServiceResponse,
    ProviderOverviewKpisResponse,
    ProviderRevenueStatsResponse,
    ProviderRatingDistributionResponse,
    ProposalNotesRewriteInput,
    ProposalNotesRewriteOutput,
)
from models.User import UserRole
from models.ServiceRequest import ServiceRequest
from models.ServiceRequestSchemas import ServiceRequestResponse, CurrencyResponse
from controllers.provider_controller import ProviderController
from controllers.llm_controller import LLMController
from auth.auth_utils import get_current_user

router = APIRouter(prefix="/providers")


@router.post(
    "/register",
    response_model=ProviderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo proveedor",
    description="Crea una cuenta de proveedor con perfil completo en el sistema",
)
async def register_provider(
    provider_data: ProviderRegisterRequest, db: AsyncSession = Depends(get_db)
):
    new_provider = await ProviderController.create_provider(db, provider_data)
    return new_provider


@router.get(
    "/me",
    response_model=ProviderResponse,
    summary="Obtener perfil del proveedor actual",
    description="Retorna el perfil completo del proveedor autenticado",
)
async def get_current_provider_profile(
    current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    provider = await ProviderController.get_provider_by_id(db, current_user.id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de proveedor no encontrado",
        )

    return provider


@router.put(
    "/me/profile",
    response_model=ProviderResponse,
    summary="Actualizar perfil del proveedor",
    description="Actualiza la información del perfil del proveedor autenticado",
)
async def update_provider_profile(
    profile_data: ProviderProfileUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    updated_provider = await ProviderController.update_provider_profile(
        db, current_user.id, profile_data
    )

    if not updated_provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de proveedor no encontrado",
        )

    return updated_provider


@router.post(
    "/me/licenses",
    response_model=list[ProviderLicenseResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Registrar licencias del proveedor",
    description="Agrega una o varias licencias profesionales al perfil del proveedor autenticado",
)
async def add_provider_licenses(
    payload: ProviderLicenseBulkCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    licenses = await ProviderController.add_provider_licenses(
        db, current_user.id, payload.licenses
    )

    return licenses


@router.get(
    "/currencies",
    response_model=list[CurrencyResponse],
    summary="Listar monedas disponibles",
    description="Devuelve el catálogo de monedas que se pueden utilizar al generar un presupuesto",
)
async def list_currencies(
    current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    return await ProviderController.list_currencies(db)


@router.post(
    "/proposals/rewrite-notes",
    response_model=ProposalNotesRewriteOutput,
    summary="Reescribir notas de presupuesto con AI",
    description="Usa AI para mejorar la redacción de las notas de un presupuesto",
)
async def rewrite_proposal_notes_endpoint(
    payload: ProposalNotesRewriteInput,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProposalNotesRewriteOutput:
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    stmt = select(ServiceRequest).where(ServiceRequest.id == payload.request_id)
    result = await db.execute(stmt)
    service_request = result.scalar_one_or_none()

    if not service_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La solicitud indicada no existe",
        )

    llm_controller = LLMController()
    rewritten = llm_controller.rewrite_proposal_notes(
        request_title=service_request.title or "",
        request_description=service_request.description or "",
        notes=payload.notes,
    )

    return ProposalNotesRewriteOutput(
        notes=rewritten.get("notes", payload.notes),
    )


@router.get(
    "/{provider_id}",
    response_model=ProviderResponse,
    summary="Obtener perfil público de proveedor",
    description="Retorna el perfil público de un proveedor específico",
)
async def get_provider_public_profile(
    provider_id: int, db: AsyncSession = Depends(get_db)
):
    provider = await ProviderController.get_provider_by_id(db, provider_id)

    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado"
        )

    return provider


@router.get(
    "/me/matching-requests",
    response_model=list[ServiceRequestResponse],
    summary="Listar solicitudes compatibles",
    description="Retorna solicitudes publicadas cuyos tags coinciden con las licencias del proveedor autenticado",
)
async def list_matching_service_requests(
    current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    return await ProviderController.list_matching_service_requests(db, current_user.id)


@router.post(
    "/me/requests/{request_id}/reject",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Rechazar solicitud de servicio",
    description="Marca una solicitud como rechazada para el proveedor, ocultándola de futuras búsquedas.",
)
async def reject_service_request(
    request_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    await ProviderController.reject_service_request(db, current_user.id, request_id)
    return None


@router.get(
    "/me/proposals",
    response_model=list[ProviderProposalResponse],
    summary="Listar presupuestos del proveedor",
    description=(
        "Devuelve los presupuestos generados por el proveedor. "
        "Incluye todos los presupuestos en estado pending y los rechazados de las últimas 24 horas, "
        "ordenados priorizando los pendientes más recientes."
    ),
)
async def list_provider_proposals(
    current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    return await ProviderController.list_provider_proposals(db, current_user.id)


@router.get(
    "/me/services",
    response_model=list[ProviderServiceResponse],
    summary="Listar servicios del proveedor",
    description=(
        "Devuelve los servicios del proveedor. Usa filter_type para filtrar: "
        "'all' (todos), 'active' (en progreso), 'completed' (completados por fecha)."
    ),
)
async def list_provider_services(
    filter_type: str = Query(
        "all",
        description="Tipo de filtro: 'all', 'active', o 'completed'.",
    ),
    completed_date: str = Query(
        None,
        description="Fecha para filtrar servicios completados (formato: YYYY-MM-DD). Solo aplica si filter_type es 'all' o 'completed'.",
    ),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    return await ProviderController.list_provider_services(
        db, current_user.id, completed_date, filter_type
    )


@router.get(
    "/me/stats/overview",
    response_model=ProviderOverviewKpisResponse,
    summary="Obtener KPIs generales del proveedor",
    description=(
        "Devuelve métricas rápidas sobre servicios, aceptación de propuestas y facturación"
        " para el panel del proveedor."
    ),
)
async def get_provider_overview_stats(
    currency: str = Query(None, description="Moneda para filtrar las estadísticas"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    return await ProviderController.get_provider_overview_stats(
        db, current_user.id, currency
    )


@router.get(
    "/me/stats/revenue",
    response_model=ProviderRevenueStatsResponse,
    summary="Obtener ingresos por mes",
    description=(
        "Devuelve la facturación mensual y el ticket promedio para un rango de meses"
        " configurable."
    ),
)
async def get_provider_revenue_stats_endpoint(
    months: int = Query(6, ge=1, le=12, description="Cantidad de meses a consultar"),
    currency: str = Query(None, description="Moneda para filtrar las estadísticas"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    return await ProviderController.get_provider_revenue_stats(
        db, current_user.id, months, currency
    )


@router.get(
    "/me/stats/ratings",
    response_model=ProviderRatingDistributionResponse,
    summary="Obtener distribución de calificaciones",
    description=(
        "Devuelve la evolución mensual de reseñas recibidas por puntaje para"
        " el panel de satisfacción del proveedor."
    ),
)
async def get_provider_rating_distribution_endpoint(
    months: int = Query(6, ge=1, le=12, description="Cantidad de meses a consultar"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    return await ProviderController.get_provider_rating_distribution(
        db, current_user.id, months
    )


@router.post(
    "/me/services/{service_id}/mark-on-route",
    response_model=ProviderServiceResponse,
    summary="Marcar servicio como en camino",
    description="Actualiza el estado de un servicio confirmado a en camino",
)
async def mark_service_on_route_for_provider(
    service_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    return await ProviderController.mark_service_on_route(
        db, current_user.id, service_id
    )


@router.post(
    "/me/services/{service_id}/mark-in-progress",
    response_model=ProviderServiceResponse,
    summary="Marcar servicio en progreso",
    description="Actualiza el estado de un servicio a en progreso",
)
async def mark_service_in_progress_for_provider(
    service_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    return await ProviderController.mark_service_in_progress(
        db, current_user.id, service_id
    )


@router.post(
    "/me/services/{service_id}/mark-completed",
    response_model=ProviderServiceResponse,
    summary="Marcar servicio completado",
    description="Actualiza el estado de un servicio a completado",
)
async def mark_service_completed_for_provider(
    service_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    return await ProviderController.mark_service_completed(
        db, current_user.id, service_id
    )


@router.post(
    "/me/proposals",
    response_model=ProviderProposalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un presupuesto",
    description="Crea una propuesta para una solicitud específica",
)
async def create_provider_proposal(
    payload: ProviderProposalCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role != UserRole.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    return await ProviderController.create_provider_proposal(
        db, current_user.id, payload
    )
