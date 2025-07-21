from pydantic import BaseModel
from typing import Union, Optional, List
from datetime import datetime


class Token(BaseModel):
    """Modelo para la respuesta del token JWT."""

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Modelo para los datos del token decodificado."""

    username: Union[str, None] = None
