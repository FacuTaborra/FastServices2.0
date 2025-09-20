"""
Servicio para operaciones CRUD de proveedores de servicios.
Maneja la lógica de negocio relacionada con proveedores.
"""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from models.User import User, UserRole
from models.ProviderProfile import (
    ProviderProfile,
    ProviderRegisterRequest,
    ProviderResponse,
    ProviderProfileUpdate,
)
from database.database import AsyncSessionLocal
from auth.auth_utils import get_password_hash


class ProviderService:
    """Servicio para operaciones con proveedores."""

    @staticmethod
    async def create_provider(
        provider_data: ProviderRegisterRequest,
    ) -> ProviderResponse:
        """
        Crear un nuevo proveedor en el sistema.
        Crea tanto el usuario como el perfil de proveedor.

        Args:
            provider_data: Datos del proveedor a crear

        Returns:
            ProviderResponse: Proveedor creado con perfil completo

        Raises:
            HTTPException: Si hay errores de validación o duplicados
        """
        async with AsyncSessionLocal() as session:
            try:
                # Hash de la contraseña para seguridad
                password_hash = get_password_hash(provider_data.password)

                # Crear usuario con rol provider
                new_user = User(
                    role=UserRole.PROVIDER.value,
                    first_name=provider_data.first_name,
                    last_name=provider_data.last_name,
                    email=provider_data.email,
                    phone=provider_data.phone,
                    password_hash=password_hash,
                )

                session.add(new_user)
                await session.flush()  # Obtener el ID del usuario

                # Crear perfil de proveedor
                provider_profile = ProviderProfile(
                    user_id=new_user.id,
                    bio=provider_data.bio,
                    service_radius_km=provider_data.service_radius_km,
                )

                session.add(provider_profile)
                await session.commit()

                # Recargar con relaciones
                await session.refresh(new_user)
                await session.refresh(provider_profile)

                # Cargar el usuario con su perfil para la respuesta
                result = await session.execute(
                    select(User)
                    .options(selectinload(User.provider_profile))
                    .where(User.id == new_user.id)
                )
                created_user = result.scalar_one()

                # Crear la respuesta manualmente para evitar problemas de validación
                response_data = {
                    "id": created_user.id,
                    "first_name": created_user.first_name,
                    "last_name": created_user.last_name,
                    "email": created_user.email,
                    "phone": created_user.phone,
                    "role": created_user.role,
                    "is_active": created_user.is_active,
                    "created_at": created_user.created_at,
                    "provider_profile": {
                        "id": created_user.provider_profile.id,
                        "user_id": created_user.provider_profile.user_id,
                        "bio": created_user.provider_profile.bio,
                        "rating_avg": created_user.provider_profile.rating_avg,
                        "total_reviews": created_user.provider_profile.total_reviews,
                        "is_online": created_user.provider_profile.is_online,
                        "service_radius_km": created_user.provider_profile.service_radius_km,
                        "created_at": created_user.provider_profile.created_at,
                    },
                }

                return ProviderResponse(**response_data)

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
                        detail="Error al registrar proveedor",
                    )

    @staticmethod
    async def get_provider_by_id(provider_id: int) -> Optional[ProviderResponse]:
        """
        Obtener proveedor por ID con perfil completo.

        Args:
            provider_id: ID del usuario proveedor

        Returns:
            ProviderResponse o None si no se encuentra
        """
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User)
                .options(selectinload(User.provider_profile))
                .where(
                    User.id == provider_id,
                    User.role == UserRole.PROVIDER.value,
                    User.is_active,
                )
            )
            user = result.scalar_one_or_none()

            if user and user.provider_profile:
                # Crear la respuesta manualmente
                response_data = {
                    "id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role,
                    "is_active": user.is_active,
                    "created_at": user.created_at,
                    "provider_profile": {
                        "id": user.provider_profile.id,
                        "user_id": user.provider_profile.user_id,
                        "bio": user.provider_profile.bio,
                        "rating_avg": user.provider_profile.rating_avg,
                        "total_reviews": user.provider_profile.total_reviews,
                        "is_online": user.provider_profile.is_online,
                        "service_radius_km": user.provider_profile.service_radius_km,
                        "created_at": user.provider_profile.created_at,
                    },
                }
                return ProviderResponse(**response_data)
            return None

    @staticmethod
    async def get_provider_by_email(email: str) -> Optional[User]:
        """
        Obtener proveedor por email.

        Args:
            email: Email del proveedor a buscar

        Returns:
            User o None si no se encuentra
        """
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User)
                .options(selectinload(User.provider_profile))
                .where(
                    User.email == email,
                    User.role == UserRole.PROVIDER.value,
                    User.is_active,
                )
            )
            return result.scalar_one_or_none()

    @staticmethod
    async def update_provider_profile(
        provider_id: int, profile_data: ProviderProfileUpdate
    ) -> Optional[ProviderResponse]:
        """
        Actualizar perfil de proveedor.

        Args:
            provider_id: ID del usuario proveedor
            profile_data: Datos a actualizar

        Returns:
            ProviderResponse actualizado o None si no se encuentra
        """
        async with AsyncSessionLocal() as session:
            # Buscar el proveedor y su perfil
            result = await session.execute(
                select(User)
                .options(selectinload(User.provider_profile))
                .where(
                    User.id == provider_id,
                    User.role == UserRole.PROVIDER.value,
                    User.is_active,
                )
            )
            user = result.scalar_one_or_none()

            if not user or not user.provider_profile:
                return None

            # Actualizar campos del perfil
            profile = user.provider_profile
            update_data = profile_data.model_dump(exclude_unset=True)

            for field, value in update_data.items():
                setattr(profile, field, value)

            await session.commit()
            await session.refresh(user)

            # Crear la respuesta manualmente
            response_data = {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "provider_profile": {
                    "id": user.provider_profile.id,
                    "user_id": user.provider_profile.user_id,
                    "bio": user.provider_profile.bio,
                    "rating_avg": user.provider_profile.rating_avg,
                    "total_reviews": user.provider_profile.total_reviews,
                    "is_online": user.provider_profile.is_online,
                    "service_radius_km": user.provider_profile.service_radius_km,
                    "created_at": user.provider_profile.created_at,
                },
            }
            return ProviderResponse(**response_data)

    @staticmethod
    async def toggle_provider_online_status(provider_id: int) -> Optional[bool]:
        """
        Cambiar el estado en línea del proveedor.

        Args:
            provider_id: ID del usuario proveedor

        Returns:
            bool: Nuevo estado o None si no se encuentra
        """
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(ProviderProfile).where(ProviderProfile.user_id == provider_id)
            )
            profile = result.scalar_one_or_none()

            if profile:
                profile.is_online = not profile.is_online
                await session.commit()
                return profile.is_online
            return None

    @staticmethod
    async def get_providers_by_radius(
        latitude: float, longitude: float, max_distance_km: int = 20, limit: int = 50
    ) -> list[ProviderResponse]:
        """
        Obtener proveedores disponibles en un radio específico.

        Args:
            latitude: Latitud del punto de búsqueda
            longitude: Longitud del punto de búsqueda
            max_distance_km: Distancia máxima en kilómetros
            limit: Máximo número de resultados

        Returns:
            list[ProviderResponse]: Lista de proveedores disponibles
        """
        async with AsyncSessionLocal() as session:
            # Por ahora retornamos proveedores activos y en línea
            # En producción se implementaría cálculo de distancia geográfica
            result = await session.execute(
                select(User)
                .options(selectinload(User.provider_profile))
                .join(ProviderProfile)
                .where(
                    User.role == UserRole.PROVIDER.value,
                    User.is_active,
                    ProviderProfile.is_online,
                    ProviderProfile.service_radius_km >= max_distance_km,
                )
                .limit(limit)
            )
            users = result.scalars().all()

            # Crear respuestas manualmente para cada usuario
            providers = []
            for user in users:
                if user.provider_profile:
                    response_data = {
                        "id": user.id,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "email": user.email,
                        "phone": user.phone,
                        "role": user.role,
                        "is_active": user.is_active,
                        "created_at": user.created_at,
                        "provider_profile": {
                            "id": user.provider_profile.id,
                            "user_id": user.provider_profile.user_id,
                            "bio": user.provider_profile.bio,
                            "rating_avg": user.provider_profile.rating_avg,
                            "total_reviews": user.provider_profile.total_reviews,
                            "is_online": user.provider_profile.is_online,
                            "service_radius_km": user.provider_profile.service_radius_km,
                            "created_at": user.provider_profile.created_at,
                        },
                    }
                    providers.append(ProviderResponse(**response_data))

            return providers


# Instancia singleton del servicio
provider_service = ProviderService()
