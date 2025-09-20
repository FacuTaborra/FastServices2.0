"""
Servicio para operaciones CRUD de usuarios.
Maneja la lógica de negocio relacionada con usuarios.
"""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from models.User import User, UserCreate, UserRole
from database.database import AsyncSessionLocal
from auth.auth_utils import get_password_hash


class UserService:
    """Servicio para operaciones con usuarios."""

    @staticmethod
    async def create_user(user_data: UserCreate) -> User:
        """
        Crear un nuevo usuario en el sistema.

        Args:
            user_data: Datos del usuario a crear

        Returns:
            User: Usuario creado con todos los campos poblados

        Raises:
            HTTPException: Si hay errores de validación o duplicados
        """
        try:
            async with AsyncSessionLocal() as session:
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

                session.add(new_user)
                await session.commit()
                await session.refresh(new_user)

                return new_user

        except IntegrityError as e:
            await session.rollback()
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

    @staticmethod
    async def get_user_by_id(user_id: int) -> Optional[User]:
        """
        Obtener usuario por ID.

        Args:
            user_id: ID del usuario a buscar

        Returns:
            User o None si no se encuentra
        """
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.id == user_id, User.is_active)
            )
            return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_email(email: str) -> Optional[User]:
        """
        Obtener usuario por email.

        Args:
            email: Email del usuario a buscar

        Returns:
            User o None si no se encuentra
        """
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.email == email, User.is_active)
            )
            return result.scalar_one_or_none()

    @staticmethod
    async def update_user_status(user_id: int, is_active: bool) -> bool:
        """
        Activar o desactivar un usuario.

        Args:
            user_id: ID del usuario
            is_active: Estado activo/inactivo

        Returns:
            bool: True si se actualizó correctamente
        """
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()

            if user:
                user.is_active = is_active
                await session.commit()
                return True
            return False

    @staticmethod
    async def get_users_by_role(role: UserRole, limit: int = 100) -> list[User]:
        """
        Obtener usuarios filtrados por rol.

        Args:
            role: Rol de usuario a filtrar
            limit: Máximo número de resultados

        Returns:
            list[User]: Lista de usuarios con el rol especificado
        """
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.role == role.value, User.is_active).limit(limit)
            )
            return list(result.scalars().all())

    @staticmethod
    async def update_user_profile(user_id: int, update_data: dict) -> Optional[User]:
        """
        Actualizar perfil de usuario.

        Args:
            user_id: ID del usuario a actualizar
            update_data: Diccionario con los datos a actualizar

        Returns:
            User: Usuario actualizado o None si no se encuentra
        """
        try:
            async with AsyncSessionLocal() as session:
                # Buscar el usuario
                result = await session.execute(
                    select(User).where(User.id == user_id, User.is_active)
                )
                user = result.scalar_one_or_none()

                if not user:
                    return None

                # Actualizar solo los campos proporcionados
                for field, value in update_data.items():
                    if hasattr(user, field) and value is not None:
                        setattr(user, field, value)

                await session.commit()
                await session.refresh(user)
                return user

        except Exception as e:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar usuario: {str(e)}",
            )

    @staticmethod
    async def change_user_password(
        user_id: int, current_password: str, new_password: str
    ) -> bool:
        """
        Cambiar contraseña de usuario.

        Args:
            user_id: ID del usuario
            current_password: Contraseña actual
            new_password: Nueva contraseña

        Returns:
            bool: True si se cambió exitosamente

        Raises:
            HTTPException: Si la contraseña actual es incorrecta
        """
        try:
            async with AsyncSessionLocal() as session:
                # Buscar el usuario
                result = await session.execute(
                    select(User).where(User.id == user_id, User.is_active)
                )
                user = result.scalar_one_or_none()

                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Usuario no encontrado",
                    )

                # Verificar contraseña actual
                from auth.auth_utils import verify_password, get_password_hash

                if not verify_password(current_password, user.password_hash):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="La contraseña actual es incorrecta",
                    )

                # Actualizar contraseña
                user.password_hash = get_password_hash(new_password)
                await session.commit()
                return True

        except HTTPException:
            raise
        except Exception as e:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al cambiar contraseña: {str(e)}",
            )


# Instancia singleton del servicio
user_service = UserService()
