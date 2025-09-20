"""
Router de Direcciones para FastServices.
Define los endpoints REST para gestionar direcciones de usuarios.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.database import get_db
from auth.auth_utils import get_current_user
from models.User import User
from models.Address import (
    AddressCreate,
    AddressUpdate,
    AddressResponse,
    AddressListResponse,
)
from controllers.address_controller import AddressController

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.post("/", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    address_data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Crea una nueva dirección para el usuario autenticado.

    Args:
        address_data: Datos de la dirección a crear
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        AddressResponse: La dirección creada
    """
    return await AddressController.create_address(db, current_user.id, address_data)


@router.get("/", response_model=List[AddressResponse])
async def get_my_addresses(
    include_inactive: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtiene todas las direcciones del usuario autenticado.

    Args:
        include_inactive: Si incluir direcciones inactivas
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        List[AddressResponse]: Lista de direcciones del usuario
    """
    return await AddressController.get_user_addresses(
        db, current_user.id, include_inactive
    )


@router.get("/me", response_model=AddressListResponse)
async def get_addresses_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtiene un resumen de las direcciones del usuario con la dirección predeterminada.

    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        AddressListResponse: Resumen de direcciones con la predeterminada
    """
    addresses = await AddressController.get_user_addresses(db, current_user.id, False)
    default_address = await AddressController.get_default_address(db, current_user.id)

    return AddressListResponse(
        addresses=addresses, total=len(addresses), default_address=default_address
    )


@router.get("/default", response_model=AddressResponse)
async def get_default_address(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtiene la dirección predeterminada del usuario autenticado.

    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        AddressResponse: La dirección predeterminada

    Raises:
        HTTPException: Si no hay dirección predeterminada
    """
    default_address = await AddressController.get_default_address(db, current_user.id)

    if not default_address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay dirección predeterminada configurada",
        )

    return default_address


@router.get("/{address_id}", response_model=AddressResponse)
async def get_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtiene una dirección específica del usuario autenticado.

    Args:
        address_id: ID de la dirección
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        AddressResponse: La dirección solicitada
    """
    return await AddressController.get_address_by_id(db, current_user.id, address_id)


@router.put("/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: int,
    address_data: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Actualiza una dirección del usuario autenticado.

    Args:
        address_id: ID de la dirección
        address_data: Datos de actualización
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        AddressResponse: La dirección actualizada
    """
    return await AddressController.update_address(
        db, current_user.id, address_id, address_data
    )


@router.patch("/{address_id}/set-default", response_model=AddressResponse)
async def set_default_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Establece una dirección como la predeterminada para el usuario autenticado.

    Args:
        address_id: ID de la dirección
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        AddressResponse: La dirección marcada como predeterminada
    """
    return await AddressController.set_default_address(db, current_user.id, address_id)


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Elimina (marca como inactiva) una dirección del usuario autenticado.

    Args:
        address_id: ID de la dirección
        current_user: Usuario autenticado
        db: Sesión de base de datos
    """
    await AddressController.delete_address(db, current_user.id, address_id)


# Endpoints adicionales para administradores (futuro)


@router.get("/users/{user_id}/addresses", response_model=List[AddressResponse])
async def get_user_addresses_admin(
    user_id: int,
    include_inactive: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtiene todas las direcciones de un usuario específico.
    Solo para administradores.

    Args:
        user_id: ID del usuario
        include_inactive: Si incluir direcciones inactivas
        current_user: Usuario autenticado (debe ser admin)
        db: Sesión de base de datos

    Returns:
        List[AddressResponse]: Lista de direcciones del usuario

    Raises:
        HTTPException: Si el usuario no es administrador
    """
    # Verificar que sea administrador
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden acceder a direcciones de otros usuarios",
        )

    return await AddressController.get_user_addresses(db, user_id, include_inactive)
