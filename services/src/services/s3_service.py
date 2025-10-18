import os
import uuid
from datetime import datetime
from typing import List
from io import BytesIO
import logging

from minio import Minio
from PIL import Image
from fastapi import HTTPException, UploadFile
from utils.error_hendler import error_handler

import settings

logger = logging.getLogger(__name__)


class S3Service:
    """Servicio para gestionar archivos en MinIO S3."""

    def __init__(self):
        endpoint = settings.S3_ENDPOINT.replace("https://", "").replace("http://", "")
        secure = settings.S3_ENDPOINT.startswith("https://")

        self.client = Minio(
            endpoint,
            access_key=settings.S3_ACCESS_KEY,
            secret_key=settings.S3_SECRET_KEY,
            secure=secure,
        )
        self.bucket_name = settings.S3_BUCKET_NAME
        self.public_url_base = settings.S3_PUBLIC_URL_BASE

        self.supported_image_types = {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
        }
        self.max_file_size = 10 * 1024 * 1024
        self._ensure_bucket_exists()

    @error_handler(
        {
            "BucketAlreadyOwnedByYou": "El bucket ya existe.",
            "default": "Error al inicializar el bucket de almacenamiento.",
        }
    )
    def _ensure_bucket_exists(self):
        found = self.client.bucket_exists(self.bucket_name)
        if not found:
            self.client.make_bucket(self.bucket_name)

    def _validate_image(self, file: UploadFile) -> None:
        """Validar que el archivo es una imagen válida."""
        if file.content_type not in self.supported_image_types:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de archivo no soportado. Tipos permitidos: {', '.join(self.supported_image_types)}",
            )

        if hasattr(file.file, "seek"):
            file.file.seek(0, 2)
            size = file.file.tell()
            file.file.seek(0)
            if size > self.max_file_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"Archivo muy grande. Tamaño máximo: {self.max_file_size / 1024 / 1024:.1f}MB",
                )

    def _generate_unique_filename(
        self, original_filename: str, folder: str = ""
    ) -> str:
        file_ext = os.path.splitext(original_filename)[1].lower()
        if not file_ext:
            file_ext = ".jpg"

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"{timestamp}_{unique_id}{file_ext}"

        if folder:
            return f"{folder.strip('/')}/{filename}"
        return filename

    @error_handler({"default": "Error al optimizar la imagen."})
    def _optimize_image(
        self, image_data: bytes, max_width: int = 1200, quality: int = 85
    ) -> bytes:
        with Image.open(BytesIO(image_data)) as img:
            if img.mode in ("RGBA", "LA", "P"):
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                background.paste(
                    img, mask=img.split()[-1] if img.mode == "RGBA" else None
                )
                img = background

            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

            output = BytesIO()
            img.save(output, format="JPEG", quality=quality, optimize=True)
            return output.getvalue()

    @error_handler({"default": "Error al subir la imagen al almacenamiento."})
    async def upload_image(
        self,
        file: UploadFile,
        folder: str = "general",
        optimize: bool = True,
        max_width: int = 1200,
    ) -> dict:
        self._validate_image(file)

        if not file.filename:
            raise HTTPException(status_code=400, detail="Nombre de archivo requerido")

        image_data = await file.read()
        original_size = len(image_data)

        if original_size == 0:
            raise HTTPException(status_code=400, detail="El archivo está vacío")

        if optimize:
            image_data = self._optimize_image(image_data, max_width)

        s3_key = self._generate_unique_filename(file.filename, folder)

        final_size = len(image_data)
        content_type = "image/jpeg" if optimize else (file.content_type or "image/jpeg")

        image_buffer = BytesIO(image_data)

        self.client.put_object(
            bucket_name=self.bucket_name,
            object_name=s3_key,
            data=image_buffer,
            length=final_size,
            content_type=content_type,
        )

        public_url = f"{self.public_url_base}/{s3_key}"

        return {
            "success": True,
            "filename": os.path.basename(s3_key),
            "s3_key": s3_key,
            "public_url": public_url,
            "folder": folder,
            "size": len(image_data),
            "content_type": "image/jpeg" if optimize else file.content_type,
            "upload_date": datetime.now().isoformat(),
        }

    @error_handler({"default": "No se pudo eliminar la imagen del almacenamiento."})
    def delete_image(self, s3_key: str) -> bool:
        self.client.remove_object(self.bucket_name, s3_key)
        logger.info(
            f"✅ Object {s3_key} successfully deleted from bucket {self.bucket_name}"
        )
        return True

    @error_handler(
        {"default": "No se pudieron listar las imágenes del almacenamiento."}
    )
    def list_images_in_folder(self, folder: str = "", limit: int = 100) -> List[dict]:
        prefix = f"{folder.strip('/')}/" if folder else ""

        objects = self.client.list_objects(
            bucket_name=self.bucket_name, prefix=prefix, recursive=True
        )

        files = []
        count = 0
        for obj in objects:
            if count >= limit:
                break

            files.append(
                {
                    "filename": os.path.basename(obj.object_name),
                    "s3_key": obj.object_name,
                    "public_url": f"{self.public_url_base}/{obj.object_name}",
                    "size": obj.size,
                    "last_modified": obj.last_modified.isoformat(),
                    "folder": folder,
                }
            )
            count += 1

        return files

    def get_image_url(self, s3_key: str) -> str:
        return f"{self.public_url_base}/{s3_key}"

    @error_handler(
        {
            "default": "No se pudo verificar la existencia de la imagen en el almacenamiento."
        }
    )
    def image_exists(self, s3_key: str) -> bool:
        self.client.stat_object(self.bucket_name, s3_key)
        return True


s3_service = S3Service()
