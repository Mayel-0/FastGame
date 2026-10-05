from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship  # ← ajout
from pydantic import BaseModel, Field
from datetime import datetime
from db.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    bio = Column(String, nullable=True)
    image_url = Column(String, nullable=True, server_default="/api/media/default-avatar.svg")

    steam_account = relationship("SteamAccountModel", back_populates="user", uselist=False)  # ← ajout

# Schémas Pydantic
class UserSchema(BaseModel):
    id: int
    created_at: datetime | None = None
    email: str
    username: str
    bio: str | None = None
    image_url: str | None = None

    class Config:
        from_attributes = True

class PublicUserSchema(BaseModel):
    id: int
    created_at: datetime | None = None
    username: str
    bio: str | None = None
    image_url: str | None = None

    class Config:
        from_attributes = True

class TopUserSchema(BaseModel):
    id: int
    username: str
    image_url: str | None = None
    public_lists_count: int
    likes_received: int

class UserCreateSchema(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=72)
    username: str = Field(min_length=1, max_length=50)
    bio: str | None = Field(default=None, max_length=500)

class UserUpdateSchema(BaseModel):
    email: str | None = Field(default=None, min_length=3, max_length=320)
    username: str | None = Field(default=None, min_length=1, max_length=50)
    bio: str | None = Field(default=None, max_length=500)
    password: str | None = Field(default=None, min_length=8, max_length=72)

class UserLoginSchema(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=72)

class TokenSchema(BaseModel):
    access_token: str
    token_type: str
