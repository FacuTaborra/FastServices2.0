from fastapi import APIRouter, Depends, HTTPException
from controllers.user_controller import user_controller
from models.Token import Token
from models.User import User, LoginRequest
from auth.auth_utils import check_user_login

router = APIRouter(prefix="/users")


@router.post("/login", response_model=Token)
async def login_for_access_token(login_data: LoginRequest) -> Token:
    """
    Endpoint de login que acepta JSON con email y password
    """
    try:
        # Crear un objeto similar a OAuth2PasswordRequestForm pero con email
        form_data = type(
            "obj",
            (object,),
            {
                "username": login_data.email,  # Usar email como username para la función
                "password": login_data.password,
            },
        )
        return await user_controller.authenticate_and_create_token(form_data)
    except Exception:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")


@router.get("/user", response_model=User)
async def read_me(currentUser: User = Depends(check_user_login)):
    """
    Endpoint protegido que retorna la información del usuario actual.
    Lo pongo para ver si anda nomas
    """
    return currentUser
