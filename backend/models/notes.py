from pydantic import BaseModel
from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, String, UniqueConstraint

from db.database import Base


# --- MODÈLE SQLALCHEMY ---

class NoteModel(Base):
    __tablename__ = "notes"
    __table_args__ = (
        UniqueConstraint("id_game", "id_user", name="uq_notes_game_user"),
        CheckConstraint("value >= 0 AND value <= 5", name="ck_notes_value_range"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_game = Column(Integer, ForeignKey("jeux.id", ondelete="CASCADE"), nullable=False)  # <-- 'jeux.id' au lieu de 'games.id'
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)  # <-- BigInteger pour 'users'
    value = Column(Integer, nullable=False)  # <-- SmallInteger (smallint en BDD)
    body = Column(String, nullable=True)

# --- SCHÉMA DE SORTIE (page Communauté) ---

class RankedGameOut(BaseModel):
    id: int
    titre: str
    image: str | None = None
    avg_rating: float
    ratings_count: int
