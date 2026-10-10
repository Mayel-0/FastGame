from sqlalchemy.orm import Session

from models.notifications import NotificationModel


def notify(
    db: Session,
    user_id: int,
    actor_id: int,
    type: str,
    liste_id: int | None = None,
    note_id: int | None = None,
) -> None:
    """Prépare une notification dans la session, sans la valider : l'appelant fait le commit."""
    if user_id == actor_id:
        return

    already_pending = db.query(NotificationModel).filter(
        NotificationModel.user_id == user_id,
        NotificationModel.actor_id == actor_id,
        NotificationModel.type == type,
        NotificationModel.liste_id == liste_id,
        NotificationModel.note_id == note_id,
        NotificationModel.lue.is_(False),
    ).first()
    if already_pending:
        return

    db.add(NotificationModel(
        user_id=user_id,
        actor_id=actor_id,
        type=type,
        liste_id=liste_id,
        note_id=note_id,
    ))
