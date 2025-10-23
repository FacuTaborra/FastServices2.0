"""
Controlador para gestión de imágenes y archivos.
Maneja la lógica de negocio para upload, delete y listado de imágenes en S3.
"""

import logging

from fastapi import HTTPException, UploadFile
from utils.error_handler import error_handler

from services.s3_service import s3_service
from models.Image import (
    ImageUploadResponse,
    ImageListResponse,
    FolderListResponse,
    DeleteImageResponse,
    ImageUrlResponse,
)

logger = logging.getLogger(__name__)


class ImageController:
    """Controlador para operaciones con imágenes."""

    ALLOWED_FOLDERS = {
        "profiles": "Imágenes de perfil de usuarios",
        "providers": "Imágenes de perfiles de proveedores",
        "services": "Imágenes de servicios",
        "reviews": "Imágenes de reseñas",
        "general": "Imágenes generales",
        "temp": "Imágenes temporales",
    }

    @error_handler()
    async def upload_image(
        self,
        file: UploadFile,
        folder: str = "general",
        optimize: bool = True,
        max_width: int = 1200,
    ) -> ImageUploadResponse:
        if folder not in self.ALLOWED_FOLDERS:
            raise HTTPException(
                status_code=400,
                detail=f"Carpeta no válida. Carpetas permitidas: {', '.join(self.ALLOWED_FOLDERS.keys())}",
            )

        if not file.filename:
            raise HTTPException(status_code=400, detail="No se proporcionó un archivo")

        result = await s3_service.upload_image(
            file=file, folder=folder, optimize=optimize, max_width=max_width
        )

        return ImageUploadResponse(**result)

    @classmethod
    def delete_image(cls, s3_key: str) -> DeleteImageResponse:
        """
        Eliminar una imagen de S3.

        Args:
            s3_key: Clave S3 del archivo a eliminar

        Returns:
            DeleteImageResponse: Resultado de la eliminación
        """
        try:
            if not s3_key:
                raise HTTPException(
                    status_code=400, detail="Debe proporcionar la clave S3 del archivo"
                )

            logger.info(f"🗑️ Eliminando imagen: {s3_key}")

            # Verificar que existe
            if not s3_service.image_exists(s3_key):
                raise HTTPException(status_code=404, detail="La imagen no existe")

            # Eliminar usando el servicio
            success = s3_service.delete_image(s3_key)

            if success:
                return DeleteImageResponse(
                    success=True, s3_key=s3_key, message="Imagen eliminada exitosamente"
                )
            else:
                raise HTTPException(
                    status_code=500, detail="Error eliminando la imagen"
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error eliminando imagen: {e}")
            raise HTTPException(
                status_code=500, detail="Error interno del servidor al eliminar imagen"
            )

    @classmethod
    def list_images_in_folder(cls, folder: str, limit: int = 50) -> FolderListResponse:
        """
        Listar imágenes en una carpeta específica.

        Args:
            folder: Nombre de la carpeta
            limit: Número máximo de archivos a retornar

        Returns:
            FolderListResponse: Lista de archivos en la carpeta
        """
        try:
            # Validar carpeta si se especifica
            if folder and folder not in cls.ALLOWED_FOLDERS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Carpeta no válida. Carpetas permitidas: {', '.join(cls.ALLOWED_FOLDERS.keys())}",
                )

            # Validar límite
            if limit < 1 or limit > 200:
                raise HTTPException(
                    status_code=400, detail="El límite debe estar entre 1 y 200"
                )

            logger.info(f"📁 Listando imágenes en carpeta: {folder or 'root'}")

            # Obtener archivos usando el servicio
            files_data = s3_service.list_images_in_folder(folder, limit)

            # Convertir a modelos Pydantic
            files = [ImageListResponse(**file_data) for file_data in files_data]

            return FolderListResponse(
                folder=folder or "root", total_files=len(files), files=files
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error listando imágenes: {e}")
            raise HTTPException(
                status_code=500, detail="Error interno del servidor al listar imágenes"
            )

    @classmethod
    def get_image_url(cls, s3_key: str) -> ImageUrlResponse:
        """
        Obtener URL pública de una imagen.

        Args:
            s3_key: Clave S3 del archivo

        Returns:
            ImageUrlResponse: URL e información de la imagen
        """
        try:
            if not s3_key:
                raise HTTPException(
                    status_code=400, detail="Debe proporcionar la clave S3 del archivo"
                )

            # Verificar si existe
            exists = s3_service.image_exists(s3_key)

            if not exists:
                raise HTTPException(status_code=404, detail="La imagen no existe")

            # Obtener URL
            public_url = s3_service.get_image_url(s3_key)

            return ImageUrlResponse(s3_key=s3_key, public_url=public_url, exists=exists)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error obteniendo URL de imagen: {e}")
            raise HTTPException(
                status_code=500,
                detail="Error interno del servidor al obtener URL de imagen",
            )

    @classmethod
    def get_available_folders(cls) -> dict:
        """
        Obtener lista de carpetas disponibles.

        Returns:
            dict: Carpetas disponibles con sus descripciones
        """
        return cls.ALLOWED_FOLDERS


# Instancia global del controlador
image_controller = ImageController()
