"""
Controlador de Direcciones para FastServices.
Contiene la lógica de negocio para gestionar direcciones de usuarios.
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status
from models.Address import Address, AddressCreate, AddressUpdate, AddressResponse
from models.User import User


class AddressController:
    """Controlador para operaciones CRUD de direcciones."""

    @staticmethod
    async def create_address(
        db: AsyncSession, user_id: int, address_data: AddressCreate
    ) -> AddressResponse:
        """
        Crea una nueva dirección para un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            address_data: Datos de la dirección a crear

        Returns:
            AddressResponse: La dirección creada

        Raises:
            HTTPException: Si hay errores en la validación o creación
        """
        try:
            # Verificar que el usuario existe
            user_query = select(User).where(User.id == user_id, User.is_active)
            result = await db.execute(user_query)
            user = result.scalar_one_or_none()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado",
                )

            # Si esta dirección se marca como default, desmarcar las otras
            if address_data.is_default:
                await AddressController._unset_default_addresses(db, user_id)

            # Crear la nueva dirección
            new_address = Address(user_id=user_id, **address_data.model_dump())

            db.add(new_address)
            await db.commit()
            await db.refresh(new_address)

            return AddressResponse.model_validate(new_address)

        except HTTPException:
            raise
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creando dirección: {str(e)}",
            )

    @staticmethod
    async def get_user_addresses(
        db: AsyncSession, user_id: int, include_inactive: bool = False
    ) -> List[AddressResponse]:
        """
        Obtiene todas las direcciones de un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            include_inactive: Si incluir direcciones inactivas

        Returns:
            List[AddressResponse]: Lista de direcciones del usuario
        """
        try:
            query = select(Address).where(Address.user_id == user_id)

            if not include_inactive:
                query = query.where(Address.is_active)

            query = query.order_by(Address.is_default.desc(), Address.created_at.asc())

            result = await db.execute(query)
            addresses = result.scalars().all()

            return [AddressResponse.model_validate(addr) for addr in addresses]

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error obteniendo direcciones: {str(e)}",
            )

    @staticmethod
    async def get_address_by_id(
        db: AsyncSession, user_id: int, address_id: int
    ) -> AddressResponse:
        """
        Obtiene una dirección específica de un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            address_id: ID de la dirección

        Returns:
            AddressResponse: La dirección solicitada

        Raises:
            HTTPException: Si la dirección no existe o no pertenece al usuario
        """
        try:
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

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error obteniendo dirección: {str(e)}",
            )

    @staticmethod
    async def update_address(
        db: AsyncSession, user_id: int, address_id: int, address_data: AddressUpdate
    ) -> AddressResponse:
        """
        Actualiza una dirección de un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            address_id: ID de la dirección
            address_data: Datos de actualización

        Returns:
            AddressResponse: La dirección actualizada

        Raises:
            HTTPException: Si la dirección no existe o no pertenece al usuario
        """
        try:
            # Verificar que la dirección existe y pertenece al usuario
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

            # Si se marca como default, desmarcar las otras
            if address_data.is_default:
                await AddressController._unset_default_addresses(db, user_id)

            # Actualizar los campos proporcionados
            update_data = address_data.model_dump(exclude_unset=True)

            if update_data:
                update_query = (
                    update(Address)
                    .where(Address.id == address_id)
                    .values(**update_data)
                )
                await db.execute(update_query)
                await db.commit()

                # Refrescar el objeto
                await db.refresh(address)

            return AddressResponse.model_validate(address)

        except HTTPException:
            raise
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error actualizando dirección: {str(e)}",
            )

    @staticmethod
    async def delete_address(db: AsyncSession, user_id: int, address_id: int) -> bool:
        """
        Elimina (marca como inactiva) una dirección de un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            address_id: ID de la dirección

        Returns:
            bool: True si se eliminó correctamente

        Raises:
            HTTPException: Si la dirección no existe o no pertenece al usuario
        """
        try:
            # Verificar que la dirección existe y pertenece al usuario
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

            # Marcar como inactiva en lugar de eliminar
            update_query = (
                update(Address)
                .where(Address.id == address_id)
                .values(is_active=False, is_default=False)
            )

            await db.execute(update_query)
            await db.commit()

            return True

        except HTTPException:
            raise
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error eliminando dirección: {str(e)}",
            )

    @staticmethod
    async def set_default_address(
        db: AsyncSession, user_id: int, address_id: int
    ) -> AddressResponse:
        """
        Establece una dirección como la predeterminada para un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            address_id: ID de la dirección

        Returns:
            AddressResponse: La dirección marcada como predeterminada
        """
        try:
            # Verificar que la dirección existe y pertenece al usuario
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

            # Desmarcar todas las direcciones como default
            await AddressController._unset_default_addresses(db, user_id)

            # Marcar esta dirección como default
            update_query = (
                update(Address).where(Address.id == address_id).values(is_default=True)
            )

            await db.execute(update_query)
            await db.commit()
            await db.refresh(address)

            return AddressResponse.model_validate(address)

        except HTTPException:
            raise
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error estableciendo dirección predeterminada: {str(e)}",
            )

    @staticmethod
    async def get_default_address(
        db: AsyncSession, user_id: int
    ) -> Optional[AddressResponse]:
        """
        Obtiene la dirección predeterminada de un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario

        Returns:
            Optional[AddressResponse]: La dirección predeterminada o None
        """
        try:
            query = select(Address).where(
                Address.user_id == user_id, Address.is_default, Address.is_active
            )

            result = await db.execute(query)
            address = result.scalar_one_or_none()

            if address:
                return AddressResponse.model_validate(address)

            return None

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error obteniendo dirección predeterminada: {str(e)}",
            )

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
