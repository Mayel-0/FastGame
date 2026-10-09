from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel, GameSchema
from routes.notes import attach_game_notes

router = APIRouter(
    prefix="/api/jeux",
    tags=["Jeux"]
)


@router.get("/id/{game_id}", response_model=GameSchema)
def get_game_by_id(game_id: int, db: Session = Depends(get_db)):
    """Récupère un jeu par son ID (ex: /api/jeux/id/4)"""
    game = db.query(GameModel).filter(GameModel.id == game_id).first()

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucun jeu trouvé avec l'ID {game_id}."
        )

    return attach_game_notes(db, [game])[0]
