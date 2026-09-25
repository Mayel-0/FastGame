from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel, GameSchema
from models.notes import NoteModel
from models.users import UserModel
from routes.users import get_current_user
from utils.security import ALGORITHM, SECRET_KEY


class NoteCreateSchema(BaseModel):
    id_game: int = Field(..., gt=0)
    value: int = Field(..., ge=0, le=5)
    body: str | None = None

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
    db.commit()
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
