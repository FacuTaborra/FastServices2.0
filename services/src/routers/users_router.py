"""
Router para operaciones de usuarios.
Incluye endpoints para registro, login y operaciones básicas de usuario.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from controllers.user_controller import UserController
from database.database import get_db
from models.User import (
    User,
    UserResponse,
    UserCreate,
    UserRole,
    UserUpdate,
    ChangePasswordRequest,
)
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
    """Endpoint para registrar un nuevo usuario."""
    user = await UserController.create_user(db, user_data)
    return UserResponse.model_validate(user)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obtener usuario actual",
    description="Retorna la información del usuario autenticado",
)
async def read_me(current_user: User = Depends(check_user_login)) -> UserResponse:
    """Endpoint protegido que retorna la información del usuario actual."""
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
    """Endpoint para obtener lista de proveedores activos."""
    providers = await UserController.get_users_by_role(db, UserRole.PROVIDER, limit)
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
    """
    Actualizar el perfil del usuario autenticado.

    - **first_name**: Nuevo nombre (opcional)
    - **last_name**: Nuevo apellido (opcional)
    - **phone**: Nuevo teléfono (opcional)
    - **date_of_birth**: Nueva fecha de nacimiento (opcional)

    Returns:
        UserResponse: Perfil actualizado del usuario
    """
    # Verificar que sea un cliente o proveedor
    if current_user.role not in ["client", "provider"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para clientes y proveedores",
        )

    # Actualizar usuario
    updated_user = await UserController.update_user_profile(
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
):
    """
    Cambiar la contraseña del usuario autenticado.

    - **current_password**: Contraseña actual
    - **new_password**: Nueva contraseña
    - **confirm_password**: Confirmación de nueva contraseña

    Returns:
        dict: Mensaje de confirmación
    """
    # Verificar que sea un cliente
    if current_user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para clientes",
        )

    # Verificar que las contraseñas coincidan
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden",
        )

    # Verificar que la nueva contraseña sea diferente
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente a la actual",
        )

    # Cambiar contraseña
    success = await UserController.change_user_password(
        db, current_user.id, password_data.current_password, password_data.new_password
    )

    if success:
        return {"message": "Contraseña cambiada exitosamente"}
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
):
    """
    Actualizar imagen de perfil del usuario.

    Recibe los datos de la imagen subida a S3 y actualiza el perfil del usuario.
    """
    try:
        # Validar datos requeridos
        if not image_data.get("s3_key") or not image_data.get("public_url"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faltan datos de la imagen (s3_key y public_url requeridos)",
            )

        # Eliminar imagen anterior si existe
        if current_user.profile_image_s3_key:
            try:
                from services.s3_service import s3_service

                logger.info(
                    f"🗑️ Eliminando imagen anterior: {current_user.profile_image_s3_key}"
                )
                s3_service.delete_image(current_user.profile_image_s3_key)
                logger.info("✅ Imagen anterior eliminada exitosamente")
            except Exception as delete_error:
                logger.warning(f"⚠️ No se pudo eliminar imagen anterior: {delete_error}")
                # No fallar la operación completa por esto

        # Actualizar en la base de datos
        from datetime import datetime

        update_data = UserUpdate(
            profile_image_s3_key=image_data["s3_key"],
            profile_image_url=image_data["public_url"],
            profile_image_uploaded_at=datetime.now(),
        )

        updated_user = await UserController.update_user_profile(
            db, current_user.id, update_data
        )

        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
            )

        return updated_user

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error actualizando imagen de perfil: {str(e)}",
        )


@router.delete("/delete-profile-image", response_model=UserResponse)
async def delete_profile_image(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_user_login),
):
    """
    Eliminar imagen de perfil del usuario.

    Elimina la imagen de S3 y limpia los campos de imagen en el perfil del usuario.
    """
    try:
        # Verificar que el usuario tenga una imagen para eliminar
        if not current_user.profile_image_s3_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario no tiene imagen de perfil para eliminar",
            )

        # Eliminar imagen de S3
        try:
            from services.s3_service import s3_service

            logger.info(
                f"🗑️ Eliminando imagen de perfil: {current_user.profile_image_s3_key}"
            )
            success = s3_service.delete_image(current_user.profile_image_s3_key)

            if success:
                logger.info("✅ Imagen eliminada de S3 exitosamente")
            else:
                logger.warning("⚠️ No se pudo eliminar la imagen de S3")

        except Exception as delete_error:
            logger.error(f"❌ Error eliminando imagen de S3: {delete_error}")
            # Continuar con la limpieza de la base de datos aunque falle S3

        # Limpiar campos de imagen en la base de datos
        update_data = UserUpdate(
            profile_image_s3_key=None,
            profile_image_url=None,
            profile_image_uploaded_at=None,
        )

        updated_user = await UserController.update_user_profile(
            db, current_user.id, update_data
        )

        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
            )

        logger.info(f"✅ Imagen de perfil eliminada para usuario {current_user.email}")
        return updated_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error eliminando imagen de perfil: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error eliminando imagen de perfil: {str(e)}",
        )
