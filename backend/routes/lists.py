from sqlalchemy import func, or_
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel
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


# =========================================================
# ROUTES PERSONNELLES (authentification requise)
# =========================================================

# ---------------------------------------------------------
# GET /api/lists/me : listes créées par l'utilisateur
# ---------------------------------------------------------
@router.get("/me", response_model=list[ListeResponseSchema])
def get_my_lists(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir toutes les listes créées par l'utilisateur connecté."""
    return db.query(ListeModel).filter(ListeModel.users_id == current_user.id).all()


# ---------------------------------------------------------
# GET /api/lists/me/items : enregistrements bruts de liste_items
# ---------------------------------------------------------
@router.get("/me/items")
def get_my_list_items(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir tous les éléments bruts de la table liste_items pour l'utilisateur connecté."""
    return db.query(ListeItemModel).filter(ListeItemModel.id_user == current_user.id).all()


# ---------------------------------------------------------
# GET /api/lists/me/joined : listes + jeux associés
# ---------------------------------------------------------
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


# ---------------------------------------------------------
# POST /api/lists/me/items : ajouter un jeu dans une liste
# ---------------------------------------------------------
@router.post("/me/items", status_code=status.HTTP_201_CREATED)
def add_item_to_list(
    item_data: ListItemCreateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ajouter un jeu dans une liste appartenant à l'utilisateur connecté."""
    # La liste existe et appartient à l'utilisateur
    user_list = db.query(ListeModel).filter(
        ListeModel.id == item_data.list_id,
        ListeModel.users_id == current_user.id
    ).first()

    if not user_list:
        raise HTTPException(status_code=404, detail="Liste introuvable ou accès non autorisé.")

    # Le jeu existe
    if not db.get(GameModel, item_data.game_id):
        raise HTTPException(status_code=404, detail="Jeu introuvable.")

    # Le jeu n'est pas déjà dans la liste
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
        # Requête simultanée : la clé primaire (id_item, id_list) a bloqué le doublon
        db.rollback()
        raise HTTPException(status_code=400, detail="Ce jeu est déjà présent dans cette liste.")

    return {"message": "Jeu ajouté à la liste avec succès"}


# ---------------------------------------------------------
# DELETE /api/lists/me/items/{list_id}/{game_id} : retirer un jeu
# ---------------------------------------------------------
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
    if user_list and user_list.items_count > 0:
        user_list.items_count -= 1

    db.delete(item)
    db.commit()

    return None


# =========================================================
# ROUTES PUBLIQUES (page Communauté, sans authentification)
# Si la page doit être réservée aux connectés, ajouter :
#   current_user: UserModel = Depends(get_current_user)
# ATTENTION : /public/random doit rester AVANT /public/{list_id}
# =========================================================

# ---------------------------------------------------------
# GET /api/lists/public/random : listes publiques aléatoires
# ---------------------------------------------------------
@router.get("/public/random", response_model=list[PublicListOut])
def get_random_public_lists(
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Tirer au hasard des listes publiques non vides."""
    # NB : func.random() fonctionne sur PostgreSQL et SQLite (MySQL : func.rand())
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

    # Une seule requête pour toutes les pochettes (évite le N+1)
    list_ids = [user_list.id for user_list, _, _, _ in rows]
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
            "owner_id": owner_id,
            "owner": username,
            "owner_image_url": owner_image_url,
            "items_count": user_list.items_count or 0,
            "preview": previews.get(user_list.id, []),
        }
        for user_list, owner_id, username, owner_image_url in rows
    ]


def _escape_like(value: str) -> str:
    """Neutralise % et _ pour que la saisie soit cherchée telle quelle."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


# GET /api/lists/public/search?q=... : listes publiques par titre OU par pseudo
@router.get("/public/search", response_model=list[PublicListOut])
def search_public_lists(
    q: str = Query(..., min_length=2, max_length=50),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    term = q.strip()
    if len(term) < 2:
        return []

    pattern = f"%{_escape_like(term)}%"
    rows = (
        db.query(ListeModel, UserModel.username)
        .join(UserModel, UserModel.id == ListeModel.users_id)
        .filter(
            ListeModel.public.is_(True),  # une liste privée ne peut jamais sortir
            ListeModel.items_count > 0,
            or_(
                ListeModel.liste_title.ilike(pattern, escape="\\"),
                UserModel.username.ilike(pattern, escape="\\"),
            ),
        )
        .order_by(ListeModel.created_at.desc(), ListeModel.id.desc())
        .limit(limit)
        .all()
    )
    if not rows:
        return []

    # Une seule requête pour les pochettes (4 max par liste)
    list_ids = [user_list.id for user_list, _ in rows]
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
        }
        for user_list, username in rows
    ]

# ---------------------------------------------------------
# GET /api/lists/public/{list_id} : détail d'une liste publique
# ---------------------------------------------------------
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
        "games": [{"id": g.id, "titre": g.titre, "image": g.image} for g in games],
    }


# =========================================================
# GESTION DES LISTES (authentification requise)
# =========================================================

# ---------------------------------------------------------
# POST /api/lists/ : créer une liste
# ---------------------------------------------------------
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


# ---------------------------------------------------------
# PATCH /api/lists/{list_id} : modifier titre / visibilité
# ---------------------------------------------------------
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


# ---------------------------------------------------------
# DELETE /api/lists/{list_id} : supprimer une liste et ses items
# ---------------------------------------------------------
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

    # 1. Supprimer tous les items de la liste (la propriété est déjà vérifiée ci-dessus)
    db.query(ListeItemModel).filter(ListeItemModel.id_list == list_id).delete()

    # 2. Supprimer la liste elle-même
    db.delete(user_list)
    db.commit()

    return None

