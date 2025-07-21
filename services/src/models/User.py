from pydantic import BaseModel


class User(BaseModel):
    """Modelo base para un usuario."""

    username: str
    disabled: bool = False


class UserInDB(User):
    """Modelo para usuario con password hasheado (para la DB)."""

    hashed_password: str
