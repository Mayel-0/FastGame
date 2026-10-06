from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import BigInteger, Boolean, Column, DateTime, ForeignKey, Integer, String, true
from sqlalchemy.sql import func

from db.database import Base


# --- MODÈLES SQLALCHEMY ---

class ListeModel(Base):
    __tablename__ = "liste"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    users_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    liste_title = Column(String, nullable=False)
    public = Column(Boolean, nullable=False, default=True, server_default=true())
    items_count = Column(BigInteger, nullable=False, default=0, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ListeItemModel(Base):
    __tablename__ = "liste_items"

    # Clé primaire composite (id_list + id_item)
    id_list = Column(
        BigInteger,
        ForeignKey("liste.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    id_item = Column(
        Integer,
        ForeignKey("jeux.id", ondelete="CASCADE"),
        primary_key=True,
    )
    id_user = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)


# --- SCHÉMAS D'ENTRÉE ---

class ListeCreateSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    liste_title: str = Field(min_length=1, max_length=100)
    public: bool = True


class ListeUpdateSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    liste_title: str | None = Field(default=None, min_length=1, max_length=100)
    public: bool | None = None


class ListItemCreateSchema(BaseModel):
    game_id: int
    list_id: int


# --- SCHÉMAS DE SORTIE ---

class ListeResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    users_id: int
    liste_title: str
    public: bool
    items_count: int
    created_at: datetime | None = None


# --- SCHÉMAS PUBLICS (page Communauté) : ne jamais exposer users_id ---

class PublicGameOut(BaseModel):
    id: int
    titre: str | None = None
    studio: str | None = None
    plateforme: str | None = None
    annee: str | None = None
    genre: str | None = None
    image: str | None = None
    url: str | None = None


class PublicListOut(BaseModel):
    list_id: int
    title: str
    owner_id: int
    owner: str
    owner_image_url: str | None = None
    items_count: int
    preview: list[str]
    likes_count: int = 0


class PublicListDetailOut(BaseModel):
    list_id: int
    title: str
    owner_id: int
    owner: str
    owner_image_url: str | None = None
    items_count: int
    games: list[PublicGameOut]
