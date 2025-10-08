"""
Controlador de Proveedores para FastServices.
Contiene la logica de negocio para operaciones CRUD de proveedores.
"""

from typing import Optional
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
    ProviderProfileResponse,
    ProviderLicenseResponse,
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
            db: Sesion de base de datos
            provider_data: Datos del proveedor a crear

        Returns:
            ProviderResponse: Proveedor creado con perfil completo

        Raises:
            HTTPException: Si hay errores de validacion o duplicados
        """
        try:
            password_hash = get_password_hash(provider_data.password)

            new_user = User(
                role="provider",
                first_name=provider_data.first_name,
                last_name=provider_data.last_name,
                email=provider_data.email,
                phone=provider_data.phone,
                date_of_birth=provider_data.date_of_birth,
                password_hash=password_hash,
            )

            db.add(new_user)
            await db.flush()

            provider_profile = ProviderProfile(
                user_id=new_user.id,
                bio=provider_data.bio or "Proveedor de servicios profesional",
                rating_avg=0.0,
                total_reviews=0,
            )

            db.add(provider_profile)
            await db.commit()

            # Recargar usuario con relaciones para evitar accesos lazy en contexto async
            result = await db.execute(
                select(User)
                .options(
                    selectinload(User.provider_profile).selectinload(
                        ProviderProfile.licenses
                    )
                )
                .where(User.id == new_user.id)
            )
            user_with_profile = result.scalar_one()

            return await ProviderController._build_provider_response(user_with_profile)

        except IntegrityError as e:
            await db.rollback()
            error_message = str(e.orig).lower()

            if "email" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El email ya esta registrado",
                )
            if "phone" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El numero de telefono ya esta registrado",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error al registrar proveedor",
            )
        except Exception as e:  # noqa: BLE001
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error interno del servidor: {str(e)}",
            )

    @staticmethod
    async def _build_provider_response(user: User) -> ProviderResponse:
        """Construye la respuesta Pydantic con el perfil del proveedor."""
        profile = getattr(user, "provider_profile", None)
        if profile is None and hasattr(user, "awaitable_attrs"):
            profile = await user.awaitable_attrs.provider_profile

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil de proveedor no encontrado",
            )

        licenses_data = getattr(profile, "licenses", None)
        if licenses_data is None and hasattr(profile, "awaitable_attrs"):
            licenses_data = await profile.awaitable_attrs.licenses

        if licenses_data is None:
            licenses_data = []

        licenses = [
            ProviderLicenseResponse(
                id=license.id,
                provider_profile_id=license.provider_profile_id,
                license_number=license.license_number,
                license_type=license.license_type,
                issued_by=license.issued_by,
                issued_at=license.issued_at,
                expires_at=license.expires_at,
                created_at=license.created_at,
                updated_at=license.updated_at,
            )
            for license in licenses_data
        ]

        profile_response = ProviderProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            bio=profile.bio,
            rating_avg=profile.rating_avg,
            total_reviews=profile.total_reviews,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
            licenses=licenses,
        )

        return ProviderResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            phone=user.phone,
            date_of_birth=user.date_of_birth,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            profile_image_url=getattr(user, "profile_image_url", None),
            profile_image_s3_key=getattr(user, "profile_image_s3_key", None),
            profile_image_uploaded_at=getattr(
                user, "profile_image_uploaded_at", None
            ),
            provider_profile=profile_response,
        )

    @staticmethod
    async def get_provider_by_id(
        db: AsyncSession, provider_id: int
    ) -> Optional[ProviderResponse]:
        """Obtener proveedor por ID con perfil completo."""
        try:
            result = await db.execute(
                select(User)
                .options(selectinload(User.provider_profile).selectinload(ProviderProfile.licenses))
                .where(User.id == provider_id, User.role == "provider", User.is_active)
            )
            user = result.scalar_one_or_none()

            if not user or not user.provider_profile:
                return None

            return await ProviderController._build_provider_response(user)

        except Exception as e:  # noqa: BLE001
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error obteniendo proveedor: {str(e)}",
            )

    @staticmethod
    async def update_provider_profile(
        db: AsyncSession, user_id: int, profile_data: ProviderProfileUpdate
    ) -> Optional[ProviderResponse]:
        """Actualizar perfil de proveedor."""
        try:
            result = await db.execute(
                select(User)
                .options(selectinload(User.provider_profile).selectinload(ProviderProfile.licenses))
                .where(User.id == user_id, User.role == "provider", User.is_active)
            )
            user = result.scalar_one_or_none()

            if not user or not user.provider_profile:
                return None

            profile = user.provider_profile

            if profile_data.bio is not None:
                profile.bio = profile_data.bio

            await db.commit()
            await db.refresh(profile)
            await db.refresh(user)

            return await ProviderController._build_provider_response(user)

        except Exception as e:  # noqa: BLE001
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error actualizando perfil de proveedor: {str(e)}",
            )


# Instancia del controlador
provider_controller = ProviderController()
