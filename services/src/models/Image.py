"""
Modelos Pydantic para gestión de archivos e imágenes.
"""

from typing import List
from pydantic import BaseModel, Field


class ImageUploadResponse(BaseModel):
    """Respuesta de upload de imagen."""

    success: bool = Field(..., description="Si el upload fue exitoso")
    filename: str = Field(..., description="Nombre del archivo subido")
    s3_key: str = Field(..., description="Clave S3 del archivo")
    public_url: str = Field(..., description="URL pública de la imagen")
    folder: str = Field(..., description="Carpeta donde se guardó")
    size: int = Field(..., description="Tamaño del archivo en bytes")
    content_type: str = Field(..., description="Tipo de contenido")
    upload_date: str = Field(..., description="Fecha y hora de upload")


class ImageListResponse(BaseModel):
    """Respuesta de listado de imágenes."""

    filename: str = Field(..., description="Nombre del archivo")
    s3_key: str = Field(..., description="Clave S3 del archivo")
    public_url: str = Field(..., description="URL pública de la imagen")
    size: int = Field(..., description="Tamaño del archivo en bytes")
    last_modified: str = Field(..., description="Fecha de última modificación")
    folder: str = Field(..., description="Carpeta del archivo")


class FolderListResponse(BaseModel):
    """Respuesta de listado de archivos en carpeta."""

    folder: str = Field(..., description="Nombre de la carpeta")
    total_files: int = Field(..., description="Total de archivos en la carpeta")
    files: List[ImageListResponse] = Field(..., description="Lista de archivos")


class DeleteImageResponse(BaseModel):
    """Respuesta de eliminación de imagen."""

    success: bool = Field(..., description="Si la eliminación fue exitosa")
    s3_key: str = Field(..., description="Clave S3 del archivo eliminado")
    message: str = Field(..., description="Mensaje descriptivo")


class ImageUrlResponse(BaseModel):
    """Respuesta con URL de imagen."""

    s3_key: str = Field(..., description="Clave S3 del archivo")
    public_url: str = Field(..., description="URL pública de la imagen")
    exists: bool = Field(..., description="Si la imagen existe")


class ImageUploadRequest(BaseModel):
    """Request para configurar upload de imagen."""

    folder: str = Field(default="general", description="Carpeta destino")
    optimize: bool = Field(default=True, description="Si optimizar la imagen")
    max_width: int = Field(default=1200, description="Ancho máximo para optimización")

    class Config:
        json_schema_extra = {
            "example": {"folder": "profiles", "optimize": True, "max_width": 1200}
        }
