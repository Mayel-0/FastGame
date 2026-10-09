from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel
from models.likes_list import ListeLikeModel
from models.lists import (
    ListeCreateSchema,
    ListeItemModel,
    ListeModel,
    ListeResponseSchema,
    ListeUpdateSchema,
    ListItemCreateSchema,
    PublicListDetailOut,
    PublicListOut,
)
from models.users import UserModel
from routes.users import get_current_user

router = APIRouter(
    prefix="/api/lists",
    tags=["Lists"]
)


PREVIEW_SIZE = 4


def get_list_like_counts(db: Session, list_ids: list[int]) -> dict[int, int]:
    if not list_ids:
        return {}

    rows = (
        db.query(ListeLikeModel.liste_id, func.count(ListeLikeModel.user_id))
        .filter(ListeLikeModel.liste_id.in_(list_ids))
        .group_by(ListeLikeModel.liste_id)
        .all()
    )
    return dict(rows)


def get_list_previews(db: Session, list_ids: list[int]) -> dict[int, list[str]]:
    if not list_ids:
        return {}

    images = (
        db.query(ListeItemModel.id_list, GameModel.image)
        .join(GameModel, GameModel.id == ListeItemModel.id_item)
        .filter(ListeItemModel.id_list.in_(list_ids))
        .all()
    )
    previews: dict[int, list[str]] = {}
    for list_id, image in images:
        bucket = previews.setdefault(list_id, [])
        if image and len(bucket) < PREVIEW_SIZE:
            bucket.append(image)
    return previews


