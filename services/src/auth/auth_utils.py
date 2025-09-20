from datetime import datetime, timedelta
from typing import Union
from jose import jwt, JWTError
from fastapi import HTTPException, Depends
from sqlalchemy import select
from settings import JWT_SECRET_KEY, JWT_ALGORITHM
from models.User import User
from database.database import AsyncSessionLocal
from fastapi.security import OAuth2PasswordBearer
import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")


def is_password_valid(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña en texto plano coincide con la hasheada."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def get_password_hash(password: str) -> str:
    """Retorna el hash de una contraseña."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


async def get_user_by_email(email: str) -> Union[User, None]:
    """Obtiene un usuario de la base de datos por email."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == email, User.is_active)
        )
        return result.scalar_one_or_none()


async def authenticate_user(email: str, password: str) -> Union[User, None]:
    """Autentica un usuario verificando email y password."""
    user = await get_user_by_email(email)
    if not user or not is_password_valid(password, user.password_hash):
        return None
    return user


def create_access_token(
    data: dict, expires_delta: Union[timedelta, None] = None
) -> str:
    """Crea un token JWT."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decodifica un token JWT y retorna los datos."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token is invalid or has expired",
        )


async def get_authenticated_user(token: str = Depends(oauth2_scheme)) -> User:
    """Obtiene el usuario desde el token JWT."""
    payload = decode_token(token)
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
        )
    user = await get_user_by_email(email)
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )
    return user


async def check_user_login(
    current_user: User = Depends(get_authenticated_user),
) -> User:
    """Verifica que el usuario esta activo."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Inactive user",
        )
    return current_user
