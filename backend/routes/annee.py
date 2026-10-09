from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.game import GameModel, GameSchema
from routes.notes import attach_game_notes

router = APIRouter(
    prefix="/api/jeux",
    tags=["Jeux"]
)


@router.get("/annee/{annee}", response_model=list[GameSchema])
def get_games_by_annee(annee: str, db: Session = Depends(get_db)):
    """Récupère les jeux par leur année (ex: /api/jeux/annee/2000)"""
    games = db.query(GameModel).filter(GameModel.annee == annee).all()

    if not games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucun jeu trouvé pour l'année {annee}."
        )

    return attach_game_notes(db, games)
