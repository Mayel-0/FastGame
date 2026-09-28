from datetime import datetime
from pydantic import BaseModel
from sqlalchemy import Column, Integer, BigInteger, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from db.database import Base  # Adaptez selon votre import de Base

# ── Modèle SQLAlchemy ──────────────────────────────────────────────────────────

class FavorisModel(Base):
    __tablename__ = "favoris"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("jeux.id"), nullable=False) # Ou ForeignKey sur la table appropriée
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    update_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relations (si besoin)
    # game = relationship("GameModel")


# ── Schémas Pydantic ──────────────────────────────────────────────────────────

class FavorisCreateSchema(BaseModel):
    post_id: int

class FavorisResponseSchema(BaseModel):
    id: int
    post_id: int
    user_id: int
    update_at: datetime | None = None

    class Config:
        from_attributes = True
