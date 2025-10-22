from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status
from models.Address import Address, AddressCreate, AddressUpdate, AddressResponse
from models.User import User
from utils.error_handler import error_handler


class AddressController:
    @staticmethod
    @error_handler()
    async def create_address(
        db: AsyncSession, user_id: int, address_data: AddressCreate
    ) -> AddressResponse:
        user_query = select(User).where(User.id == user_id, User.is_active)
        result = await db.execute(user_query)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        if address_data.is_default:
            await AddressController._unset_default_addresses(db, user_id)

        new_address = Address(user_id=user_id, **address_data.model_dump())

        db.add(new_address)
        await db.commit()
        await db.refresh(new_address)

        return AddressResponse.model_validate(new_address)

    @staticmethod
    @error_handler()
    async def get_user_addresses(
        db: AsyncSession, user_id: int, include_inactive: bool = False
    ) -> List[AddressResponse]:
        query = select(Address).where(Address.user_id == user_id)

        if not include_inactive:
            query = query.where(Address.is_active)

        query = query.order_by(Address.is_default.desc(), Address.created_at.asc())

        result = await db.execute(query)
        addresses = result.scalars().all()

        return [AddressResponse.model_validate(addr) for addr in addresses]

    @staticmethod
    @error_handler()
    async def get_address_by_id(
        db: AsyncSession, user_id: int, address_id: int
    ) -> AddressResponse:
        query = select(Address).where(
            Address.id == address_id, Address.user_id == user_id, Address.is_active
        )

        result = await db.execute(query)
        address = result.scalar_one_or_none()

        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dirección no encontrada",
            )

        return AddressResponse.model_validate(address)

    @staticmethod
    @error_handler()
    async def update_address(
        db: AsyncSession, user_id: int, address_id: int, address_data: AddressUpdate
    ) -> AddressResponse:
        query = select(Address).where(
            Address.id == address_id, Address.user_id == user_id, Address.is_active
        )

        result = await db.execute(query)
        address = result.scalar_one_or_none()

        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dirección no encontrada",
            )

        update_data = address_data.model_dump(exclude_unset=True)

        if update_data.get("is_default"):
            await AddressController._unset_default_addresses(db, user_id)

        if update_data:
            update_query = (
                update(Address).where(Address.id == address_id).values(**update_data)
            )
            await db.execute(update_query)
            await db.commit()

            await db.refresh(address)

        return AddressResponse.model_validate(address)

    @staticmethod
    @error_handler()
    async def delete_address(db: AsyncSession, user_id: int, address_id: int) -> bool:
        query = select(Address).where(
            Address.id == address_id, Address.user_id == user_id, Address.is_active
        )

        result = await db.execute(query)
        address = result.scalar_one_or_none()

        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dirección no encontrada",
            )

        update_query = (
            update(Address)
            .where(Address.id == address_id)
            .values(is_active=False, is_default=False)
        )

        await db.execute(update_query)
        await db.commit()

        return True

    @staticmethod
    @error_handler()
    async def set_default_address(
        db: AsyncSession, user_id: int, address_id: int
    ) -> AddressResponse:
        query = select(Address).where(
            Address.id == address_id, Address.user_id == user_id, Address.is_active
        )

        result = await db.execute(query)
        address = result.scalar_one_or_none()

        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dirección no encontrada",
            )

        if address.is_default:
            return AddressResponse.model_validate(address)

        await AddressController._unset_default_addresses(db, user_id)

        update_query = (
            update(Address).where(Address.id == address_id).values(is_default=True)
        )

        await db.execute(update_query)
        await db.commit()
        await db.refresh(address)

        return AddressResponse.model_validate(address)

    @staticmethod
    @error_handler()
    async def get_default_address(
        db: AsyncSession, user_id: int
    ) -> Optional[AddressResponse]:
        query = select(Address).where(
            Address.user_id == user_id, Address.is_default, Address.is_active
        )

        result = await db.execute(query)
        address = result.scalar_one_or_none()

        if address:
            return AddressResponse.model_validate(address)

        return None

    @staticmethod
    async def _unset_default_addresses(db: AsyncSession, user_id: int) -> None:
        """
        Desmarca todas las direcciones de un usuario como predeterminadas.
        Método interno auxiliar.
        """
        update_query = (
            update(Address)
            .where(Address.user_id == user_id, Address.is_active)
            .values(is_default=False)
        )
        await db.execute(update_query)
