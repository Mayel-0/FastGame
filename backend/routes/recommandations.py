from collections import Counter

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel, RecommendedGameOut
from models.likes import LikeModel
from models.notes import NoteModel
from models.users import UserModel
from routes.notes import attach_game_notes
from routes.users import get_current_user

router = APIRouter(
    prefix="/api/jeux",
    tags=["Jeux"]
)

IGNORED_VALUES = {"", "unknown"}


def _count_values(values: list[str | None]) -> Counter:
    return Counter(
        value for value in values
        if value and value.strip().lower() not in IGNORED_VALUES
    )


@router.get("/recommandations", response_model=list[RecommendedGameOut])
def get_recommended_games(
    limit: int = Query(8, ge=1, le=24),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Propose des jeux proches de ceux que l'utilisateur a likés (même genre ou même studio)."""
    liked_games = (
        db.query(GameModel)
        .join(LikeModel, LikeModel.game_id == GameModel.id)
        .filter(LikeModel.user_id == current_user.id)
        .all()
    )
    if not liked_games:
        return []

    genres = _count_values([game.genre for game in liked_games])
    studios = _count_values([game.studio for game in liked_games])
    if not genres and not studios:
        return []

    rated_ids = [
        game_id
        for (game_id,) in db.query(NoteModel.id_game).filter(NoteModel.id_user == current_user.id)
    ]
    excluded_ids = {game.id for game in liked_games} | set(rated_ids)

    candidates = (
        db.query(GameModel)
        .filter(
            GameModel.id.notin_(excluded_ids),
            or_(GameModel.genre.in_(genres.keys()), GameModel.studio.in_(studios.keys())),
        )
        .all()
    )
    attach_game_notes(db, candidates)

    def score(game: GameModel) -> tuple:
        affinity = genres.get(game.genre, 0) + 2 * studios.get(game.studio, 0)
        return (-affinity, -(game.note_moyenne or 0), game.id)

    return [
        {
            "id": game.id,
            "titre": game.titre,
            "studio": game.studio,
            "plateforme": game.plateforme,
            "annee": game.annee,
            "genre": game.genre,
            "image": game.image,
            "url": game.url,
            "note": game.note,
            "note_moyenne": game.note_moyenne,
            "raison": (
                f"Du studio {game.studio}"
                if game.studio in studios
                else f"Parce que tu aimes le genre {game.genre}"
            ),
        }
        for game in sorted(candidates, key=score)[:limit]
    ]
