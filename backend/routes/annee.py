from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from models.game import GameModel, GameSchema

router = APIRouter(
    prefix="/api/jeux",
    tags=["Jeux"]
)

@router.get("/annee/{annee}", response_model=List[GameSchema])
def get_games_by_annee(annee: str, db: Session = Depends(get_db)):
    """Récupère les jeux par leur année (ex: /api/jeux/annee/2000)"""
    # On cherche en comparant directement les chaînes de caractères pour éviter l'erreur de type
    games = db.query(GameModel).filter(GameModel.annee == annee).all()

    if not games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucun jeu trouvé pour l'année {annee}."
        )
        
    return games