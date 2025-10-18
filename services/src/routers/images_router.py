"""
Router para endpoints de gestión de imágenes.
Proporciona endpoints REST para upload, delete y listado de imágenes en S3.
"""

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
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
):
    """Subir imagen asociada a una solicitud de servicio."""

    try:
        logger.info(
            "👤 Usuario %s subiendo imagen de solicitud (%s)",
            current_user.email,
            file.filename,
        )

        result = await image_controller.upload_image(
            file=file, folder="services", optimize=optimize, max_width=max_width
        )

        return result

    except Exception as e:  # noqa: BLE001
        logger.error("❌ Error subiendo imagen de solicitud: %s", e)
        raise


@router.delete("/{s3_key:path}", response_model=DeleteImageResponse)
async def delete_image(s3_key: str, current_user: User = Depends(get_current_user)):
    """
    Eliminar una imagen de S3.

    - **s3_key**: Clave S3 completa del archivo (incluye carpeta/nombre)

    Elimina permanentemente la imagen del servidor.
    """
    try:
        logger.info(f"👤 Usuario {current_user.email} eliminando imagen {s3_key}")

        result = image_controller.delete_image(s3_key)
        return result

    except Exception as e:
        logger.error(f"❌ Error en endpoint delete: {e}")
        raise


# Endpoints removidos - Solo mantenemos los esenciales para foto de perfil:
# - POST /upload (subir imagen)
# - DELETE /{s3_key} (eliminar imagen)
# - Se conecta con PUT /users/update-profile-image
