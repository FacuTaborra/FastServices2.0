"""
Router para operaciones de usuarios.
Incluye endpoints para registro, login y operaciones básicas de usuario.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from controllers.user_controller import user_controller
from models.Token import Token
from models.User import User, UserResponse, LoginRequest, UserCreate, UserRole
from auth.auth_utils import check_user_login
from services.user_service import user_service

router = APIRouter(prefix="/users", tags=["users"])


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
