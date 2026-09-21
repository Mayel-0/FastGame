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

@router.get("/plateforme/{plateforme}", response_model=List[GameSchema])
def get_games_by_plateforme(plateforme: str, db: Session = Depends(get_db)):
    """Récupère les jeux par leur plateforme (gère les espaces et la casse)"""
    # On enlève les espaces de la recherche de l'utilisateur
    search_query = plateforme.replace(" ", "")
    
    # On compare en supprimant aussi les espaces côté base de données
    games = db.query(GameModel).filter(
        func.replace(GameModel.plateforme, ' ', '').ilike(f"%{search_query}%")
    ).all()

    if not games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucun jeu trouvé pour la plateforme '{plateforme}'."
        )
        
    return games