from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from datetime import datetime
from db.database import Base

class LikeModel(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    game_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LikeSchema(BaseModel):
    id: int
    game_id: int
    user_id: int
    created_at: datetime | None = None

    class Config:
        from_attributes = True

class LikeCreateSchema(BaseModel):
    game_id: int = Field(..., gt=0)