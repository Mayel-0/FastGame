from sqlalchemy import Column, Integer, String
from db.database import Base


class NoteModel(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_game = Column(Integer, index=True, nullable=False)
    id_user = Column(Integer, index=True, nullable=False)
    value = Column(Integer, nullable=False)
    body = Column(String, nullable=True)
