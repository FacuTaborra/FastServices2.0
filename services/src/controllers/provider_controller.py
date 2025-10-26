import logging
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from models.User import User, UserRole
from models.ProviderProfile import (
    ProviderProfile,
    ProviderLicense,
    ProviderRegisterRequest,
    ProviderProfileUpdate,
    ProviderResponse,
    ProviderProfileResponse,
    ProviderLicenseResponse,
    ProviderLicenseCreate,
)
from auth.auth_utils import get_password_hash
from utils.error_handler import error_handler

logger = logging.getLogger(__name__)


class ProviderController:
    @staticmethod
    @error_handler(logger)
    async def create_provider(
        db: AsyncSession, provider_data: ProviderRegisterRequest
    ) -> ProviderResponse:
        password_hash = get_password_hash(provider_data.password)

        new_user = User(
            role=UserRole.PROVIDER,
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

    @staticmethod
    async def _ensure_provider_profile(
        db: AsyncSession, user_id: int
    ) -> ProviderProfile:
        """Garantiza que exista un perfil de proveedor para el usuario dado."""

        result = await db.execute(
            select(ProviderProfile).where(ProviderProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if profile:
            return profile

        profile = ProviderProfile(
            user_id=user_id,
            bio="Proveedor de servicios profesional",
            rating_avg=0.0,
            total_reviews=0,
        )

        db.add(profile)
        await db.commit()
        await db.refresh(profile)

        return profile

    @staticmethod
    async def _load_provider_with_relations(
        db: AsyncSession, user_id: int
    ) -> Optional[User]:
        result = await db.execute(
            select(User)
            .options(
                selectinload(User.provider_profile)
                .selectinload(ProviderProfile.licenses)
                .selectinload(ProviderLicense.tag_links)
            )
            .where(
                User.id == user_id,
                User.role == UserRole.PROVIDER,
                User.is_active,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    @error_handler(logger)
    async def add_provider_licenses(
        db: AsyncSession, user_id: int, licenses_data: List[ProviderLicenseCreate]
    ) -> List[ProviderLicenseResponse]:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado"
            )

        profile = getattr(user, "provider_profile", None)
        if not profile:
            profile = await ProviderController._ensure_provider_profile(db, user_id)

        if not licenses_data:
            return [
                ProviderLicenseResponse(
                    id=license.id,
                    provider_profile_id=license.provider_profile_id,
                    title=license.title,
                    description=license.description,
                    license_number=license.license_number,
                    issued_by=license.issued_by,
                    issued_at=license.issued_at,
                    expires_at=license.expires_at,
                    document_s3_key=license.document_s3_key,
                    document_url=license.document_url,
                    created_at=license.created_at,
                    updated_at=license.updated_at,
                )
                for license in profile.licenses
            ]

        new_licenses = []

        for item in licenses_data:
            license_model = ProviderLicense(
                provider_profile_id=profile.id,
                title=item.title,
                description=item.description,
                license_number=item.license_number,
                issued_by=item.issued_by,
                issued_at=item.issued_at,
                expires_at=item.expires_at,
                document_s3_key=item.document_s3_key,
                document_url=item.document_url,
            )
            db.add(license_model)
            new_licenses.append(license_model)

        await db.commit()

        for license_model in new_licenses:
            await db.refresh(license_model)

        user = await ProviderController._load_provider_with_relations(db, user_id)
        profile = getattr(user, "provider_profile", None)

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil de proveedor no encontrado",
            )

        return [
            ProviderLicenseResponse(
                id=license.id,
                provider_profile_id=license.provider_profile_id,
                title=license.title,
                description=license.description,
                license_number=license.license_number,
                issued_by=license.issued_by,
                issued_at=license.issued_at,
                expires_at=license.expires_at,
                document_s3_key=license.document_s3_key,
                document_url=license.document_url,
                created_at=license.created_at,
                updated_at=license.updated_at,
            )
            for license in profile.licenses
        ]

    @staticmethod
    async def _build_provider_response(user: User) -> ProviderResponse:
        """Construye la respuesta Pydantic con el perfil del proveedor."""
        profile = getattr(user, "provider_profile", None)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil de proveedor no encontrado",
            )

        licenses_data = getattr(profile, "licenses", []) or []

        licenses = [
            ProviderLicenseResponse(
                id=license.id,
                provider_profile_id=license.provider_profile_id,
                title=license.title,
                description=license.description,
                license_number=license.license_number,
                issued_by=license.issued_by,
                issued_at=license.issued_at,
                expires_at=license.expires_at,
                document_s3_key=license.document_s3_key,
                document_url=license.document_url,
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
            role=getattr(user.role, "value", user.role),
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            profile_image_url=getattr(user, "profile_image_url", None),
            profile_image_s3_key=getattr(user, "profile_image_s3_key", None),
            profile_image_uploaded_at=getattr(user, "profile_image_uploaded_at", None),
            provider_profile=profile_response,
        )

    @staticmethod
    @error_handler(logger)
    async def get_provider_by_id(
        db: AsyncSession, provider_id: int
    ) -> Optional[ProviderResponse]:
        user = await ProviderController._load_provider_with_relations(db, provider_id)

        if not user:
            return None

        if not getattr(user, "provider_profile", None):
            await ProviderController._ensure_provider_profile(db, user.id)
            user = await ProviderController._load_provider_with_relations(
                db, provider_id
            )
            if not user:
                return None

        return await ProviderController._build_provider_response(user)

    @staticmethod
    @error_handler(logger)
    async def update_provider_profile(
        db: AsyncSession, user_id: int, profile_data: ProviderProfileUpdate
    ) -> Optional[ProviderResponse]:
        user = await ProviderController._load_provider_with_relations(db, user_id)

        if not user:
            return None

        profile = getattr(user, "provider_profile", None)
        if not profile:
            await ProviderController._ensure_provider_profile(db, user.id)
            user = await ProviderController._load_provider_with_relations(db, user_id)
            if not user:
                return None
            profile = user.provider_profile

        if profile_data.bio is not None:
            profile.bio = profile_data.bio

        await db.commit()
        # Re-cargar usuario con relaciones para retornar información consistente
        user = await ProviderController._load_provider_with_relations(db, user_id)
        if not user:
            return None

        return await ProviderController._build_provider_response(user)


provider_controller = ProviderController()
