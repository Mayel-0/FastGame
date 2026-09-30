from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel
from models.notes import NoteModel, RankedGameOut
from models.users import UserModel
from routes.users import get_current_user
from utils.security import ALGORITHM, SECRET_KEY


class NoteCreateSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    id_game: int = Field(..., gt=0)
    value: int = Field(..., ge=0, le=5)
    # Le commentaire est visible par toute la communauté : on le borne
    body: str | None = Field(default=None, max_length=1000)


router = APIRouter(
    prefix="/api/notes",
    tags=["Notes"],
)
security = HTTPBearer(auto_error=False)


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
):
    if credentials is None:
        return None

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            return None
        return db.query(UserModel).filter(UserModel.email == email).first()
    except JWTError:
        return None


def attach_game_notes(db: Session, games: list[GameModel]) -> list[GameModel]:
    if not games:
        return games

    rows = (
        db.query(GameModel, func.avg(NoteModel.value).label("note_moyenne"))
        .outerjoin(NoteModel, NoteModel.id_game == GameModel.id)
        .filter(GameModel.id.in_([game.id for game in games]))
        .group_by(GameModel.id)
        .all()
    )

    averages_by_game_id = {
        game.id: round(float(avg), 2) if avg is not None else None
        for game, avg in rows
    }

    for game in games:
        avg = averages_by_game_id.get(game.id)
        game.note = avg
        game.note_moyenne = avg

    return games


def get_ranked_games(
    db: Session,
    best_first: bool,
    limit: int,
    min_ratings: int,
) -> list[dict]:
    """Classement des jeux par note moyenne.

    min_ratings évite qu'un jeu avec une seule note (1/5 ou 5/5) domine le
    classement. À égalité de moyenne, le jeu avec le plus de notes passe devant.
    """
    avg_rating = func.avg(NoteModel.value)
    ratings_count = func.count(NoteModel.id)

    rows = (
        db.query(
            GameModel.id,
            GameModel.titre,
            GameModel.image,
            avg_rating.label("avg_rating"),
            ratings_count.label("ratings_count"),
        )
        .join(NoteModel, NoteModel.id_game == GameModel.id)
        .group_by(GameModel.id, GameModel.titre, GameModel.image)
        .having(ratings_count >= min_ratings)
        .order_by(
            avg_rating.desc() if best_first else avg_rating.asc(),
            ratings_count.desc(),
            GameModel.id,
        )
        .limit(limit)
        .all()
    )

    return [
        {
            "id": game_id,
            "titre": titre,
            "image": image,
            "avg_rating": round(float(avg), 2),
            "ratings_count": count,
        }
        for game_id, titre, image, avg, count in rows
    ]


# =========================================================
# ROUTES PUBLIQUES (page Communauté, sans authentification)
# =========================================================

# ---------------------------------------------------------
# GET /api/notes/top : jeux les mieux notés
# ---------------------------------------------------------
@router.get("/top", response_model=list[RankedGameOut])
def get_top_rated_games(
    limit: int = Query(10, ge=1, le=50),
    min_ratings: int = Query(3, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_ranked_games(db, best_first=True, limit=limit, min_ratings=min_ratings)


# ---------------------------------------------------------
# GET /api/notes/worst : jeux les moins bien notés
# ---------------------------------------------------------
@router.get("/worst", response_model=list[RankedGameOut])
def get_worst_rated_games(
    limit: int = Query(10, ge=1, le=50),
    min_ratings: int = Query(3, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_ranked_games(db, best_first=False, limit=limit, min_ratings=min_ratings)


# =========================================================
# ROUTES PAR JEU / PAR NOTE
# =========================================================

@router.get("/game/{game_id}")
def get_game_note(
    game_id: int,
    current_user: UserModel | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    game = db.query(GameModel).filter(GameModel.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucun jeu trouvé avec l'ID {game_id}.",
        )

    notes_query = (
        db.query(NoteModel, UserModel.username)
        .join(UserModel, UserModel.id == NoteModel.id_user)
        .filter(NoteModel.id_game == game_id)
        .order_by(NoteModel.id.desc())
        .all()
    )

    notes = [
        {
            "id": note.id,
            "id_game": note.id_game,
            "id_user": note.id_user,
            "username": username,
            "value": note.value,
            "body": note.body,
        }
        for note, username in notes_query
    ]

    if current_user is not None:
        notes.sort(key=lambda item: (item["id_user"] != current_user.id, -item["id"]))
    else:
        notes.sort(key=lambda item: item["id"], reverse=True)

    average_note = round(
        sum(item["value"] for item in notes) / len(notes),
        2,
    ) if notes else None

    user_note = None
    if current_user is not None:
        user_note = next(
            (item for item in notes if item["id_user"] == current_user.id),
            None,
        )

    enriched_game = attach_game_notes(db, [game])[0]
    return {
        "game": enriched_game,
        "average_note": average_note,
        "notes": notes,
        "user_note": user_note,
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_note(
    note_data: NoteCreateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ajoute une note pour un jeu par l'utilisateur connecté."""
    game = db.query(GameModel).filter(GameModel.id == note_data.id_game).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jeu introuvable.",
        )

    existing_note = db.query(NoteModel).filter(
        NoteModel.id_game == note_data.id_game,
        NoteModel.id_user == current_user.id,
    ).first()

    if existing_note:
        raise HTTPException(
            status_code=400,
            detail="Tu as déjà noté ce jeu. Supprime ou modifie ta note existante.",
        )

    new_note = NoteModel(
        id_game=note_data.id_game,
        id_user=current_user.id,
        value=note_data.value,
        body=note_data.body,
    )

    db.add(new_note)
    try:
        db.commit()
    except IntegrityError:
        # Requête simultanée : la contrainte unique (id_game, id_user) a bloqué le doublon
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Tu as déjà noté ce jeu. Supprime ou modifie ta note existante.",
        )
    db.refresh(new_note)

    return {
        "message": "Note ajoutée avec succès.",
        "note_id": new_note.id,
        "id_game": new_note.id_game,
        "value": new_note.value,
    }


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_note(
    note_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Supprime une note créée par l'utilisateur connecté."""
    note = db.query(NoteModel).filter(NoteModel.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note introuvable.",
        )

    if note.id_user != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu ne peux pas supprimer cette note.",
        )

    db.delete(note)
    db.commit()
    return None
