"""
Router para operaciones de usuarios.
Incluye endpoints para registro, login y operaciones básicas de usuario.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from controllers.user_controller import user_controller
from database.database import get_db
from models.User import (
    User,
    UserResponse,
    UserCreate,
    UserRole,
    UserUpdate,
    ChangePasswordRequest,
)
from models.GeneralResponse import GeneralResponse
from auth.auth_utils import check_user_login

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["clients"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario",
    description="Crea un nuevo usuario en el sistema con rol de cliente por defecto",
)
async def register_user(
    user_data: UserCreate, db: AsyncSession = Depends(get_db)
) -> UserResponse:
    user = await user_controller.create_user(db, user_data)
    return UserResponse.model_validate(user)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obtener usuario actual",
    description="Retorna la información del usuario autenticado",
)
async def read_me(current_user: User = Depends(check_user_login)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.get(
    "/providers",
    response_model=list[UserResponse],
    summary="Listar proveedores",
    description="Obtiene una lista de usuarios con rol de proveedor",
)
async def get_providers(
    limit: int = 50,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> list[UserResponse]:
    providers = await user_controller.get_users_by_role(db, UserRole.PROVIDER, limit)
    return [UserResponse.model_validate(provider) for provider in providers]


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Actualizar perfil de usuario",
    description="Actualiza la información del perfil del usuario autenticado",
)
async def update_user_profile(
    update_data: UserUpdate,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role not in ["client", "provider"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para clientes y proveedores",
        )

    updated_user = await user_controller.update_user_profile(
        db, current_user.id, update_data
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
        )

    return UserResponse.model_validate(updated_user)


@router.put(
    "/me/password",
    summary="Cambiar contraseña",
    description="Cambia la contraseña del usuario autenticado",
)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(check_user_login),
    db: AsyncSession = Depends(get_db),
) -> GeneralResponse:
    current_role = getattr(current_user.role, "value", current_user.role)
    if current_role not in ["client", "provider"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para clientes y proveedores",
        )

    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden",
        )

    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente a la actual",
        )

    success = await user_controller.change_user_password(
        db, current_user.id, password_data.current_password, password_data.new_password
    )

    if success:
        return GeneralResponse(message="Contraseña cambiada exitosamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al cambiar la contraseña",
        )


@router.put(
    "/update-profile-image",
    response_model=UserResponse,
    summary="Actualizar imagen de perfil",
    description="Actualiza la imagen de perfil del usuario autenticado",
)
async def update_profile_image(
    image_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_user_login),
) -> UserResponse:
    if not image_data.get("s3_key") or not image_data.get("public_url"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faltan datos de la imagen (s3_key y public_url requeridos)",
        )

    updated_user = await user_controller.update_profile_image(
        db=db,
        user=current_user,
        s3_key=image_data.get("s3_key"),
        public_url=image_data.get("public_url"),
    )

    return UserResponse.model_validate(updated_user)


@router.delete("/delete-profile-image", response_model=UserResponse)
async def delete_profile_image(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_user_login),
) -> UserResponse:
    updated_user = await user_controller.delete_profile_image(
        db=db,
        profile_image_s3_key=current_user.profile_image_s3_key,
        current_user=current_user,
    )

    return UserResponse.model_validate(updated_user)
