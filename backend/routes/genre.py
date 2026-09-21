from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from db.database import get_db
from models.game import GameModel, GameSchema

router = APIRouter(
    prefix="/api/jeux",
    tags=["Jeux"]
)

@router.get("/genre/{genre}", response_model=List[GameSchema])
def get_games_by_genre(genre: str, db: Session = Depends(get_db)):
    """Récupère les jeux par leur genre (gère les espaces et la casse, ex: /api/jeux/genre/simulation)"""
    search_query = genre.replace(" ", "")
    
    games = db.query(GameModel).filter(
        func.replace(GameModel.genre, ' ', '').ilike(f"%{search_query}%")
    ).all()

    if not games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucun jeu trouvé pour le genre '{genre}'."
        )
        
    return games