"""
Controlador de Proveedores para FastServices.
Contiene la lógica de negocio para operaciones CRUD de proveedores.
"""

from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from models.User import User
from models.ProviderProfile import (
    ProviderProfile,
    ProviderRegisterRequest,
    ProviderProfileUpdate,
    ProviderResponse,
)
from auth.auth_utils import get_password_hash


class ProviderController:
    """Controlador para operaciones con proveedores."""

    @staticmethod
    async def create_provider(
        db: AsyncSession, provider_data: ProviderRegisterRequest
    ) -> ProviderResponse:
        """
        Crear un nuevo proveedor con perfil completo.

        Args:
            db: Sesión de base de datos
            provider_data: Datos del proveedor a crear

        Returns:
            ProviderResponse: Proveedor creado con perfil completo

        Raises:
            HTTPException: Si hay errores de validación o duplicados
        """
        try:
            # Hash de la contraseña
            password_hash = get_password_hash(provider_data.password)

            # Crear usuario con rol de proveedor
            new_user = User(
                role="provider",
                first_name=provider_data.first_name,
                last_name=provider_data.last_name,
                email=provider_data.email,
                phone=provider_data.phone,
                password_hash=password_hash,
            )

            db.add(new_user)
            await db.flush()  # Para obtener el ID sin hacer commit

            # Crear perfil de proveedor
            provider_profile = ProviderProfile(
                user_id=new_user.id,
                bio=provider_data.bio or "Proveedor de servicios profesional",
                service_radius_km=provider_data.service_radius_km or 10,
                is_online=False,
                rating_avg=0.0,
                rating_count=0,
                total_jobs=0,
                total_earnings=0.0,
            )

            db.add(provider_profile)
            await db.commit()

            # Refrescar para obtener datos actualizados
            await db.refresh(new_user)
            await db.refresh(provider_profile)

            # Construir respuesta manual para evitar problemas de serialización
            return ProviderResponse(
                id=new_user.id,
                first_name=new_user.first_name,
                last_name=new_user.last_name,
                email=new_user.email,
                phone=new_user.phone,
                is_active=new_user.is_active,
                created_at=new_user.created_at,
                updated_at=new_user.updated_at,
                bio=provider_profile.bio,
                service_radius_km=provider_profile.service_radius_km,
                is_online=provider_profile.is_online,
                rating_avg=provider_profile.rating_avg,
                rating_count=provider_profile.rating_count,
                total_jobs=provider_profile.total_jobs,
                total_earnings=provider_profile.total_earnings,
            )

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
                    detail="Error al registrar proveedor",
                )
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error interno del servidor: {str(e)}",
            )

    @staticmethod
    async def get_provider_by_id(
        db: AsyncSession, provider_id: int
    ) -> Optional[ProviderResponse]:
        """
        Obtener proveedor por ID con perfil completo.

        Args:
            db: Sesión de base de datos
            provider_id: ID del proveedor

        Returns:
            ProviderResponse o None si no se encuentra
        """
        try:
            result = await db.execute(
                select(User)
                .options(selectinload(User.provider_profile))
                .where(User.id == provider_id, User.role == "provider", User.is_active)
            )
            user = result.scalar_one_or_none()

            if not user or not user.provider_profile:
                return None

            profile = user.provider_profile

            # Construir respuesta manual
            return ProviderResponse(
                id=user.id,
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                phone=user.phone,
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at,
                bio=profile.bio,
                service_radius_km=profile.service_radius_km,
                is_online=profile.is_online,
                rating_avg=profile.rating_avg,
                rating_count=profile.rating_count,
                total_jobs=profile.total_jobs,
                total_earnings=profile.total_earnings,
            )

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error obteniendo proveedor: {str(e)}",
            )

    @staticmethod
    async def update_provider_profile(
        db: AsyncSession, user_id: int, profile_data: ProviderProfileUpdate
    ) -> Optional[ProviderResponse]:
        """
        Actualizar perfil de proveedor.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario proveedor
            profile_data: Datos de actualización

        Returns:
            ProviderResponse: Proveedor actualizado o None si no se encuentra
        """
        try:
            # Buscar el usuario y su perfil
            result = await db.execute(
                select(User)
                .options(selectinload(User.provider_profile))
                .where(User.id == user_id, User.role == "provider", User.is_active)
            )
            user = result.scalar_one_or_none()

            if not user or not user.provider_profile:
                return None

            profile = user.provider_profile

            # Actualizar campos proporcionados
            update_dict = profile_data.model_dump(exclude_unset=True)
            for field, value in update_dict.items():
                if hasattr(profile, field) and value is not None:
                    setattr(profile, field, value)

            await db.commit()
            await db.refresh(user)
            await db.refresh(profile)

            # Construir respuesta
            return ProviderResponse(
                id=user.id,
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                phone=user.phone,
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at,
                bio=profile.bio,
                service_radius_km=profile.service_radius_km,
                is_online=profile.is_online,
                rating_avg=profile.rating_avg,
                rating_count=profile.rating_count,
                total_jobs=profile.total_jobs,
                total_earnings=profile.total_earnings,
            )

        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error actualizando perfil de proveedor: {str(e)}",
            )

    @staticmethod
    async def toggle_provider_online_status(
        db: AsyncSession, user_id: int
    ) -> Optional[bool]:
        """
        Cambiar estado en línea del proveedor.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario proveedor

        Returns:
            bool: Nuevo estado en línea o None si no se encuentra
        """
        try:
            result = await db.execute(
                select(ProviderProfile).where(ProviderProfile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()

            if not profile:
                return None

            # Alternar estado
            profile.is_online = not profile.is_online
            await db.commit()

            return profile.is_online

        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error cambiando estado en línea: {str(e)}",
            )

    @staticmethod
    async def get_providers_by_radius(
        db: AsyncSession,
        latitude: float,
        longitude: float,
        max_distance_km: int = 20,
        limit: int = 50,
    ) -> List[ProviderResponse]:
        """
        Buscar proveedores disponibles en un área específica.
        Por ahora retorna proveedores en línea sin filtro geográfico.

        Args:
            db: Sesión de base de datos
            latitude: Latitud del punto de búsqueda
            longitude: Longitud del punto de búsqueda
            max_distance_km: Radio de búsqueda en kilómetros
            limit: Máximo número de resultados

        Returns:
            List[ProviderResponse]: Lista de proveedores disponibles
        """
        try:
            # Por ahora, simplemente buscar proveedores en línea
            # TODO: Implementar búsqueda geográfica real
            result = await db.execute(
                select(User)
                .options(selectinload(User.provider_profile))
                .join(ProviderProfile)
                .where(
                    User.role == "provider", User.is_active, ProviderProfile.is_online
                )
                .limit(limit)
            )
            users = result.scalars().all()

            providers = []
            for user in users:
                if user.provider_profile:
                    profile = user.provider_profile
                    providers.append(
                        ProviderResponse(
                            id=user.id,
                            first_name=user.first_name,
                            last_name=user.last_name,
                            email=user.email,
                            phone=user.phone,
                            is_active=user.is_active,
                            created_at=user.created_at,
                            updated_at=user.updated_at,
                            bio=profile.bio,
                            service_radius_km=profile.service_radius_km,
                            is_online=profile.is_online,
                            rating_avg=profile.rating_avg,
                            rating_count=profile.rating_count,
                            total_jobs=profile.total_jobs,
                            total_earnings=profile.total_earnings,
                        )
                    )

            return providers

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error buscando proveedores: {str(e)}",
            )


# Instancia del controlador
provider_controller = ProviderController()
