from fastapi import APIRouter
from routers import (
    addresses_router,
    auth_router,
    images_router,
    providers_router,
    service_requests_router,
    users_router,
    notifications_router,
)

router = APIRouter(prefix="/api", tags=["FastServices API"])

router.include_router(users_router.router, tags=["clients"])

router.include_router(auth_router.router, tags=["auth"])

router.include_router(providers_router.router, tags=["providers"])

router.include_router(addresses_router.router, tags=["addresses"])

router.include_router(images_router.router, tags=["images"])

router.include_router(service_requests_router.router, tags=["service_requests"])

router.include_router(notifications_router.router, tags=["notifications"])
