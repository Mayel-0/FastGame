
from db.database import Base
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, func


class Abonnement(Base):
    __tablename__ = "abonnements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"),nullable=False)
    follow_id = Column(Integer, ForeignKey("users.id"),nullable=False)
    abonned_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AbonnementCreateSchema(BaseModel):
    follow_id: int

class AbonnementResponseSchema(BaseModel):
    id: int
    user_id: int
    follow_id: int
    abonned_at: datetime

    class Config:
        from_attributes = True
