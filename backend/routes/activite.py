from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db.database import get_db
from models.abonnement import Abonnement as AbonnementModel
from models.activite import ActivityOut
from models.game import GameModel
from models.likes import LikeModel
from models.lists import ListeModel
from models.notes import NoteModel
from models.users import UserModel
from routes.users import get_current_user

router = APIRouter(
    prefix="/api/activite",
    tags=["Activité"],
)


def _as_utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _serialize_user(user: UserModel) -> dict:
    return {"id": user.id, "username": user.username, "image_url": user.image_url}


def _serialize_game(game: GameModel) -> dict:
    return {"id": game.id, "titre": game.titre, "image": game.image}


@router.get("/", response_model=list[ActivityOut])
def get_activity_feed(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dernières notes, likes et listes publiques des joueurs suivis par l'utilisateur connecté."""
    followed_ids = [
        follow_id
        for (follow_id,) in db.query(AbonnementModel.follow_id).filter(
            AbonnementModel.user_id == current_user.id
        )
    ]
    if not followed_ids:
        return []

    window = offset + limit

    notes = (
        db.query(NoteModel, UserModel, GameModel)
        .join(UserModel, UserModel.id == NoteModel.id_user)
        .join(GameModel, GameModel.id == NoteModel.id_game)
        .filter(NoteModel.id_user.in_(followed_ids))
        .order_by(NoteModel.created_at.desc(), NoteModel.id.desc())
        .limit(window)
        .all()
    )
    likes = (
        db.query(LikeModel, UserModel, GameModel)
        .join(UserModel, UserModel.id == LikeModel.user_id)
        .join(GameModel, GameModel.id == LikeModel.game_id)
        .filter(LikeModel.user_id.in_(followed_ids), LikeModel.created_at.isnot(None))
        .order_by(LikeModel.created_at.desc(), LikeModel.id.desc())
        .limit(window)
        .all()
    )
    lists = (
        db.query(ListeModel, UserModel)
        .join(UserModel, UserModel.id == ListeModel.users_id)
        .filter(
            ListeModel.users_id.in_(followed_ids),
            ListeModel.public.is_(True),
            ListeModel.created_at.isnot(None),
        )
        .order_by(ListeModel.created_at.desc(), ListeModel.id.desc())
        .limit(window)
        .all()
    )

    activities = [
        {
            "type": "note",
            "created_at": note.created_at,
            "user": _serialize_user(user),
            "game": _serialize_game(game),
            "note_value": note.value,
            "note_body": note.body,
        }
        for note, user, game in notes
    ] + [
        {
            "type": "like",
            "created_at": like.created_at,
            "user": _serialize_user(user),
            "game": _serialize_game(game),
        }
        for like, user, game in likes
    ] + [
        {
            "type": "liste",
            "created_at": user_list.created_at,
            "user": _serialize_user(user),
            "liste": {
                "id": user_list.id,
                "title": user_list.liste_title,
                "items_count": user_list.items_count or 0,
            },
        }
        for user_list, user in lists
    ]

    activities.sort(key=lambda item: _as_utc(item["created_at"]), reverse=True)
    return activities[offset:window]
