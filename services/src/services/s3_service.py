"""
Servicio para gestión de archivos en MinIO S3.
Proporciona funcionalidad para upload, delete y gestión de imágenes por carpetas.
"""

import os
import uuid
from datetime import datetime
from typing import List
from io import BytesIO
import logging

from minio import Minio
from minio.error import S3Error
from PIL import Image
from fastapi import HTTPException, UploadFile

import settings

# Configurar logging
logger = logging.getLogger(__name__)


class S3Service:
    """Servicio para gestionar archivos en MinIO S3."""

    def __init__(self):
        """Inicializar cliente MinIO."""
        # Extraer endpoint sin protocolo para MinIO client
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

        # Tipos de archivo soportados
        self.supported_image_types = {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
        }

        # Tamaño máximo de archivo (10MB)
        self.max_file_size = 10 * 1024 * 1024

        # Asegurar que el bucket existe
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Crear bucket si no existe - Siguiendo patrón oficial MinIO."""
        try:
            # Make the bucket if it doesn't exist.
            found = self.client.bucket_exists(self.bucket_name)
            if not found:
                self.client.make_bucket(self.bucket_name)
                logger.info(f"✅ Created bucket '{self.bucket_name}'")
            else:
                logger.info(f"✅ Bucket '{self.bucket_name}' already exists")
        except S3Error as exc:
            logger.error(f"❌ S3Error occurred while ensuring bucket: {exc}")
            raise
        except Exception as e:
            logger.error(f"❌ Error verificando bucket: {e}")
            raise

    def _validate_image(self, file: UploadFile) -> None:
        """Validar que el archivo es una imagen válida."""
        # Validar tipo de contenido
        if file.content_type not in self.supported_image_types:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de archivo no soportado. Tipos permitidos: {', '.join(self.supported_image_types)}",
            )

        # Validar tamaño del archivo
        if hasattr(file.file, "seek"):
            file.file.seek(0, 2)  # Ir al final del archivo
            size = file.file.tell()
            file.file.seek(0)  # Volver al inicio

            if size > self.max_file_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"Archivo muy grande. Tamaño máximo: {self.max_file_size / 1024 / 1024:.1f}MB",
                )

    def _generate_unique_filename(
        self, original_filename: str, folder: str = ""
    ) -> str:
        """Generar nombre único para el archivo."""
        # Obtener extensión del archivo
        file_ext = os.path.splitext(original_filename)[1].lower()
        if not file_ext:
            file_ext = ".jpg"  # Extensión por defecto

        # Generar nombre único con timestamp y UUID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"{timestamp}_{unique_id}{file_ext}"

        # Construir path completo con carpeta
        if folder:
            return f"{folder.strip('/')}/{filename}"
        return filename

    def _optimize_image(
        self, image_data: bytes, max_width: int = 1200, quality: int = 85
    ) -> bytes:
        """Optimizar imagen redimensionando y comprimiendo."""
        try:
            with Image.open(BytesIO(image_data)) as img:
                # Convertir a RGB si es necesario (para PNG con transparencia)
                if img.mode in ("RGBA", "LA", "P"):
                    background = Image.new("RGB", img.size, (255, 255, 255))
                    if img.mode == "P":
                        img = img.convert("RGBA")
                    background.paste(
                        img, mask=img.split()[-1] if img.mode == "RGBA" else None
                    )
                    img = background

                # Redimensionar si es necesario
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

                # Guardar optimizada
                output = BytesIO()
                img.save(output, format="JPEG", quality=quality, optimize=True)
                return output.getvalue()
        except Exception as e:
            logger.warning(f"⚠️ No se pudo optimizar imagen: {e}. Usando original.")
            return image_data

    async def upload_image(
        self,
        file: UploadFile,
        folder: str = "general",
        optimize: bool = True,
        max_width: int = 1200,
    ) -> dict:
        """
        Subir imagen a S3 con optimización opcional.

        Args:
            file: Archivo de imagen a subir
            folder: Carpeta donde guardar la imagen
            optimize: Si optimizar la imagen (redimensionar/comprimir)
            max_width: Ancho máximo para optimización

        Returns:
            dict: Información del archivo subido
        """
        try:
            # Validar imagen
            self._validate_image(file)

            # Validar que el archivo tenga contenido
            if not file.filename:
                raise HTTPException(
                    status_code=400, detail="Nombre de archivo requerido"
                )

            # Leer contenido del archivo una sola vez
            image_data = await file.read()
            original_size = len(image_data)
            logger.info(f"📏 Tamaño original del archivo: {original_size} bytes")

            if original_size == 0:
                raise HTTPException(status_code=400, detail="El archivo está vacío")

            # Optimizar imagen si se solicita
            if optimize:
                image_data = self._optimize_image(image_data, max_width)
                optimized_size = len(image_data)
                logger.info(
                    f"📏 Tamaño después de optimización: {optimized_size} bytes"
                )

            # Generar nombre único
            s3_key = self._generate_unique_filename(file.filename, folder)

            # Preparar datos para S3 usando BytesIO para evitar problemas de Content-Length
            final_size = len(image_data)
            content_type = (
                "image/jpeg" if optimize else (file.content_type or "image/jpeg")
            )

            logger.info(
                f"📤 Preparando subida: {final_size} bytes, tipo: {content_type}"
            )

            # Crear buffer de BytesIO para la subida con MinIO
            image_buffer = BytesIO(image_data)

            try:
                # Upload usando put_object de MinIO (método oficial recomendado)
                self.client.put_object(
                    bucket_name=self.bucket_name,
                    object_name=s3_key,
                    data=image_buffer,
                    length=final_size,
                    content_type=content_type,
                )
                logger.info(
                    f"✅ {file.filename} successfully uploaded as object {s3_key} to bucket {self.bucket_name}"
                )

            except S3Error as exc:
                logger.error(f"❌ S3Error occurred during upload: {exc}")
                raise HTTPException(
                    status_code=500, detail=f"MinIO S3 Error: {str(exc)}"
                )
            except Exception as general_error:
                logger.error(
                    f"❌ General error occurred during upload: {general_error}"
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Upload failed: {str(general_error)}",
                )  # URL pública del archivo
            public_url = f"{self.public_url_base}/{s3_key}"

            logger.info(f"✅ Imagen subida exitosamente: {s3_key}")

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

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error subiendo imagen: {e}")
            raise HTTPException(status_code=500, detail="Error interno subiendo imagen")

    def delete_image(self, s3_key: str) -> bool:
        """
        Eliminar imagen de MinIO - Siguiendo patrón oficial.

        Args:
            s3_key: Clave S3 del archivo a eliminar

        Returns:
            bool: True si se eliminó exitosamente
        """
        try:
            self.client.remove_object(self.bucket_name, s3_key)
            logger.info(
                f"✅ Object {s3_key} successfully deleted from bucket {self.bucket_name}"
            )
            return True
        except S3Error as exc:
            logger.error(f"❌ S3Error occurred while deleting {s3_key}: {exc}")
            return False
        except Exception as e:
            logger.error(f"❌ General error deleting {s3_key}: {e}")
            return False

    def list_images_in_folder(self, folder: str = "", limit: int = 100) -> List[dict]:
        """
        Listar imágenes en una carpeta específica.

        Args:
            folder: Carpeta a listar (vacío para root)
            limit: Número máximo de archivos a retornar

        Returns:
            List[dict]: Lista de archivos en la carpeta
        """
        try:
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

        except S3Error as e:
            logger.error(f"❌ Error MinIO listando archivos en carpeta {folder}: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ Error general listando archivos en carpeta {folder}: {e}")
            return []

    def get_image_url(self, s3_key: str) -> str:
        """
        Obtener URL pública de una imagen.

        Args:
            s3_key: Clave S3 del archivo

        Returns:
            str: URL pública del archivo
        """
        return f"{self.public_url_base}/{s3_key}"

    def image_exists(self, s3_key: str) -> bool:
        """
        Verificar si una imagen existe en MinIO - Siguiendo patrón oficial.

        Args:
            s3_key: Clave S3 del archivo

        Returns:
            bool: True si el archivo existe
        """
        try:
            self.client.stat_object(self.bucket_name, s3_key)
            return True
        except S3Error as exc:
            # S3Error significa que el objeto no existe o hay un error de permisos
            logger.debug(f"Object {s3_key} does not exist or access denied: {exc}")
            return False
        except Exception as e:
            logger.error(f"General error checking if {s3_key} exists: {e}")
            return False


# Instancia global del servicio
s3_service = S3Service()
