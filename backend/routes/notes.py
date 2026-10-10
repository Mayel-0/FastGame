from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel
from models.notes import NoteCreateSchema, NoteLikeModel, NoteModel, NoteOut, NoteUpdateSchema, RankedGameOut
from models.users import UserModel
from routes.users import get_current_user, get_optional_current_user

router = APIRouter(
    prefix="/api/notes",
    tags=["Notes"],
)


def _get_owned_note(db: Session, note_id: int, user_id: int, action: str) -> NoteModel:
    note = db.query(NoteModel).filter(NoteModel.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note introuvable.",
        )

    if note.id_user != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tu ne peux pas {action} cette note.",
        )
    return note


def _note_likes_count(db: Session, note_id: int) -> int:
    return (
        db.query(func.count(NoteLikeModel.user_id))
        .filter(NoteLikeModel.note_id == note_id)
        .scalar()
        or 0
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


@router.get("/top", response_model=list[RankedGameOut])
def get_top_rated_games(
    limit: int = Query(10, ge=1, le=50),
    min_ratings: int = Query(3, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_ranked_games(db, best_first=True, limit=limit, min_ratings=min_ratings)


@router.get("/worst", response_model=list[RankedGameOut])
def get_worst_rated_games(
    limit: int = Query(10, ge=1, le=50),
    min_ratings: int = Query(3, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_ranked_games(db, best_first=False, limit=limit, min_ratings=min_ratings)


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
        db.query(NoteModel, UserModel.username, UserModel.image_url)
        .join(UserModel, UserModel.id == NoteModel.id_user)
        .filter(NoteModel.id_game == game_id)
        .order_by(NoteModel.id.desc())
        .all()
    )

    note_ids = [note.id for note, _, _ in notes_query]
    like_counts = dict(
        db.query(NoteLikeModel.note_id, func.count(NoteLikeModel.user_id))
        .filter(NoteLikeModel.note_id.in_(note_ids))
        .group_by(NoteLikeModel.note_id)
        .all()
    ) if note_ids else {}
    liked_ids = {
        note_id
        for (note_id,) in db.query(NoteLikeModel.note_id).filter(
            NoteLikeModel.user_id == current_user.id,
            NoteLikeModel.note_id.in_(note_ids),
        )
    } if current_user is not None and note_ids else set()

    notes = [
        {
            "id": note.id,
            "id_game": note.id_game,
            "id_user": note.id_user,
            "username": username,
            "image_url": image_url,
            "value": note.value,
            "body": note.body,
            "created_at": note.created_at,
            "updated_at": note.updated_at,
            "likes_count": like_counts.get(note.id, 0),
            "liked_by_me": note.id in liked_ids,
        }
        for note, username, image_url in notes_query
    ]

    current_user_id = current_user.id if current_user is not None else None
    notes.sort(key=lambda item: (item["id_user"] != current_user_id, -item["likes_count"], -item["id"]))

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


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: int,
    note_data: NoteUpdateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Modifie la valeur ou le commentaire d'une note de l'utilisateur connecté."""
    note = _get_owned_note(db, note_id, current_user.id, "modifier")

    if note_data.value is not None:
        note.value = note_data.value
    if "body" in note_data.model_fields_set:
        note.body = note_data.body or None
    note.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(note)

    return {
        "id": note.id,
        "id_game": note.id_game,
        "id_user": note.id_user,
        "username": current_user.username,
        "image_url": current_user.image_url,
        "value": note.value,
        "body": note.body,
        "created_at": note.created_at,
        "updated_at": note.updated_at,
        "likes_count": _note_likes_count(db, note.id),
        "liked_by_me": False,
    }


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_note(
    note_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Supprime une note créée par l'utilisateur connecté."""
    note = _get_owned_note(db, note_id, current_user.id, "supprimer")

    db.query(NoteLikeModel).filter(NoteLikeModel.note_id == note_id).delete()
    db.delete(note)
    db.commit()
    return None


@router.post("/{note_id}/like", status_code=status.HTTP_201_CREATED)
def like_note(
    note_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Like l'avis d'un autre joueur."""
    note = db.query(NoteModel).filter(NoteModel.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note introuvable.")

    if note.id_user == current_user.id:
        raise HTTPException(status_code=400, detail="Tu ne peux pas liker ta propre note.")

    if not db.get(NoteLikeModel, (current_user.id, note_id)):
        db.add(NoteLikeModel(user_id=current_user.id, note_id=note_id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()

    return {"liked": True, "likes_count": _note_likes_count(db, note_id)}


@router.delete("/{note_id}/like")
def unlike_note(
    note_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retire son like d'un avis."""
    db.query(NoteLikeModel).filter(
        NoteLikeModel.user_id == current_user.id,
        NoteLikeModel.note_id == note_id,
    ).delete(synchronize_session=False)
    db.commit()

    return {"liked": False, "likes_count": _note_likes_count(db, note_id)}
