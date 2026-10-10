from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel
from models.statuts import LibraryGameOut, StatutJeuModel, StatutResponseSchema, StatutUpdateSchema
from models.users import UserModel
from routes.users import get_current_user

router = APIRouter(
    prefix="/api/statuts",
    tags=["Statuts"],
)


@router.get("/me", response_model=list[StatutResponseSchema])
def get_my_statuts(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Récupère le statut de chaque jeu suivi par l'utilisateur connecté."""
    return db.query(StatutJeuModel).filter(StatutJeuModel.user_id == current_user.id).all()


@router.get("/user/{user_id}", response_model=list[LibraryGameOut])
def get_user_library(user_id: int, db: Session = Depends(get_db)):
    """Récupère la bibliothèque d'un joueur : ses jeux avec leur statut."""
    if not db.get(UserModel, user_id):
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    rows = (
        db.query(StatutJeuModel, GameModel)
        .join(GameModel, GameModel.id == StatutJeuModel.game_id)
        .filter(StatutJeuModel.user_id == user_id)
        .order_by(StatutJeuModel.updated_at.desc(), GameModel.id)
        .all()
    )

    return [
        {
            "id": game.id,
            "titre": game.titre,
            "studio": game.studio,
            "plateforme": game.plateforme,
            "annee": game.annee,
            "genre": game.genre,
            "image": game.image,
            "url": game.url,
            "statut": entry.statut,
            "updated_at": entry.updated_at,
        }
        for entry, game in rows
    ]


@router.put("/{game_id}", response_model=StatutResponseSchema)
def set_statut(
    game_id: int,
    statut_data: StatutUpdateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Définit ou remplace le statut d'un jeu pour l'utilisateur connecté."""
    if not db.get(GameModel, game_id):
        raise HTTPException(status_code=404, detail="Jeu introuvable.")

    entry = db.get(StatutJeuModel, (current_user.id, game_id))
    if entry:
        entry.statut = statut_data.statut
    else:
        entry = StatutJeuModel(user_id=current_user.id, game_id=game_id, statut=statut_data.statut)
        db.add(entry)
    entry.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_statut(
    game_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retire un jeu de la bibliothèque de l'utilisateur connecté."""
    entry = db.get(StatutJeuModel, (current_user.id, game_id))
    if not entry:
        raise HTTPException(status_code=404, detail="Ce jeu n'est pas dans ta bibliothèque.")

    db.delete(entry)
    db.commit()
    return None
