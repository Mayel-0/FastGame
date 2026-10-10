from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.sql import func

from db.database import Base


class NoteModel(Base):
    __tablename__ = "notes"
    __table_args__ = (
        UniqueConstraint("id_game", "id_user", name="uq_notes_game_user"),
        CheckConstraint("value >= 0 AND value <= 5", name="ck_notes_value_range"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_game = Column(Integer, ForeignKey("jeux.id", ondelete="CASCADE"), nullable=False)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    value = Column(Integer, nullable=False)
    body = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)


class NoteLikeModel(Base):
    __tablename__ = "note_likes"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class NoteCreateSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    id_game: int = Field(..., gt=0)
    value: int = Field(..., ge=0, le=5)
    body: str | None = Field(default=None, max_length=1000)


class NoteUpdateSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    value: int | None = Field(default=None, ge=0, le=5)
    body: str | None = Field(default=None, max_length=1000)


class NoteOut(BaseModel):
    id: int
    id_game: int
    id_user: int
    username: str | None = None
    image_url: str | None = None
    value: int
    body: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    likes_count: int = 0
    liked_by_me: bool = False


class RankedGameOut(BaseModel):
    id: int
    titre: str
    image: str | None = None
    avg_rating: float
    ratings_count: int
