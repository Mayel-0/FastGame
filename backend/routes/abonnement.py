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

router = APIRouter(prefix="/api/abonnements", tags=["Abonnements"])


def _serialize_with_user(abonnement: AbonnementModel, user: UserModel) -> dict:
    return {
        "abonnement_id": abonnement.id,
        "abonned_at": abonnement.abonned_at,
        "user": {
            "id": user.id,
            "username": user.username,
            "image_url": user.image_url,
        },
    }


@router.get("/me/following", response_model=list[AbonnementResponseSchema])
def get_my_following(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère la liste de tous les abonnements de l'utilisateur connecté."""
    return db.query(AbonnementModel).filter(
        AbonnementModel.user_id == current_user.id
    ).all()


@router.get("/me/followers/details")
def get_my_followers_with_users(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère les abonnés avec les données de profil des personnes qui me suivent."""
    results = (
        db.query(AbonnementModel, UserModel)
        .join(UserModel, AbonnementModel.user_id == UserModel.id)
        .filter(AbonnementModel.follow_id == current_user.id)
        .all()
    )
    return [_serialize_with_user(abonnement, user) for abonnement, user in results]


@router.get("/me/followers", response_model=list[AbonnementResponseSchema])
def get_my_followers(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère la liste de tous les abonnés de l'utilisateur connecté."""
    return db.query(AbonnementModel).filter(
        AbonnementModel.follow_id == current_user.id
    ).all()


@router.get("/me/following/details")
def get_my_following_with_users(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère les abonnements avec les données du profil de la personne suivie."""
    results = (
        db.query(AbonnementModel, UserModel)
        .join(UserModel, AbonnementModel.follow_id == UserModel.id)
        .filter(AbonnementModel.user_id == current_user.id)
        .all()
    )
    return [_serialize_with_user(abonnement, user) for abonnement, user in results]


@router.post("/", response_model=AbonnementResponseSchema, status_code=status.HTTP_201_CREATED)
def follow_user(
    abonnement_data: AbonnementCreateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Abonne l'utilisateur connecté à un autre utilisateur."""
    if current_user.id == abonnement_data.follow_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas vous abonner à vous-même."
        )

    target_user = db.query(UserModel).filter(UserModel.id == abonnement_data.follow_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="L'utilisateur que vous souhaitez suivre n'existe pas."
        )

    existing = db.query(AbonnementModel).filter(
        AbonnementModel.user_id == current_user.id,
        AbonnementModel.follow_id == abonnement_data.follow_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous êtes déjà abonné à cet utilisateur."
        )

    new_abonnement = AbonnementModel(
        user_id=current_user.id,
        follow_id=abonnement_data.follow_id
    )

    db.add(new_abonnement)
    db.commit()
    db.refresh(new_abonnement)

    return new_abonnement


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
