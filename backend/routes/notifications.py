from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel
from models.lists import ListeModel
from models.notes import NoteModel
from models.notifications import NotificationModel, NotificationOut, UnreadCountOut
from models.users import UserModel
from routes.users import get_current_user

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


@router.get("/", response_model=list[NotificationOut])
def get_my_notifications(
    limit: int = Query(20, ge=1, le=50),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Récupère les dernières notifications de l'utilisateur connecté."""
    rows = (
        db.query(NotificationModel, UserModel, ListeModel, GameModel)
        .join(UserModel, UserModel.id == NotificationModel.actor_id)
        .outerjoin(ListeModel, ListeModel.id == NotificationModel.liste_id)
        .outerjoin(NoteModel, NoteModel.id == NotificationModel.note_id)
        .outerjoin(GameModel, GameModel.id == NoteModel.id_game)
        .filter(NotificationModel.user_id == current_user.id)
        .order_by(NotificationModel.created_at.desc(), NotificationModel.id.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": notification.id,
            "type": notification.type,
            "lue": notification.lue,
            "created_at": notification.created_at,
            "actor": {
                "id": actor.id,
                "username": actor.username,
                "image_url": actor.image_url,
            },
            "liste": {"id": user_list.id, "title": user_list.liste_title} if user_list else None,
            "game": {"id": game.id, "titre": game.titre} if game else None,
        }
        for notification, actor, user_list, game in rows
    ]


@router.get("/unread-count", response_model=UnreadCountOut)
def get_unread_count(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Nombre de notifications non lues de l'utilisateur connecté."""
    count = (
        db.query(func.count(NotificationModel.id))
        .filter(
            NotificationModel.user_id == current_user.id,
            NotificationModel.lue.is_(False),
        )
        .scalar()
        or 0
    )
    return {"count": count}


@router.patch("/lues", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_as_read(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marque toutes les notifications de l'utilisateur connecté comme lues."""
    db.query(NotificationModel).filter(
        NotificationModel.user_id == current_user.id,
        NotificationModel.lue.is_(False),
    ).update({NotificationModel.lue: True}, synchronize_session=False)
    db.commit()
    return None