@router.get("/me", response_model=list[ListeResponseSchema])
def get_my_lists(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir toutes les listes créées par l'utilisateur connecté."""
    return db.query(ListeModel).filter(ListeModel.users_id == current_user.id).all()


@router.get("/me/items")
def get_my_list_items(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir tous les éléments bruts de la table liste_items pour l'utilisateur connecté."""
    return db.query(ListeItemModel).filter(ListeItemModel.id_user == current_user.id).all()


@router.get("/me/joined")
def get_my_lists_with_items(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir les listes de l'utilisateur avec le détail des jeux inclus."""
    user_lists = db.query(ListeModel).filter(ListeModel.users_id == current_user.id).all()

    result = []
    for user_list in user_lists:
        games = (
            db.query(GameModel)
            .join(ListeItemModel, ListeItemModel.id_item == GameModel.id)
            .filter(
                ListeItemModel.id_list == user_list.id,
                ListeItemModel.id_user == current_user.id
            )
            .all()
        )

        result.append({
            "list_id": user_list.id,
            "title": user_list.liste_title,
            "public": user_list.public,
            "created_at": user_list.created_at.isoformat() if user_list.created_at else None,
            "items_count": len(games),
            "games": [
                {
                    "id": game.id,
                    "titre": game.titre,
                    "studio": game.studio,
                    "plateforme": game.plateforme,
                    "genre": game.genre,
                    "image": game.image,
                }
                for game in games
            ]
        })

    return result


@router.post("/me/items", status_code=status.HTTP_201_CREATED)
def add_item_to_list(
    item_data: ListItemCreateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ajouter un jeu dans une liste appartenant à l'utilisateur connecté."""
    user_list = db.query(ListeModel).filter(
        ListeModel.id == item_data.list_id,
        ListeModel.users_id == current_user.id
    ).first()

    if not user_list:
        raise HTTPException(status_code=404, detail="Liste introuvable ou accès non autorisé.")

    if not db.get(GameModel, item_data.game_id):
        raise HTTPException(status_code=404, detail="Jeu introuvable.")

    existing_item = db.query(ListeItemModel).filter(
        ListeItemModel.id_item == item_data.game_id,
        ListeItemModel.id_list == item_data.list_id,
        ListeItemModel.id_user == current_user.id
    ).first()

    if existing_item:
        raise HTTPException(status_code=400, detail="Ce jeu est déjà présent dans cette liste.")

    new_item = ListeItemModel(
        id_item=item_data.game_id,
        id_list=item_data.list_id,
        id_user=current_user.id
    )

    user_list.items_count = (user_list.items_count or 0) + 1
    db.add(new_item)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Ce jeu est déjà présent dans cette liste.")

    return {"message": "Jeu ajouté à la liste avec succès"}


@router.delete("/me/items/{list_id}/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item_from_list(
    list_id: int,
    game_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retirer un jeu d'une liste appartenant à l'utilisateur connecté."""
    item = db.query(ListeItemModel).filter(
        ListeItemModel.id_list == list_id,
        ListeItemModel.id_item == game_id,
        ListeItemModel.id_user == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Élément introuvable dans cette liste.")

    user_list = db.query(ListeModel).filter(ListeModel.id == list_id).first()
    if user_list and (user_list.items_count or 0) > 0:
        user_list.items_count -= 1

    db.delete(item)
    db.commit()

    return None


@router.get("/user/{user_id}", response_model=list[PublicListOut])
def get_public_lists_by_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Obtenir toutes les listes publiques non vides d'un utilisateur spécifique."""
    owner = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable."
        )

    rows = (
        db.query(ListeModel)
        .filter(
            ListeModel.users_id == user_id,
            ListeModel.public.is_(True),
            ListeModel.items_count > 0
        )
        .order_by(ListeModel.created_at.desc())
        .all()
    )

    if not rows:
        return []

    list_ids = [user_list.id for user_list in rows]
    like_counts = get_list_like_counts(db, list_ids)
    previews = get_list_previews(db, list_ids)

    return [
        {
            "list_id": user_list.id,
            "title": user_list.liste_title,
            "owner_id": owner.id,
            "owner": owner.username,
            "owner_image_url": owner.image_url,
            "items_count": user_list.items_count or 0,
            "preview": previews.get(user_list.id, []),
            "likes_count": like_counts.get(user_list.id, 0),
        }
        for user_list in rows
    ]


@router.get("/public/random", response_model=list[PublicListOut])
def get_random_public_lists(
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Tirer au hasard des listes publiques non vides."""
    rows = (
        db.query(ListeModel, UserModel.id, UserModel.username, UserModel.image_url)
        .join(UserModel, UserModel.id == ListeModel.users_id)
        .filter(ListeModel.public.is_(True), ListeModel.items_count > 0)
        .order_by(func.random())
        .limit(limit)
        .all()
    )
    if not rows:
        return []

    list_ids = [user_list.id for user_list, _, _, _ in rows]
    like_counts = get_list_like_counts(db, list_ids)
    previews = get_list_previews(db, list_ids)

    return [
        {
            "list_id": user_list.id,
            "title": user_list.liste_title,
            "owner_id": owner_id,
            "owner": username,
            "owner_image_url": owner_image_url,
            "items_count": user_list.items_count or 0,
            "preview": previews.get(user_list.id, []),
            "likes_count": like_counts.get(user_list.id, 0),
        }
        for user_list, owner_id, username, owner_image_url in rows
    ]


def _escape_like(value: str) -> str:
    """Neutralise % et _ pour que la saisie soit cherchée telle quelle."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/public/search", response_model=list[PublicListOut])
def search_public_lists(
    q: str | None = Query(None, min_length=2, max_length=50),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    term = q.strip() if q else ""
    if q is not None and len(term) < 2:
        return []

    filters = [ListeModel.public.is_(True), ListeModel.items_count > 0]
    if term:
        pattern = f"%{_escape_like(term)}%"
        filters.append(or_(
            ListeModel.liste_title.ilike(pattern, escape="\\"),
            UserModel.username.ilike(pattern, escape="\\"),
        ))

    rows = (
        db.query(ListeModel, UserModel.username, UserModel.image_url)
        .join(UserModel, UserModel.id == ListeModel.users_id)
        .filter(*filters)
        .order_by(ListeModel.created_at.desc(), ListeModel.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    if not rows:
        return []

    list_ids = [user_list.id for user_list, _, _ in rows]
    like_counts = get_list_like_counts(db, list_ids)
    previews = get_list_previews(db, list_ids)

    return [
        {
            "list_id": user_list.id,
            "title": user_list.liste_title,
            "owner": username,
            "owner_id": user_list.users_id,
            "owner_image_url": owner_image_url,
            "items_count": user_list.items_count or 0,
            "preview": previews.get(user_list.id, []),
            "likes_count": like_counts.get(user_list.id, 0),
        }
        for user_list, username, owner_image_url in rows
    ]

@router.get("/public/{list_id}", response_model=PublicListDetailOut)
def get_public_list(list_id: int, db: Session = Depends(get_db)):
    """Détail d'une liste publique. 404 si elle est privée ou inexistante (on ne révèle rien)."""
    row = (
        db.query(ListeModel, UserModel.id, UserModel.username, UserModel.image_url)
        .join(UserModel, UserModel.id == ListeModel.users_id)
        .filter(ListeModel.id == list_id, ListeModel.public.is_(True))
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Liste introuvable.")

    user_list, owner_id, username, owner_image_url = row
    games = (
        db.query(GameModel)
        .join(ListeItemModel, ListeItemModel.id_item == GameModel.id)
        .filter(ListeItemModel.id_list == list_id)
        .all()
    )

    return {
        "list_id": user_list.id,
        "title": user_list.liste_title,
        "owner_id": owner_id,
        "owner": username,
        "owner_image_url": owner_image_url,
        "items_count": len(games),
        "games": [
            {
                "id": g.id,
                "titre": g.titre,
                "studio": g.studio,
                "plateforme": g.plateforme,
                "annee": g.annee,
                "genre": g.genre,
                "image": g.image,
                "url": g.url,
            }
            for g in games
        ],
    }


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ListeResponseSchema)
def create_list(
    list_data: ListeCreateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle liste pour l'utilisateur connecté."""
    new_list = ListeModel(
        users_id=current_user.id,
        liste_title=list_data.liste_title,
        public=list_data.public,
        items_count=0
    )

    db.add(new_list)
    db.commit()
    db.refresh(new_list)

    return new_list


@router.patch("/{list_id}", response_model=ListeResponseSchema)
def update_list(
    list_id: int,
    list_data: ListeUpdateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour le titre ou le statut public d'une liste."""
    user_list = db.query(ListeModel).filter(
        ListeModel.id == list_id,
        ListeModel.users_id == current_user.id
    ).first()

    if not user_list:
        raise HTTPException(status_code=404, detail="Liste introuvable ou accès non autorisé.")

    if list_data.liste_title is not None:
        user_list.liste_title = list_data.liste_title
    if list_data.public is not None:
        user_list.public = list_data.public

    db.commit()
    db.refresh(user_list)

    return user_list


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_list(
    list_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une liste ainsi que tous ses éléments associés dans liste_items."""
    user_list = db.query(ListeModel).filter(
        ListeModel.id == list_id,
        ListeModel.users_id == current_user.id
    ).first()

    if not user_list:
        raise HTTPException(status_code=404, detail="Liste introuvable ou accès non autorisé.")

    db.query(ListeItemModel).filter(ListeItemModel.id_list == list_id).delete()
    db.query(ListeLikeModel).filter(ListeLikeModel.liste_id == list_id).delete()

    db.delete(user_list)
    db.commit()

    return None
