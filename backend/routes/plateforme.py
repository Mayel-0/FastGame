from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from models.game import GameModel, GameSchema
from routes.notes import attach_game_notes

router = APIRouter(
    prefix="/api/jeux",
    tags=["Jeux"]
)


@router.get("/plateforme/{plateforme}", response_model=list[GameSchema])
def get_games_by_plateforme(plateforme: str, db: Session = Depends(get_db)):
    """Récupère les jeux par leur plateforme (gère les espaces et la casse)"""
    search_query = plateforme.replace(" ", "")

    games = db.query(GameModel).filter(
        func.replace(GameModel.plateforme, ' ', '').ilike(f"%{search_query}%")
    ).all()

    if not games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucun jeu trouvé pour la plateforme '{plateforme}'."
        )

    return attach_game_notes(db, games)
