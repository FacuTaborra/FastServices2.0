import functools
import inspect
import logging
from collections.abc import Mapping
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError


def error_handler(custom_messages=None):
    logger = None

    if isinstance(custom_messages, logging.Logger):
        logger = custom_messages
        custom_messages = {}
    elif custom_messages is None:
        custom_messages = {}
    elif isinstance(custom_messages, Mapping):
        custom_messages = dict(custom_messages)
    elif hasattr(custom_messages, "error") and callable(custom_messages.error):
        logger = custom_messages
        custom_messages = {}
    else:
        raise TypeError(
            "error_handler expects a dict of custom messages or a logger instance",
        )

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
                    if logger:
                        logger.exception(
                            "Integrity error in %s",
                            func.__name__,
                        )
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
                    if logger:
                        logger.exception(
                            "Unhandled exception in %s",
                            func.__name__,
                        )
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
                    if logger:
                        logger.exception(
                            "Integrity error in %s",
                            func.__name__,
                        )
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
                    if logger:
                        logger.exception(
                            "Unhandled exception in %s",
                            func.__name__,
                        )
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
