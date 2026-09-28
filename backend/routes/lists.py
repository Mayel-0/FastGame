from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.lists import ListeModel, ListeItemModel, ListItemCreateSchema, ListeCreateSchema, ListeUpdateSchema
from models.game import GameModel
from models.users import UserModel
from routes.users import get_current_user

router = APIRouter(
    prefix="/api/lists",
    tags=["Lists"]
)

# ---------------------------------------------------------
# 1. GET /me/lists : Récupère uniquement les listes créées par l'utilisateur
# ---------------------------------------------------------
@router.get("/me")
def get_my_lists(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir toutes les listes créées par l'utilisateur connecté."""
    lists = db.query(ListeModel).filter(ListeModel.users_id == current_user.id).all()
    return lists


# ---------------------------------------------------------
# 2. GET /me/items : Récupère tous les enregistrements de la table liste_items de l'utilisateur
# ---------------------------------------------------------
@router.get("/me/items")
def get_my_list_items(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir tous les éléments bruts de la table liste_items pour l'utilisateur connecté."""
    items = db.query(ListeItemModel).filter(ListeItemModel.id_user == current_user.id).all()
    return items


# ---------------------------------------------------------
# 3. GET /me/joined : Récupère la liste + les jeux associés (JOIN liste, liste_items, jeux)
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
        # Récupération des jeux joints à cette liste
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
# 4. POST /me/items : Ajouter un jeu dans une liste spécifique
# ---------------------------------------------------------
@router.post("/me/items", status_code=status.HTTP_201_CREATED)
def add_item_to_list(
    item_data: ListItemCreateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ajouter un jeu dans une liste appartenant à l'utilisateur connecté."""
    # Vérifier que la liste existe et appartient à l'utilisateur
    user_list = db.query(ListeModel).filter(
        ListeModel.id == item_data.list_id,
        ListeModel.users_id == current_user.id
    ).first()

    if not user_list:
        raise HTTPException(status_code=404, detail="Liste introuvable ou accès non autorisé.")

    # Vérifier si l'élément n'est pas déjà dans la liste
    existing_item = db.query(ListeItemModel).filter(
        ListeItemModel.id_item == item_data.game_id,
        ListeItemModel.id_list == item_data.list_id,
        ListeItemModel.id_user == current_user.id
    ).first()

    if existing_item:
        raise HTTPException(status_code=400, detail="Ce jeu est déjà présent dans cette liste.")

    # Création du nouvel élément
    new_item = ListeItemModel(
        id_item=item_data.game_id,
        id_list=item_data.list_id,
        id_user=current_user.id
    )

    # Mise à jour du compteur d'items de la liste
    user_list.items_count = (user_list.items_count or 0) + 1

    db.add(new_item)
    db.commit()

    return {"message": "Jeu ajouté à la liste avec succès"}


# ---------------------------------------------------------
# 5. DELETE /me/items/{list_id}/{game_id} : Supprimer un jeu d'une liste
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

    # Mettre à jour le compteur de la liste
    user_list = db.query(ListeModel).filter(ListeModel.id == list_id).first()
    if user_list and user_list.items_count > 0:
        user_list.items_count -= 1

    db.delete(item)
    db.commit()

    return None


# ---------------------------------------------------------
# 1. POST /api/lists/ - Créer une nouvelle liste
# ---------------------------------------------------------
@router.post("/", status_code=status.HTTP_201_CREATED)
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
# 2. PATCH /api/lists/{list_id} - Modifier le titre ou la visibilité d'une liste
# ---------------------------------------------------------
@router.patch("/{list_id}")
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

    # Application des modifications seulement si les champs sont fournis
    if list_data.liste_title is not None:
        user_list.liste_title = list_data.liste_title
    if list_data.public is not None:
        user_list.public = list_data.public

    db.commit()
    db.refresh(user_list)

    return user_list


# ---------------------------------------------------------
# 3. DELETE /api/lists/{list_id} - Supprimer une liste et ses items
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

    # 1. Supprimer tous les items associés dans liste_items
    db.query(ListeItemModel).filter(
        ListeItemModel.id_list == list_id,
        ListeItemModel.id_user == current_user.id
    ).delete()

    # 2. Supprimer la liste elle-même
    db.delete(user_list)
    db.commit()

    return None
