"""
Aplicación principal FastServices API.
Sistema de gestión de servicios con autenticación JWT.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router
from utils import global_exception_handler, log
from settings import LOG_LEVEL

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """
    Crear y configurar la aplicación FastAPI.

    Returns:
        FastAPI: Instancia configurada de la aplicación
    """
    app = FastAPI(
        title="FastServices API",
        description="API para gestión de servicios",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_exception_handler(Exception, global_exception_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # En producción, especificar dominios exactos
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    app.middleware("http")(log.log_requests)

    app.include_router(router.router)

    @app.get("/health", tags=["health"])
    async def health_check():
        return {"status": "ok", "service": "FastServices API", "version": "1.0.0"}

    @app.get("/", tags=["root"])
    async def root():
        return {
            "message": "Bienvenido a FastServices API",
            "docs": "/docs",
            "health": "/health",
        }

    logger.info("FastServices API iniciada correctamente")
    return app


app = create_app()
