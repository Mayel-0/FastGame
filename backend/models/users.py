from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from datetime import datetime
from db.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Sera stocké haché !
    username = Column(String, unique=True, index=True, nullable=False)
    bio = Column(String, nullable=True)

# Schémas Pydantic
class UserSchema(BaseModel):
    id: int
    created_at: datetime | None = None
    email: str
    username: str
    bio: str | None = None

    class Config:
        from_attributes = True

class UserCreateSchema(BaseModel):
    email: str
    password: str
    username: str
    bio: str | None = None

class UserUpdateSchema(BaseModel):
    email: str
    username: str
    bio: str | None = None
    password: str | None = None

class UserLoginSchema(BaseModel):
    email: str
    password: str

class TokenSchema(BaseModel):
    access_token: str
    token_type: str
