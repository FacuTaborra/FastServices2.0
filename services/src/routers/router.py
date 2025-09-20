"""
Router principal de la aplicación FastServices.
Centraliza todos los endpoints disponibles.
"""

from fastapi import APIRouter
from routers import users_router, providers_router, addresses_router

# Crear router principal sin versionado
router = APIRouter(prefix="/api", tags=["FastServices API"])

# Incluir subrouters con organización clara
router.include_router(users_router.router, tags=["clients"])

router.include_router(providers_router.router, tags=["providers"])

router.include_router(addresses_router.router, tags=["addresses"])
