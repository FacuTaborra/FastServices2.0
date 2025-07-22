from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import timedelta
from auth.auth_utils import authenticate_user, create_access_token
from settings import JWT_EXPIRE_MINUTES
from models.Token import Token


class UserController:
    def __init__(self):
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

    async def authenticate_and_create_token(
        self, form_data: OAuth2PasswordRequestForm
    ) -> Token:
        """
        Autentica un usuario y crea un token JWT.
        """
        user = authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        access_token_expires = timedelta(minutes=JWT_EXPIRE_MINUTES)

        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return Token(access_token=access_token, token_type="bearer")


user_controller = UserController()
