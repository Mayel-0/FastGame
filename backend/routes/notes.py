from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel, GameSchema
from models.notes import NoteModel
from models.users import UserModel
from routes.users import get_current_user


class NoteCreateSchema(BaseModel):
    id_game: int = Field(..., gt=0)
    value: int = Field(..., ge=0, le=5)
    body: str | None = None

router = APIRouter(
    prefix="/api/notes",
    tags=["Notes"],
)


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


@router.get("/game/{game_id}", response_model=GameSchema)
def get_game_note(game_id: int, db: Session = Depends(get_db)):
    game = (
        db.query(GameModel, func.avg(NoteModel.value).label("note_moyenne"))
        .outerjoin(NoteModel, NoteModel.id_game == GameModel.id)
        .filter(GameModel.id == game_id)
        .group_by(GameModel.id)
        .first()
    )

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucun jeu trouvé avec l'ID {game_id}.",
        )

    game_model, note_average = game
    game_model.note = round(float(note_average), 2) if note_average is not None else None
    game_model.note_moyenne = game_model.note
    return game_model


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
