"""
Router principal de la aplicación FastServices.
Centraliza todos los endpoints disponibles.
"""

from fastapi import APIRouter
from routers import (
    addresses_router,
    auth_router,
    images_router,
    providers_router,
    service_requests_router,
    users_router,
)

# Crear router principal sin versionado
router = APIRouter(prefix="/api", tags=["FastServices API"])

# Incluir subrouters con organización clara
router.include_router(users_router.router, tags=["clients"])

router.include_router(auth_router.router, tags=["auth"])

router.include_router(providers_router.router, tags=["providers"])

router.include_router(addresses_router.router, tags=["addresses"])

router.include_router(images_router.router, tags=["images"])

router.include_router(service_requests_router.router, tags=["service_requests"])
