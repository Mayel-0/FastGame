from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel
from datetime import datetime
from db.database import Base

class LikeModel(Base):
    __tablename__ = "likes"  # Nom exact de ta table sur Supabase

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    update_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class LikeSchema(BaseModel):
    id: int
    post_id: int
    user_id: int
    update_at: datetime | None = None

    class Config:
        from_attributes = True