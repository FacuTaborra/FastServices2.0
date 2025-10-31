from typing import Optional

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from controllers.user_controller import user_controller
from database.database import get_db
from models.Token import Token
from models.User import LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=Token,
    summary="Iniciar sesión",
    description="Autentica un usuario y retorna un token JWT con su rol",
)
async def login_endpoint(
    login_data: LoginRequest, db: AsyncSession = Depends(get_db)
) -> Token:
    return await user_controller.authenticate_and_create_token(
        db,
        email=login_data.email,
        password=login_data.password,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cerrar sesión",
    description="Finaliza la sesión activa del usuario",
)
async def logout_endpoint(
    token: Optional[str] = Depends(user_controller.oauth2_scheme),
) -> Response:
    await user_controller.logout(token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
