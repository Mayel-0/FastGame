from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.sql import func

from db.database import Base
from models.lists import PublicListOut


# --- MODÈLE SQLALCHEMY ---

class ListeLikeModel(Base):
    __tablename__ = "liste_likes"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    liste_id = Column(Integer, ForeignKey("liste.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class LikedListOut(PublicListOut):
    likes_count: int
    liked_by_me: bool = True
    liked_at: datetime | None = None
