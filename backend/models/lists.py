from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from datetime import datetime
from db.database import Base


class ListeCreateSchema(BaseModel):
    liste_title: str = Field(min_length=1, max_length=100)
    public: bool = True

class ListeUpdateSchema(BaseModel):
    liste_title: str | None = Field(default=None, min_length=1, max_length=100)
    public: bool | None = None

# --- MODÈLES SQLALCHEMY ---

class ListeModel(Base):
    __tablename__ = "liste"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    users_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    liste_title = Column(String, nullable=False)
    public = Column(Boolean, default=True)
    items_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ListeItemModel(Base):
    __tablename__ = "liste_items"

    id_item = Column(Integer, primary_key=True)  # ID du jeu
    id_list = Column(Integer, ForeignKey("liste.id"), primary_key=True)
    id_user = Column(Integer, ForeignKey("users.id"), nullable=False)


# --- SCHÉMAS PYDANTIC ---

class ListeCreateSchema(BaseModel):
    liste_title: str = Field(min_length=1, max_length=100)
    public: bool = True

class ListeResponseSchema(BaseModel):
    id: int
    users_id: int
    liste_title: str
    public: bool
    items_count: int
    created_at: datetime | None = None

    class Config:
        from_attributes = True

class ListItemCreateSchema(BaseModel):
    game_id: int
    list_id: int
