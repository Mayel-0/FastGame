from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.game import GameModel, GameSchema

router = APIRouter(
    prefix="/api/jeux",
    tags=["Jeux"]
)

@router.get("/{game_id}", response_model=GameSchema)
def get_game_by_id(game_id: int, db: Session = Depends(get_db)):
    """Récupère un jeu spécifique par son ID"""
    game = db.query(GameModel).filter(GameModel.id == game_id).first()
    
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Le jeu avec l'ID {game_id} n'existe pas."
        )
        
    return game