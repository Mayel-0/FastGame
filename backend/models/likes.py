from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.sql import func

from db.database import Base


# --- MODÈLE SQLALCHEMY ---

class LikeModel(Base):
    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint("user_id", "game_id", name="uq_likes_user_game"),
    )

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    game_id = Column(Integer, ForeignKey("jeux.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- SCHÉMAS ---

class LikeSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    game_id: int
    user_id: int
    created_at: datetime | None = None


class LikeCreateSchema(BaseModel):
    game_id: int = Field(..., gt=0)


# --- SCHÉMA DE SORTIE (page Communauté) ---

class LikedGameOut(BaseModel):
    id: int
    titre: str
    image: str | None = None
    likes: int
