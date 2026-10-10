from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ActivityUserOut(BaseModel):
    id: int
    username: str
    image_url: str | None = None


class ActivityGameOut(BaseModel):
    id: int
    titre: str | None = None
    image: str | None = None


class ActivityListOut(BaseModel):
    id: int
    title: str
    items_count: int


class ActivityOut(BaseModel):
    type: Literal["note", "like", "liste"]
    created_at: datetime
    user: ActivityUserOut
    game: ActivityGameOut | None = None
    liste: ActivityListOut | None = None
    note_value: int | None = None
    note_body: str | None = None
