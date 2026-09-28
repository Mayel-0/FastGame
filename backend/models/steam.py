from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from datetime import datetime
from db.database import Base


class SteamAccountModel(Base):
    __tablename__ = "steam_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    steam_id = Column(String, unique=True, nullable=False)
    steam_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    linked_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("UserModel", back_populates="steam_account")


# Schémas Pydantic
class SteamAccountSchema(BaseModel):
    id: int
    user_id: int
    steam_id: str
    steam_name: str | None = None
    avatar_url: str | None = None
    linked_at: datetime | None = None

    class Config:
        from_attributes = True
