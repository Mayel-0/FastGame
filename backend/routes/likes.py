from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.likes import LikeModel, LikeCreateSchema
from models.users import UserModel
from routes.users import get_current_user  # On importe ta fonction de sécurité existante

router = APIRouter(
    prefix="/api/likes",
    tags=["Likes"]
)

# 1. AJOUTER UN LIKE (POST)
@router.post("/", status_code=status.HTTP_201_CREATED)
def add_like(
    like_data: LikeCreateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permet à l'utilisateur connecté d'ajouter un like sur un jeu"""

    # Vérifier si l'utilisateur a déjà liké ce jeu (pour éviter les doublons)
    existing_like = db.query(LikeModel).filter(
        LikeModel.user_id == current_user.id,
        LikeModel.post_id == like_data.game_id
    ).first()

    if existing_like:
        raise HTTPException(status_code=400, detail="Tu as déjà liké ce jeu.")

    # Créer le like en associant l'ID de l'utilisateur connecté
    new_like = LikeModel(
        user_id=current_user.id,
        post_id=like_data.game_id
    )

    db.add(new_like)
    db.commit()
    db.refresh(new_like)

    return {"message": "Like ajouté avec succès", "like_id": new_like.id}

# 2. SUPPRIMER UN LIKE (DELETE)
@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_like(
    game_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permet à l'utilisateur connecté de retirer son like d'un jeu"""

    # Trouver le like correspondant à cet utilisateur et à ce jeu
    like = db.query(LikeModel).filter(
        LikeModel.user_id == current_user.id,
        LikeModel.post_id == game_id
    ).first()

    if not like:
        raise HTTPException(status_code=404, detail="Like introuvable pour ce jeu.")

    db.delete(like)
    db.commit()
    return None
