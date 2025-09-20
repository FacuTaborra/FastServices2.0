"""
Controlador de Usuarios para FastServices.
Contiene la lógica de negocio para operaciones CRUD de usuarios.
"""

from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import timedelta
from models.User import User, UserCreate, UserRole, UserUpdate
from models.Token import Token
from auth.auth_utils import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    verify_password,
)
from settings import JWT_EXPIRE_MINUTES


class UserController:
    """Controlador para operaciones con usuarios."""

    def __init__(self):
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

    async def authenticate_and_create_token(
        self, form_data: OAuth2PasswordRequestForm
    ) -> Token:
        """
        Autentica un usuario y crea un token JWT.
        """
        user = await authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos",
            )

        access_token_expires = timedelta(minutes=JWT_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return Token(access_token=access_token, token_type="bearer")

    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
        """
        Crear un nuevo usuario en el sistema.

        Args:
            db: Sesión de base de datos
            user_data: Datos del usuario a crear

        Returns:
            User: Usuario creado con todos los campos poblados

        Raises:
            HTTPException: Si hay errores de validación o duplicados
        """
        try:
            # Hash de la contraseña para seguridad
            password_hash = get_password_hash(user_data.password)

            # Crear instancia del usuario
            new_user = User(
                role=user_data.role.value,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                email=user_data.email,
                phone=user_data.phone,
                password_hash=password_hash,
            )

            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)

            return new_user

        except IntegrityError as e:
            await db.rollback()
            error_message = str(e.orig).lower()

            if "email" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El email ya está registrado",
                )
            elif "phone" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El número de teléfono ya está registrado",
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Error al registrar usuario",
                )
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error interno del servidor: {str(e)}",
            )

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        """
        Obtener usuario por ID.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario a buscar

        Returns:
            User o None si no se encuentra
        """
        try:
            result = await db.execute(
                select(User).where(User.id == user_id, User.is_active)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error obteniendo usuario: {str(e)}",
            )

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """
        Obtener usuario por email.

        Args:
            db: Sesión de base de datos
            email: Email del usuario a buscar

        Returns:
            User o None si no se encuentra
        """
        try:
            result = await db.execute(
                select(User).where(User.email == email, User.is_active)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error obteniendo usuario por email: {str(e)}",
            )

    @staticmethod
    async def update_user_status(
        db: AsyncSession, user_id: int, is_active: bool
    ) -> bool:
        """
        Activar o desactivar un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            is_active: Estado activo/inactivo

        Returns:
            bool: True si se actualizó correctamente
        """
        try:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()

            if user:
                user.is_active = is_active
                await db.commit()
                return True
            return False
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error actualizando estado del usuario: {str(e)}",
            )

    @staticmethod
    async def get_users_by_role(
        db: AsyncSession, role: UserRole, limit: int = 100
    ) -> List[User]:
        """
        Obtener usuarios filtrados por rol.

        Args:
            db: Sesión de base de datos
            role: Rol de usuario a filtrar
            limit: Máximo número de resultados

        Returns:
            List[User]: Lista de usuarios con el rol especificado
        """
        try:
            result = await db.execute(
                select(User).where(User.role == role.value, User.is_active).limit(limit)
            )
            return list(result.scalars().all())
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error obteniendo usuarios por rol: {str(e)}",
            )

    @staticmethod
    async def update_user_profile(
        db: AsyncSession, user_id: int, update_data: UserUpdate
    ) -> Optional[User]:
        """
        Actualizar perfil de usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario a actualizar
            update_data: Datos de actualización

        Returns:
            User: Usuario actualizado o None si no se encuentra
        """
        try:
            # Buscar el usuario
            result = await db.execute(
                select(User).where(User.id == user_id, User.is_active)
            )
            user = result.scalar_one_or_none()

            if not user:
                return None

            # Actualizar solo los campos proporcionados
            update_dict = update_data.model_dump(exclude_unset=True)
            for field, value in update_dict.items():
                if hasattr(user, field) and value is not None:
                    setattr(user, field, value)

            await db.commit()
            await db.refresh(user)
            return user

        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar usuario: {str(e)}",
            )

    @staticmethod
    async def change_user_password(
        db: AsyncSession, user_id: int, current_password: str, new_password: str
    ) -> bool:
        """
        Cambiar contraseña de usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            current_password: Contraseña actual
            new_password: Nueva contraseña

        Returns:
            bool: True si se cambió exitosamente

        Raises:
            HTTPException: Si la contraseña actual es incorrecta
        """
        try:
            # Buscar el usuario
            result = await db.execute(
                select(User).where(User.id == user_id, User.is_active)
            )
            user = result.scalar_one_or_none()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado",
                )

            # Verificar contraseña actual
            if not verify_password(current_password, user.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La contraseña actual es incorrecta",
                )

            # Actualizar contraseña
            user.password_hash = get_password_hash(new_password)
            await db.commit()
            return True

        except HTTPException:
            raise
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al cambiar contraseña: {str(e)}",
            )


# Instancia del controlador
user_controller = UserController()
