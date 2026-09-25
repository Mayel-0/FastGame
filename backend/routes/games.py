from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel, GameSchema
from routes.notes import attach_game_notes

router = APIRouter(
    prefix="/api/jeux",
    tags=["Jeux"]
)


@router.get("/", response_model=list[GameSchema])
def get_all_games(db: Session = Depends(get_db)):
    """Récupère la liste de tous les jeux stockés dans Supabase"""
    games = db.query(GameModel).all()
    return attach_game_notes(db, games)