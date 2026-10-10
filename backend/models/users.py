from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict, Field
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
    image_url = Column(String, nullable=True, server_default="/api/media/default-avatar.png")

    steam_account = relationship(
        "SteamAccountModel",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime | None = None
    email: str
    username: str
    bio: str | None = None
    image_url: str | None = None


class PublicUserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime | None = None
    username: str
    bio: str | None = None
    image_url: str | None = None


class TopUserSchema(BaseModel):
    id: int
    username: str
    image_url: str | None = None
    public_lists_count: int
    likes_received: int


class RatingCountSchema(BaseModel):
    value: int
    count: int


class UserStatsSchema(BaseModel):
    ratings_count: int
    average_rating: float | None = None
    likes_count: int
    public_lists_count: int
    followers_count: int
    following_count: int
    favorite_genre: str | None = None
    ratings_distribution: list[RatingCountSchema]


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
