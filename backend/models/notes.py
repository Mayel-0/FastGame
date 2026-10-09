from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, String, UniqueConstraint

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


class NoteCreateSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    id_game: int = Field(..., gt=0)
    value: int = Field(..., ge=0, le=5)
    body: str | None = Field(default=None, max_length=1000)


class RankedGameOut(BaseModel):
    id: int
    titre: str
    image: str | None = None
    avg_rating: float
    ratings_count: int
