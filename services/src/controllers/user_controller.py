from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from models.User import User, UserCreate, UserRole, UserUpdate
from models.Token import Token
from auth.auth_utils import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    verify_password,
)
from settings import JWT_EXPIRE_MINUTES
from utils.error_hendler import error_handler


class UserController:
    def __init__(self):
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

    async def authenticate_and_create_token(
        self, db: AsyncSession, email: str, password: str
    ) -> Token:
        user = await authenticate_user(email, password, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos",
            )

        access_token_expires = timedelta(minutes=JWT_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user.email,
                "role": getattr(user.role, "value", user.role),
                "uid": user.id,
            },
            expires_delta=access_token_expires,
        )
        return Token(
            access_token=access_token,
            token_type="bearer",
            role=getattr(user.role, "value", user.role),
            user_id=user.id,
        )

    @staticmethod
    @error_handler(
        {
            "email": "El email ya está registrado",
            "phone": "El número de teléfono ya está registrado",
            "default": "Error al registrar usuario",
            "internal": "Error interno del servidor",
        }
    )
    async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
        password_hash = get_password_hash(user_data.password)

        new_user = User(
            role=user_data.role.value,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            phone=user_data.phone,
            date_of_birth=user_data.date_of_birth,
            password_hash=password_hash,
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        return new_user

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        result = await db.execute(
            select(User).where(User.id == user_id, User.is_active)
        )
        return result.scalar_one_or_none()

    @staticmethod
    @error_handler(
        {
            "internal": "Error obteniendo usuario por email",
        }
    )
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(
            select(User).where(User.email == email, User.is_active)
        )
        return result.scalar_one_or_none()

    @staticmethod
    @error_handler(
        {
            "internal": "Error actualizando estado del usuario",
        }
    )
    async def update_user_status(
        db: AsyncSession, user_id: int, is_active: bool
    ) -> bool:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if user:
            user.is_active = is_active
            await db.commit()
            return True
        return False

    @staticmethod
    async def get_users_by_role(
        db: AsyncSession, role: UserRole, limit: int = 100
    ) -> List[User]:
        result = await db.execute(
            select(User).where(User.role == role.value, User.is_active).limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    @error_handler(
        {
            "internal": "Error actualizando perfil de usuario",
        }
    )
    async def update_user_profile(
        db: AsyncSession, user_id: int, update_data: UserUpdate
    ) -> User:
        result = await db.execute(
            select(User).where(User.id == user_id, User.is_active)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if hasattr(user, field) and value is not None:
                setattr(user, field, value)

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    @error_handler(
        {
            "internal": "Error cambiando contraseña",
        }
    )
    async def change_user_password(
        db: AsyncSession, user_id: int, current_password: str, new_password: str
    ) -> bool:
        result = await db.execute(
            select(User).where(User.id == user_id, User.is_active)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        if not verify_password(current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual es incorrecta",
            )

        user.password_hash = get_password_hash(new_password)
        await db.commit()
        return True

    @error_handler()
    async def update_profile_image(
        self,
        db: AsyncSession,
        user: User,
        s3_key: str,
        public_url: str,
    ) -> User:
        from services.s3_service import s3_service

        s3_service.delete_image(user.profile_image_s3_key)

        update_data = UserUpdate(
            profile_image_s3_key=s3_key,
            profile_image_url=public_url,
            profile_image_uploaded_at=datetime.now(),
        )

        updated_user = await self.update_user_profile(db, user.id, update_data)

        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
            )

        return updated_user

    @error_handler()
    async def delete_profile_image(
        self, profile_image_s3_key: str, current_user: User
    ) -> User:
        from services.s3_service import s3_service

        if not profile_image_s3_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario no tiene imagen de perfil para eliminar",
            )

        success = s3_service.delete_image(current_user.profile_image_s3_key)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo eliminar la imagen de perfil",
            )

        updated_user = await self.update_user_profile(
            UserUpdate(
                profile_image_s3_key=None,
                profile_image_url=None,
                profile_image_uploaded_at=None,
            )
        )

        return updated_user


user_controller = UserController()
