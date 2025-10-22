import functools
import inspect
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError


def error_handler(custom_messages=None):
    custom_messages = custom_messages or {}

    def decorator(func):
        if inspect.iscoroutinefunction(func):

            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                db = (
                    args[0]
                    if args and hasattr(args[0], "rollback")
                    else kwargs.get("db", None)
                )
                try:
                    return await func(*args, **kwargs)
                except HTTPException:
                    raise
                except IntegrityError as e:
                    if db:
                        await db.rollback()
                    error_message = str(e.orig).lower()
                    for key, msg in custom_messages.items():
                        if key != "default" and key in error_message:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST, detail=msg
                            )
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=custom_messages.get(
                            "default", "Error de integridad de base de datos"
                        ),
                    )
                except Exception as e:
                    if db:
                        await db.rollback()
                    error_text = str(e).lower()
                    for key, msg in custom_messages.items():
                        if key != "default" and key in error_text:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST, detail=msg
                            )
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=custom_messages.get(
                            "internal",
                            custom_messages.get("default", f"Error interno: {str(e)}"),
                        ),
                    )

            return async_wrapper
        else:

            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                db = (
                    args[0]
                    if args and hasattr(args[0], "rollback")
                    else kwargs.get("db", None)
                )
                try:
                    return func(*args, **kwargs)
                except HTTPException:
                    raise
                except IntegrityError as e:
                    if db:
                        db.rollback()
                    error_message = str(e.orig).lower()
                    for key, msg in custom_messages.items():
                        if key != "default" and key in error_message:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST, detail=msg
                            )
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=custom_messages.get(
                            "default", "Error de integridad de base de datos"
                        ),
                    )
                except Exception as e:
                    if db:
                        db.rollback()
                    error_text = str(e).lower()
                    for key, msg in custom_messages.items():
                        if key != "default" and key in error_text:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST, detail=msg
                            )
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=custom_messages.get(
                            "internal",
                            custom_messages.get("default", f"Error interno: {str(e)}"),
                        ),
                    )

            return sync_wrapper

    return decorator
