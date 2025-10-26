from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database.database import get_db
from models.ProviderProfile import (
    ProviderRegisterRequest,
    ProviderResponse,
    ProviderProfileUpdate,
    ProviderLicenseResponse,
    ProviderLicenseBulkCreate,
)
from models.User import UserRole
from controllers.provider_controller import ProviderController
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
