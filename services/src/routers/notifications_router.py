from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.database import get_db
from auth.auth_utils import get_current_user
from models.User import User
from models.PushToken import PushTokenCreate
from models.GeneralResponse import GeneralResponse
from services.notification_service import notification_service

router = APIRouter(prefix="/notifications")

@router.post("/register-token", response_model=GeneralResponse)
async def register_token(
    payload: PushTokenCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Registra un token de Expo Push para el usuario actual.
    """
    await notification_service.register_token(
        db, 
        user_id=current_user.id, 
        token=payload.token, 
        device_name=payload.device_name
    )
    return GeneralResponse(message="Token registrado correctamente")

