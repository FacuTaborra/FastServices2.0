from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from database.database import Base

class PushToken(Base):
    __tablename__ = "push_tokens"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    device_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    user = relationship("User", backref="push_tokens")

    def __repr__(self):
        return f"<PushToken(user_id={self.user_id}, token='{self.token}')>"

class PushTokenCreate(BaseModel):
    token: str
    device_name: str | None = None

