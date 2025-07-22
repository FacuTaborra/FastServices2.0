from datetime import datetime, timedelta
from typing import Union
from jose import jwt, JWTError
from fastapi import HTTPException, Depends
from settings import JWT_SECRET_KEY, JWT_ALGORITHM
from models.User import User, UserInDB
from fastapi.security import OAuth2PasswordBearer
import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

USERDB = {
    "testuser": {
        "username": "testuser",
        "email": "test@test.com",
        "disabled": False,
        "hashed_password": bcrypt.hashpw(
            "test123".encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8"),
    }
}


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


def get_user(email: str) -> Union[User, None]:
    """Obtiene un usuario de la base de datos por email."""
    for username, user_data in USERDB.items():
        if user_data.get("email") == email:
            return User(**user_data)
    return None


def get_user_with_password(email: str) -> Union[UserInDB, None]:
    """Obtiene un usuario de la base de datos con contraseña hasheada por email."""
    for username, user_data in USERDB.items():
        if user_data.get("email") == email:
            return UserInDB(**user_data)
    return None


def authenticate_user(email: str, password: str) -> Union[User, None]:
    """Autentica un usuario verificando email y password."""
    user = get_user_with_password(email)
    if not user or not is_password_valid(password, user.hashed_password):
        return None
    return get_user(email)


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


def get_authenticated_user(token: str = Depends(oauth2_scheme)) -> User:
    """Obtiene el usuario desde el token JWT."""
    payload = decode_token(token)
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
        )
    user = get_user(email)
    return user


def check_user_login(current_user: User = Depends(get_authenticated_user)) -> User:
    """Verifica que el usuario esta activo."""
    if current_user.disabled:
        raise HTTPException(
            status_code=400,
            detail="Inactive user",
        )
    return current_user
