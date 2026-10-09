from datetime import datetime
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, BigInteger, DateTime, ForeignKey, func
from db.database import Base, BigIntPK


class FavorisModel(Base):
    __tablename__ = "favoris"

    id = Column(BigIntPK, primary_key=True, index=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("jeux.id"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    update_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class FavorisCreateSchema(BaseModel):
    post_id: int


class FavorisResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    user_id: int
    update_at: datetime | None = None
