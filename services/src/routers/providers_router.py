"""
Router para endpoints de proveedores de servicios.
Maneja autenticación, registro y gestión de perfiles de proveedores.
"""

from datetime import timedelta
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database.database import get_db
from models.Token import Token
from models.ProviderProfile import (
    ProviderRegisterRequest,
    ProviderLoginRequest,
    ProviderResponse,
    ProviderProfileUpdate,
)
from controllers.provider_controller import ProviderController
from auth.auth_utils import (
    authenticate_user,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

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
    """
    Registrar un nuevo proveedor de servicios.

    - **first_name**: Nombre del proveedor
    - **last_name**: Apellido del proveedor
    - **email**: Email único del proveedor
    - **phone**: Teléfono único del proveedor
    - **password**: Contraseña (mínimo 6 caracteres)
    - **bio**: Biografía opcional del proveedor
    - **service_radius_km**: Radio de servicio (1-100 km, default: 10)

    Returns:
        ProviderResponse: Datos completos del proveedor creado
    """
    try:
        new_provider = await ProviderController.create_provider(db, provider_data)
        return new_provider
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}",
        )


@router.post(
    "/login",
    response_model=Token,
    summary="Iniciar sesión como proveedor",
    description="Autentica un proveedor y retorna token JWT",
)
async def login_provider(login_data: ProviderLoginRequest):
    """
    Iniciar sesión como proveedor de servicios.

    - **email**: Email del proveedor
    - **password**: Contraseña del proveedor

    Returns:
        Token: Token JWT para autenticación en requests posteriores
    """
    # Autenticar usuario
    user = await authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar que sea un proveedor
    if user.role != "provider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    # Crear token de acceso
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    response_model=ProviderResponse,
    summary="Obtener perfil del proveedor actual",
    description="Retorna el perfil completo del proveedor autenticado",
)
async def get_current_provider_profile(
    current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Obtener el perfil completo del proveedor autenticado.

    Requiere:
        - Token JWT válido en header Authorization: Bearer <token>
        - Usuario con rol 'provider'

    Returns:
        ProviderResponse: Perfil completo del proveedor con estadísticas
    """
    # Verificar que sea un proveedor
    if current_user.role != "provider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    # Obtener perfil completo
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
    """
    Actualizar el perfil del proveedor autenticado.

    - **bio**: Nueva biografía (opcional)
    - **service_radius_km**: Nuevo radio de servicio (opcional)
    - **is_online**: Estado en línea (opcional)

    Returns:
        ProviderResponse: Perfil actualizado del proveedor
    """
    # Verificar que sea un proveedor
    if current_user.role != "provider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    # Actualizar perfil
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
    "/me/toggle-online",
    response_model=dict,
    summary="Cambiar estado en línea",
    description="Alterna el estado en línea/fuera de línea del proveedor",
)
async def toggle_online_status(
    current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Cambiar el estado en línea del proveedor.

    Alterna entre en línea (disponible para recibir solicitudes)
    y fuera de línea (no disponible).

    Returns:
        dict: Nuevo estado en línea del proveedor
    """
    # Verificar que sea un proveedor
    if current_user.role != "provider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para proveedores de servicios",
        )

    # Cambiar estado
    new_status = await ProviderController.toggle_provider_online_status(
        db, current_user.id
    )

    if new_status is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de proveedor no encontrado",
        )

    return {
        "is_online": new_status,
        "message": f"Estado cambiado a {'en línea' if new_status else 'fuera de línea'}",
    }


@router.get(
    "/nearby",
    response_model=List[ProviderResponse],
    summary="Buscar proveedores cercanos",
    description="Encuentra proveedores disponibles en un área específica",
)
async def get_nearby_providers(
    latitude: float,
    longitude: float,
    radius_km: int = 20,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """
    Buscar proveedores disponibles en un área específica.

    - **latitude**: Latitud del punto de búsqueda
    - **longitude**: Longitud del punto de búsqueda
    - **radius_km**: Radio de búsqueda en kilómetros (default: 20)
    - **limit**: Máximo número de resultados (default: 50)

    Returns:
        List[ProviderResponse]: Lista de proveedores disponibles en el área
    """
    try:
        providers = await ProviderController.get_providers_by_radius(
            db=db,
            latitude=latitude,
            longitude=longitude,
            max_distance_km=radius_km,
            limit=limit,
        )

        return providers

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al buscar proveedores: {str(e)}",
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
    """
    Obtener el perfil público de un proveedor específico.

    - **provider_id**: ID del proveedor a consultar

    Returns:
        ProviderResponse: Perfil público del proveedor
    """
    provider = await ProviderController.get_provider_by_id(db, provider_id)

    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado"
        )

    return provider
