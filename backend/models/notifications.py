from datetime import datetime
from typing import Literal

from pydantic import BaseModel
from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, String, false
from sqlalchemy.sql import func

from db.database import Base, BigIntPK

NotificationType = Literal["abonnement", "like_liste", "like_note"]


class NotificationModel(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint(
            "type IN ('abonnement', 'like_liste', 'like_note')",
            name="ck_notifications_type",
        ),
    )

    id = Column(BigIntPK, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)
    liste_id = Column(Integer, ForeignKey("liste.id", ondelete="CASCADE"), nullable=True)
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=True)
    lue = Column(Boolean, nullable=False, default=False, server_default=false())
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class NotificationActorOut(BaseModel):
    id: int
    username: str
    image_url: str | None = None


class NotificationListOut(BaseModel):
    id: int
    title: str


class NotificationGameOut(BaseModel):
    id: int
    titre: str | None = None


class NotificationOut(BaseModel):
    id: int
    type: NotificationType
    lue: bool
    created_at: datetime
    actor: NotificationActorOut
    liste: NotificationListOut | None = None
    game: NotificationGameOut | None = None


class UnreadCountOut(BaseModel):
    count: int
