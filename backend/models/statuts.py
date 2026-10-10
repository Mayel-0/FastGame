from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict
from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from db.database import Base

Statut = Literal["a_faire", "en_cours", "termine", "abandonne"]


class StatutJeuModel(Base):
    __tablename__ = "statuts_jeu"
    __table_args__ = (
        CheckConstraint(
            "statut IN ('a_faire', 'en_cours', 'termine', 'abandonne')",
            name="ck_statuts_jeu_statut",
        ),
    )

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    game_id = Column(Integer, ForeignKey("jeux.id", ondelete="CASCADE"), primary_key=True)
    statut = Column(String, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class StatutUpdateSchema(BaseModel):
    statut: Statut


class StatutResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    game_id: int
    statut: Statut
    updated_at: datetime | None = None


class LibraryGameOut(BaseModel):
    id: int
    titre: str | None = None
    studio: str | None = None
    plateforme: str | None = None
    annee: str | None = None
    genre: str | None = None
    image: str | None = None
    url: str | None = None
    statut: Statut
    updated_at: datetime | None = None
