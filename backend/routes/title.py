from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from db.database import get_db
from models.game import GameModel, GameSchema
from routes.notes import attach_game_notes

router = APIRouter(
    prefix="/api/jeux",
    tags=["Jeux"]
)


@router.get("/search/{title}", response_model=List[GameSchema])
def search_games_by_title(title: str, db: Session = Depends(get_db)):
    """Recherche des jeux par leur titre (gère les espaces et la casse)"""
    search_query = title.replace(" ", "")

    games = db.query(GameModel).filter(
        func.replace(GameModel.titre, ' ', '').ilike(f"%{search_query}%")
    ).all()

    if not games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucun jeu trouvé avec le titre '{title}'."
        )

    return attach_game_notes(db, games)