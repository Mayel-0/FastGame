from sqlalchemy import Column, Integer, String
from pydantic import BaseModel
from db.database import Base

# Modèle SQLAlchemy (pour la base de données)
class GameModel(Base):
    __tablename__ = "jeux"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    titre = Column(String, index=True)
    studio = Column(String)
    plateforme = Column(String)
    annee = Column(String)
    genre = Column(String)
    image = Column(String)
    url = Column(String)

# Schéma Pydantic (pour valider et formater la réponse de l'API)
class GameSchema(BaseModel):
    id: int
    titre: str | None = None
    studio: str | None = None
    plateforme: str | None = None
    annee: str | None = None
    genre: str | None = None
    image: str | None = None
    url: str | None = None

    class Config:
        from_attributes = True
