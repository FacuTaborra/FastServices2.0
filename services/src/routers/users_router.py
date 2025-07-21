from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from controllers.user_controller import user_controller
from models.Token import Token
from models.User import User
from auth.auth_utils import check_user_login

router = APIRouter(prefix="/users")


@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Token:
    return await user_controller.authenticate_and_create_token(form_data)


@router.get("/user", response_model=User)
async def read_me(currentUser: User = Depends(check_user_login)):
    """
    Endpoint protegido que retorna la información del usuario actual.
    Lo pongo para ver si anda nomas
    """
    return currentUser
