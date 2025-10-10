"""
Modelo de Dirección para FastServices.
Define la estructura de las direcciones de usuarios y sus esquemas de validación.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Boolean,
    DateTime,
    func,
    ForeignKey,
    Text,
    Numeric,
)
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
from database.database import Base


class Address(Base):
    """
    Modelo SQLAlchemy para la tabla addresses.

    Representa una dirección asociada a un usuario del sistema.
    Un usuario puede tener múltiples direcciones.
    """

    __tablename__ = "addresses"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    title = Column(String(100), nullable=False)  # ej: "Casa", "Trabajo", "Oficina"
    street = Column(String(200), nullable=False)  # Calle y número
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)  # Provincia/Estado
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=False, default="Argentina")
    additional_info = Column(Text, nullable=True)  # Departamento, piso, referencias
    is_default = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    latitude = Column(Numeric(9, 6), nullable=True)  # Para geolocalización futura
    longitude = Column(Numeric(9, 6), nullable=True)  # Para geolocalización futura
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(
        DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp()
    )

    # Relaciones
    user = relationship("User", back_populates="addresses")
    service_requests = relationship("ServiceRequest", back_populates="address")

    def __repr__(self):
        return f"<Address(id={self.id}, title='{self.title}', user_id={self.user_id})>"

    @property
    def full_address(self) -> str:
        """Devuelve la dirección completa como string."""
        parts = [self.street, self.city, self.state]
        if self.postal_code:
            parts.append(self.postal_code)
        if self.country and self.country != "Argentina":
            parts.append(self.country)
        return ", ".join(parts)


# Esquemas Pydantic para validación y serialización


class AddressCreate(BaseModel):
    """Esquema para creación de dirección."""

    title: str = Field(
        ..., min_length=1, max_length=100, description="Título de la dirección"
    )
    street: str = Field(..., min_length=5, max_length=200, description="Calle y número")
    city: str = Field(..., min_length=2, max_length=100, description="Ciudad")
    state: str = Field(
        ..., min_length=2, max_length=100, description="Provincia/Estado"
    )
    postal_code: Optional[str] = Field(None, max_length=20, description="Código postal")
    country: str = Field(default="Argentina", max_length=100, description="País")
    additional_info: Optional[str] = Field(None, description="Información adicional")
    is_default: bool = Field(
        default=False, description="Si es la dirección por defecto"
    )


class AddressUpdate(BaseModel):
    """Esquema para actualización de dirección."""

    title: Optional[str] = Field(None, min_length=1, max_length=100)
    street: Optional[str] = Field(None, min_length=5, max_length=200)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    additional_info: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(BaseModel):
    """Esquema para respuesta de dirección."""

    id: int
    title: str
    street: str
    city: str
    state: str
    postal_code: Optional[str]
    country: str
    additional_info: Optional[str]
    is_default: bool
    is_active: bool
    full_address: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AddressListResponse(BaseModel):
    """Esquema para lista de direcciones."""

    addresses: list[AddressResponse]
    total: int
    default_address: Optional[AddressResponse] = None
