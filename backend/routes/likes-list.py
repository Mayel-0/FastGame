

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel
from models.likes_list import LikedListOut, ListeLikeModel
from models.lists import ListeItemModel, ListeModel
from models.users import UserModel
from routes.users import get_current_user

router = APIRouter(
    prefix="/api/lists",
    tags=["List likes"],
)


def _likes_count(db: Session, list_id: int) -> int:
    return (
        db.query(func.count(ListeLikeModel.user_id))
        .filter(ListeLikeModel.liste_id == list_id)
        .scalar()
        or 0
    )


# GET /api/lists/me/liked : les listes publiques que j'ai likées
@router.get("/me/liked", response_model=list[LikedListOut])
def get_my_liked_lists(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(ListeModel, UserModel.username, ListeLikeModel.created_at)
        .join(ListeLikeModel, ListeLikeModel.liste_id == ListeModel.id)
        .join(UserModel, UserModel.id == ListeModel.users_id)
        .filter(
            ListeLikeModel.user_id == current_user.id,
            ListeModel.public.is_(True),  # une liste repassée en privé disparaît
        )
        .order_by(ListeLikeModel.created_at.desc(), ListeModel.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    if not rows:
        return []

    list_ids = [user_list.id for user_list, _, _ in rows]

    # Nombre total de likes de chacune de ces listes (une seule requête)
    like_counts = dict(
        db.query(ListeLikeModel.liste_id, func.count(ListeLikeModel.user_id))
        .filter(ListeLikeModel.liste_id.in_(list_ids))
        .group_by(ListeLikeModel.liste_id)
        .all()
    )

    # Pochettes : 4 maximum par liste (une seule requête)
    images = (
        db.query(ListeItemModel.id_list, GameModel.image)
        .join(GameModel, GameModel.id == ListeItemModel.id_item)
        .filter(ListeItemModel.id_list.in_(list_ids))
        .all()
    )
    previews: dict[int, list[str]] = {}
    for list_id, image in images:
        bucket = previews.setdefault(list_id, [])
        if image and len(bucket) < 4:
            bucket.append(image)

    return [
        {
            "list_id": user_list.id,
            "title": user_list.liste_title,
            "owner": username,
            "owner_id": user_list.users_id,
            "items_count": user_list.items_count or 0,
            "preview": previews.get(user_list.id, []),
            "likes_count": like_counts.get(user_list.id, 0),
            "liked_by_me": True,
            "liked_at": liked_at,
        }
        for user_list, username, liked_at in rows
    ]


# POST /api/lists/{list_id}/like : liker une liste publique
@router.post("/{list_id}/like", status_code=status.HTTP_201_CREATED)
def like_list(
    list_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Liste publique uniquement : 404 si elle est privée ou inexistante
    user_list = db.query(ListeModel).filter(
        ListeModel.id == list_id,
        ListeModel.public.is_(True),
    ).first()
    if not user_list:
        raise HTTPException(status_code=404, detail="Liste introuvable.")

    # Pas de like sur sa propre liste (supprime ces 2 lignes pour l'autoriser)
    if user_list.users_id == current_user.id:
        raise HTTPException(status_code=400, detail="Tu ne peux pas liker ta propre liste.")

    if not db.get(ListeLikeModel, (current_user.id, list_id)):
        db.add(ListeLikeModel(user_id=current_user.id, liste_id=list_id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()  # requête simultanée : le like existe déjà, ce n'est pas une erreur

    return {"liked": True, "likes_count": _likes_count(db, list_id)}


# DELETE /api/lists/{list_id}/like : retirer son like
@router.delete("/{list_id}/like")
def unlike_list(
    list_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(ListeLikeModel).filter(
        ListeLikeModel.user_id == current_user.id,
        ListeLikeModel.liste_id == list_id,
    ).delete(synchronize_session=False)
    db.commit()

    return {"liked": False, "likes_count": _likes_count(db, list_id)}
