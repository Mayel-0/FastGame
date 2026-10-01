from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import get_db
from models.users import UserModel
from models.abonnement import (
    Abonnement as AbonnementModel,
    AbonnementCreateSchema,
    AbonnementResponseSchema,
)
from routes.users import get_current_user

router = APIRouter(prefix="/api/abonnements", tags=["abonnements"])


# ---------------------------------------------------------
# 1. POST /api/abonnements/ - S'abonner à un utilisateur
# ---------------------------------------------------------
@router.post("/", response_model=AbonnementResponseSchema, status_code=status.HTTP_201_CREATED)
def follow_user(
    abonnement_data: AbonnementCreateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Abonne l'utilisateur connecté à un autre utilisateur."""

    # 1. Empêcher l'auto-abonnement
    if current_user.id == abonnement_data.follow_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas vous abonner à vous-même."
        )

    # 2. Vérifier si l'utilisateur cible existe
    target_user = db.query(UserModel).filter(UserModel.id == abonnement_data.follow_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="L'utilisateur que vous souhaitez suivre n'existe pas."
        )

    # 3. Vérifier si l'abonnement existe déjà
    existing = db.query(AbonnementModel).filter(
        AbonnementModel.user_id == current_user.id,
        AbonnementModel.follow_id == abonnement_data.follow_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous êtes déjà abonné à cet utilisateur."
        )

    # 4. Créer l'abonnement
    new_abonnement = AbonnementModel(
        user_id=current_user.id,
        follow_id=abonnement_data.follow_id
    )

    db.add(new_abonnement)
    db.commit()
    db.refresh(new_abonnement)

    return new_abonnement


# ---------------------------------------------------------
# 2. DELETE /api/abonnements/{follow_id} - Se désabonner
# ---------------------------------------------------------
@router.delete("/{follow_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(
    follow_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime l'abonnement vers un utilisateur."""

    abonnement = db.query(AbonnementModel).filter(
        AbonnementModel.user_id == current_user.id,
        AbonnementModel.follow_id == follow_id
    ).first()

    if not abonnement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Abonnement introuvable."
        )

    db.delete(abonnement)
    db.commit()

    return None
