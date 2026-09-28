from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.favoris import FavorisModel, FavorisCreateSchema, FavorisResponseSchema
from models.game import GameModel
from models.users import UserModel
from routes.users import get_current_user

router = APIRouter(prefix="/api/favoris", tags=["favoris"])

@router.get("/me/games")
def get_my_favoris_with_games(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les favoris de l'utilisateur avec les détails de chaque jeu."""
    results = (
        db.query(FavorisModel, GameModel)
        .join(GameModel, FavorisModel.post_id == GameModel.id)
        .filter(FavorisModel.user_id == current_user.id)
        .all()
    )

    favoris_games = []
    for fav, game in results:
        favoris_games.append({
            "favori_id": fav.id,
            "game_id": game.id,
            "titre": game.titre,
            "studio": game.studio,
            "plateforme": game.plateforme,
            "annee": game.annee,
            "genre": game.genre,
            "image": game.image,
            "url": game.url,
        })

    return favoris_games

# ---------------------------------------------------------
# 1. GET /api/favoris/me - Obtenir la liste des favoris de l'utilisateur
# ---------------------------------------------------------
@router.get("/me", response_model=list[FavorisResponseSchema])
def get_my_favoris(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les favoris de l'utilisateur connecté."""
    favoris = db.query(FavorisModel).filter(
        FavorisModel.user_id == current_user.id
    ).all()

    return favoris


# ---------------------------------------------------------
# 2. POST /api/favoris/ - Ajouter un jeu/post aux favoris
# ---------------------------------------------------------
@router.post("/", response_model=FavorisResponseSchema, status_code=status.HTTP_201_CREATED)
def add_favori(
    favori_data: FavorisCreateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ajoute un élément aux favoris s'il n'y est pas déjà."""
    # Vérifier si le favori existe déjà
    existing = db.query(FavorisModel).filter(
        FavorisModel.user_id == current_user.id,
        FavorisModel.post_id == favori_data.post_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet élément est déjà dans vos favoris."
        )

    new_favori = FavorisModel(
        user_id=current_user.id,
        post_id=favori_data.post_id
    )

    db.add(new_favori)
    db.commit()
    db.refresh(new_favori)

    return new_favori


# ---------------------------------------------------------
# 3. DELETE /api/favoris/{post_id} - Retirer un élément des favoris
# ---------------------------------------------------------
@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favori(
    post_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime un élément des favoris de l'utilisateur."""
    favori = db.query(FavorisModel).filter(
        FavorisModel.user_id == current_user.id,
        FavorisModel.post_id == post_id
    ).first()

    if not favori:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favori introuvable."
        )

    db.delete(favori)
    db.commit()

    return None
