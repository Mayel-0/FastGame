from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.database import get_db
from models.game import GameModel
from models.likes import LikeCreateSchema, LikedGameOut, LikeModel
from models.users import UserModel
from routes.users import get_current_user

router = APIRouter(
    prefix="/api/likes",
    tags=["Likes"]
)


def serialize_like_with_game(like: LikeModel, game: GameModel | None = None):
    game_data = game or GameModel()
    return {
        "id": like.id,
        "user_id": like.user_id,
        "game_id": like.game_id,
        "created_at": like.created_at.isoformat() if like.created_at else None,
        "titre": game_data.titre,
        "studio": game_data.studio,
        "plateforme": game_data.plateforme,
        "annee": game_data.annee,
        "genre": game_data.genre,
        "image": game_data.image,
        "url": game_data.url,
    }


@router.get("/top", response_model=list[LikedGameOut])
def get_most_liked_games(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Classement des jeux par nombre de likes (à égalité : ordre stable par id)."""
    likes_count = func.count(LikeModel.id)

    rows = (
        db.query(
            GameModel.id,
            GameModel.titre,
            GameModel.image,
            likes_count.label("likes"),
        )
        .join(LikeModel, LikeModel.game_id == GameModel.id)
        .group_by(GameModel.id, GameModel.titre, GameModel.image)
        .order_by(likes_count.desc(), GameModel.id)
        .limit(limit)
        .all()
    )

    return [
        {"id": game_id, "titre": titre, "image": image, "likes": likes}
        for game_id, titre, image, likes in rows
    ]


@router.get("/me")
def get_my_likes(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère la liste des jeux likés de l'utilisateur connecté, avec le jeu associé."""
    likes = (
        db.query(LikeModel, GameModel)
        .join(GameModel, GameModel.id == LikeModel.game_id)
        .filter(LikeModel.user_id == current_user.id)
        .all()
    )
    return [serialize_like_with_game(like, game) for like, game in likes]


@router.get("/user/{user_id}")
def get_user_likes(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Récupère la liste des jeux likés par un utilisateur donné."""
    likes = (
        db.query(LikeModel, GameModel)
        .join(GameModel, GameModel.id == LikeModel.game_id)
        .filter(LikeModel.user_id == user_id)
        .all()
    )
    return [serialize_like_with_game(like, game) for like, game in likes]


@router.get("/{game_id}")
def get_like_status(
    game_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    like = db.query(LikeModel).filter(
        LikeModel.user_id == current_user.id,
        LikeModel.game_id == game_id,
    ).first()
    return {"liked": like is not None}


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_like(
    like_data: LikeCreateSchema,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permet à l'utilisateur connecté d'ajouter un like sur un jeu"""

    if not db.get(GameModel, like_data.game_id):
        raise HTTPException(status_code=404, detail="Jeu introuvable.")

    existing_like = db.query(LikeModel).filter(
        LikeModel.user_id == current_user.id,
        LikeModel.game_id == like_data.game_id
    ).first()

    if existing_like:
        raise HTTPException(status_code=400, detail="Tu as déjà liké ce jeu.")

    new_like = LikeModel(
        user_id=current_user.id,
        game_id=like_data.game_id
    )

    db.add(new_like)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Tu as déjà liké ce jeu.")
    db.refresh(new_like)

    return {"message": "Like ajouté avec succès", "like_id": new_like.id}


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_like(
    game_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permet à l'utilisateur connecté de retirer son like d'un jeu"""

    like = db.query(LikeModel).filter(
        LikeModel.user_id == current_user.id,
        LikeModel.game_id == game_id
    ).first()

    if not like:
        raise HTTPException(status_code=404, detail="Like introuvable pour ce jeu.")

    db.delete(like)
    db.commit()
    return None


@router.get("/game/{game_id}")
def get_game_likes(
    game_id: int,
    db: Session = Depends(get_db)
):
    """Permet de récupérer le nombre total de likes et la liste pour un jeu donné"""
    likes = db.query(LikeModel).filter(LikeModel.game_id == game_id).all()
    return {
        "game_id": game_id,
        "total_likes": len(likes),
        "likes": [
            {
                "id": like.id,
                "user_id": like.user_id,
                "game_id": like.game_id,
                "created_at": like.created_at.isoformat() if like.created_at else None,
            }
            for like in likes
        ],
    }
