import logging
from fastapi import Request

logger = logging.getLogger("app.request")  # Usa un nombre propio


async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response
