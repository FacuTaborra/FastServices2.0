from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.database import get_db
from auth.auth_utils import get_current_user
from models.User import User
from models.Address import (
    AddressCreate,
    AddressUpdate,
    AddressResponse,
    AddressListResponse,
)
from controllers.address_controller import AddressController

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.post("/", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    address_data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AddressResponse:
    return await AddressController.create_address(db, current_user.id, address_data)


@router.get("/", response_model=List[AddressResponse])
async def get_my_addresses(
    include_inactive: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[AddressResponse]:
    return await AddressController.get_user_addresses(
        db, current_user.id, include_inactive
    )


@router.get("/me", response_model=AddressListResponse)
async def get_addresses_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AddressListResponse:
    addresses = await AddressController.get_user_addresses(db, current_user.id, False)
    default_address = await AddressController.get_default_address(db, current_user.id)

    return AddressListResponse(
        addresses=addresses, total=len(addresses), default_address=default_address
    )


@router.get("/default", response_model=AddressResponse)
async def get_default_address(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AddressResponse:
    default_address = await AddressController.get_default_address(db, current_user.id)

    if not default_address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay dirección predeterminada configurada",
        )

    return default_address


@router.get("/{address_id}", response_model=AddressResponse)
async def get_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AddressResponse:
    return await AddressController.get_address_by_id(db, current_user.id, address_id)


@router.put("/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: int,
    address_data: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AddressResponse:
    return await AddressController.update_address(
        db, current_user.id, address_id, address_data
    )


@router.patch("/{address_id}/set-default", response_model=AddressResponse)
async def set_default_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AddressResponse:
    return await AddressController.set_default_address(db, current_user.id, address_id)


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await AddressController.delete_address(db, current_user.id, address_id)
