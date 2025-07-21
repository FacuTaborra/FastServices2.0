from fastapi import APIRouter
from routers import users_router

router = APIRouter(prefix="/api")

router.include_router(users_router.router)
