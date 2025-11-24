import logging
from typing import List, Any, Dict

import httpx
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from models.PushToken import PushToken

logger = logging.getLogger(__name__)

EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send"


class NotificationService:
    @staticmethod
    async def register_token(
        db: AsyncSession, user_id: int, token: str, device_name: str | None = None
    ) -> PushToken:
        """Registra o actualiza un token de notificación para un usuario."""
        if not token.startswith("ExponentPushToken") and not token.startswith(
            "ExpoPushToken"
        ):
            # Basic validation, though Expo SDK handles more
            logger.warning(f"Token invalido intentando registrarse: {token}")

        # Check if token exists
        stmt = select(PushToken).where(PushToken.token == token)
        result = await db.execute(stmt)
        existing_token = result.scalar_one_or_none()

        if existing_token:
            if existing_token.user_id != user_id:
                # Token changed owner (rare but possible on device switch/logout)
                existing_token.user_id = user_id
            existing_token.device_name = device_name or existing_token.device_name
            await db.commit()
            await db.refresh(existing_token)
            logger.info(
                "Token push actualizado user_id=%s device=%s",
                user_id,
                existing_token.device_name,
            )
            return existing_token

        new_token = PushToken(user_id=user_id, token=token, device_name=device_name)
        db.add(new_token)
        await db.commit()
        await db.refresh(new_token)
        logger.info(
            "Token push registrado user_id=%s device=%s",
            user_id,
            new_token.device_name,
        )
        return new_token

    @staticmethod
    async def remove_token(db: AsyncSession, token: str) -> None:
        """Elimina un token (ej. al cerrar sesión)."""
        stmt = delete(PushToken).where(PushToken.token == token)
        await db.execute(stmt)
        await db.commit()

    @staticmethod
    async def send_notification_to_user(
        db: AsyncSession,
        user_id: int,
        title: str,
        body: str,
        data: Dict[str, Any] | None = None,
        sound: str = "default",
    ) -> None:
        """Envía una notificación a todos los dispositivos de un usuario."""

        # Get all tokens for user
        stmt = select(PushToken.token).where(PushToken.user_id == user_id)
        result = await db.execute(stmt)
        tokens = result.scalars().all()

        if not tokens:
            logger.info(f"El usuario {user_id} no tiene tokens registrados.")
            return

        logger.info(
            "Enviando notificación user_id=%s a %s dispositivos",
            user_id,
            len(tokens),
        )

        messages = []
        for token in tokens:
            messages.append(
                {
                    "to": token,
                    "sound": sound,
                    "title": title,
                    "body": body,
                    "data": data or {},
                }
            )

        await NotificationService._send_push_chunk(db, messages)

    @staticmethod
    async def _send_push_chunk(
        db: AsyncSession, messages: List[Dict[str, Any]]
    ) -> None:
        """Envía un lote de mensajes a la API de Expo."""
        # Expo supports batches of up to 100 messages
        # For simplicity here we send one batch, but ideally should chunk if len > 100

        chunk_size = 100
        for i in range(0, len(messages), chunk_size):
            chunk = messages[i : i + chunk_size]
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        EXPO_PUSH_API_URL,
                        json=chunk,
                        headers={
                            "Accept": "application/json",
                            "Accept-Encoding": "gzip, deflate",
                            "Content-Type": "application/json",
                        },
                    )
                    response.raise_for_status()
                    payload = response.json()
                    invalid_tokens: List[str] = []
                    tickets = payload.get("data", [])
                    for message, ticket in zip(chunk, tickets):
                        status = ticket.get("status")
                        if status == "ok":
                            continue
                        error_detail = ticket.get("details", {})
                        error = error_detail.get("error") or ticket.get("message")
                        logger.error(
                            "Expo devolvió error para token %s: %s",
                            message["to"],
                            error,
                        )
                        if error in {"DeviceNotRegistered", "InvalidCredentials"}:
                            invalid_tokens.append(message["to"])

                    if invalid_tokens:
                        logger.info(
                            "Eliminando %s tokens inválidos reportados por Expo",
                            len(invalid_tokens),
                        )
                        stmt = delete(PushToken).where(
                            PushToken.token.in_(invalid_tokens)
                        )
                        await db.execute(stmt)
                        await db.commit()
            except Exception as e:
                logger.error(f"Error enviando notificaciones a Expo: {e}")


notification_service = NotificationService()
