from pydantic import BaseModel
from typing import Union, Optional


class Token(BaseModel):
    """Modelo para la respuesta del token JWT."""

    access_token: str
    token_type: str
    role: Optional[str] = None
    user_id: Optional[int] = None


class TokenData(BaseModel):
    """Modelo para los datos del token decodificado."""

    username: Union[str, None] = None
