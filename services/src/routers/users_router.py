"""
Router para operaciones de usuarios.
Incluye endpoints para registro, login y operaciones básicas de usuario.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from controllers.user_controller import user_controller
from models.Token import Token
from models.User import (
    User,
    UserResponse,
    LoginRequest,
    UserCreate,
    UserRole,
    UserUpdate,
    ChangePasswordRequest,
)
from auth.auth_utils import check_user_login
from services.user_service import user_service

router = APIRouter(prefix="/users", tags=["clients"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario",
    description="Crea un nuevo usuario en el sistema con rol de cliente por defecto",
)
async def register_user(user_data: UserCreate) -> UserResponse:
    """Endpoint para registrar un nuevo usuario."""
    user = await user_service.create_user(user_data)
    return UserResponse.from_orm(user)


@router.post(
    "/login",
    response_model=Token,
    summary="Iniciar sesión",
    description="Autentica un usuario y retorna un token de acceso JWT",
)
async def login_for_access_token(login_data: LoginRequest) -> Token:
    """Endpoint de login que acepta JSON con email y password."""
    try:
        # Crear objeto compatible con OAuth2PasswordRequestForm
        form_data = type(
            "FormData",
            (object,),
            {
                "username": login_data.email,
                "password": login_data.password,
            },
        )
        return await user_controller.authenticate_and_create_token(form_data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obtener usuario actual",
    description="Retorna la información del usuario autenticado",
)
async def read_me(current_user: User = Depends(check_user_login)) -> UserResponse:
    """Endpoint protegido que retorna la información del usuario actual."""
    return UserResponse.from_orm(current_user)


@router.get(
    "/providers",
    response_model=list[UserResponse],
    summary="Listar proveedores",
    description="Obtiene una lista de usuarios con rol de proveedor",
)
async def get_providers(
    limit: int = 50, current_user: User = Depends(check_user_login)
) -> list[UserResponse]:
    """Endpoint para obtener lista de proveedores activos."""
    providers = await user_service.get_users_by_role(UserRole.PROVIDER, limit)
    return [UserResponse.from_orm(provider) for provider in providers]


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Actualizar perfil de usuario",
    description="Actualiza la información del perfil del usuario autenticado",
)
async def update_user_profile(
    update_data: UserUpdate, current_user: User = Depends(check_user_login)
) -> UserResponse:
    """
    Actualizar el perfil del usuario autenticado.

    - **first_name**: Nuevo nombre (opcional)
    - **last_name**: Nuevo apellido (opcional)
    - **phone**: Nuevo teléfono (opcional)

    Returns:
        UserResponse: Perfil actualizado del usuario
    """
    # Verificar que sea un cliente
    if current_user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo para clientes",
        )

    # Convertir a diccionario excluyendo valores None
    update_dict = update_data.model_dump(exclude_unset=True)

    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se proporcionaron datos para actualizar",
        )

    # Actualizar usuario
    updated_user = await user_service.update_user_profile(current_user.id, update_dict)

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
        )

    return UserResponse.from_orm(updated_user)


@router.put(
    "/me/password",
    summary="Cambiar contraseña",
    description="Cambia la contraseña del usuario autenticado",
)
async def change_password(
    password_data: ChangePasswordRequest, current_user: User = Depends(check_user_login)
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
    success = await user_service.change_user_password(
        current_user.id, password_data.current_password, password_data.new_password
    )

    if success:
        return {"message": "Contraseña cambiada exitosamente"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al cambiar la contraseña",
        )
