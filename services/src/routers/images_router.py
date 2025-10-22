import logging
from fastapi import APIRouter, File, UploadFile, Query, Depends

from controllers.image_controller import image_controller
from models.Image import ImageUploadResponse, DeleteImageResponse
from auth.auth_utils import get_current_user
from models.User import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/images", tags=["Images"])


@router.post("/upload-profile", response_model=ImageUploadResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    optimize: bool = Query(default=True, description="Optimizar imagen"),
    max_width: int = Query(default=800, description="Ancho máximo para optimización"),
    _: User = Depends(get_current_user),
):
    result = await image_controller.upload_image(
        file=file, folder="profiles", optimize=optimize, max_width=max_width
    )
    return result


@router.post("/upload-service-request", response_model=ImageUploadResponse)
async def upload_service_request_image(
    file: UploadFile = File(...),
    optimize: bool = Query(default=True, description="Optimizar imagen"),
    max_width: int = Query(default=1200, description="Ancho máximo para optimización"),
    _: User = Depends(get_current_user),
):
    result = await image_controller.upload_image(
        file=file, folder="services", optimize=optimize, max_width=max_width
    )
    return result


@router.delete("/{s3_key:path}", response_model=DeleteImageResponse)
async def delete_image(s3_key: str, _: User = Depends(get_current_user)):
    result = image_controller.delete_image(s3_key)
    return result
