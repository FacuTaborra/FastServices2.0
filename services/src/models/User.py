from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class User(BaseModel):
    """Modelo base para un usuario."""

    username: str
    email: str
    disabled: bool = False


class UserInDB(User):
    """Modelo para usuario con password hasheado (para la DB)."""

    hashed_password: str
