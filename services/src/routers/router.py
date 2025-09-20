"""
Router principal de la aplicación FastServices.
Centraliza todos los endpoints disponibles.
"""

from fastapi import APIRouter
from routers import users_router

# Crear router principal con versionado
router = APIRouter(prefix="/api", tags=["FastServices API v1"])

# Incluir subrouters con organización clara
router.include_router(users_router.router, tags=["usuarios"])
