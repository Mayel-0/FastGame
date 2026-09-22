from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from models.likes import LikeModel, LikeSchema

router = APIRouter(
    prefix="/api/likes",
    tags=["Likes"]
)

@router.get("/", response_model=List[LikeSchema])
def get_likes_sorted_by_id(db: Session = Depends(get_db)):
    """Récupère tous les likes triés par ID croissant"""
    likes = db.query(LikeModel).order_by(LikeModel.id.asc()).all()
    
    if not likes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun like trouvé."
        )
        
    return likes