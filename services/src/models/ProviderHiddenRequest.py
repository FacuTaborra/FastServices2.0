
from sqlalchemy import Column, BigInteger, ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import relationship
from database.database import Base

class ProviderHiddenRequest(Base):
    """Solicitudes que un proveedor ha decidido ocultar/rechazar sin enviar propuesta."""

    __tablename__ = "provider_hidden_requests"
    __table_args__ = (
        UniqueConstraint(
            "provider_profile_id", 
            "request_id", 
            name="uq_provider_hidden_request"
        ),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    provider_profile_id = Column(
        BigInteger,
        ForeignKey("provider_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    request_id = Column(
        BigInteger,
        ForeignKey("service_requests.id", ondelete="CASCADE"),
        nullable=False,
    )
    hidden_at = Column(DateTime, server_default=func.current_timestamp())

    provider_profile = relationship("ProviderProfile")
    request = relationship("ServiceRequest")

