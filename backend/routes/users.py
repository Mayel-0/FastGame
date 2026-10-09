from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import and_, distinct, func
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from db.database import get_db
from models.notes import NoteModel
from models.likes_list import ListeLikeModel
from models.lists import ListeModel
from models.users import PublicUserSchema, TopUserSchema, UserModel, UserSchema, UserCreateSchema, UserUpdateSchema, UserLoginSchema, TokenSchema
from utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM,
)

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

security = HTTPBearer(auto_error=False)


def get_user_from_token(token: str, db: Session) -> UserModel | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        return None
    return db.get(UserModel, user_id)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security), db: Session = Depends(get_db)):
    user = get_user_from_token(credentials.credentials, db) if credentials else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Impossible de valider les identifiants",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security), db: Session = Depends(get_db)):
    if credentials is None:
        return None
    return get_user_from_token(credentials.credentials, db)


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreateSchema, db: Session = Depends(get_db)):
    user_data.email = user_data.email.strip().lower()
    user_data.username = user_data.username.strip()
    if not user_data.username:
        raise HTTPException(status_code=400, detail="Le nom d'utilisateur est obligatoire.")

    if db.query(UserModel).filter(UserModel.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")

    if db.query(UserModel).filter(UserModel.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur est déjà pris.")

    new_user = UserModel(
        email=user_data.email,
        password=hash_password(user_data.password),
        username=user_data.username,
        bio=user_data.bio
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=TokenSchema)
def login_user(user_data: UserLoginSchema, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == user_data.email.strip().lower()).first()
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.", headers={"WWW-Authenticate": "Bearer"})

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserSchema)
def get_my_profile(current_user: UserModel = Depends(get_current_user)):
    """Récupère uniquement les infos de l'utilisateur connecté via son token"""
    return current_user


@router.get("/top", response_model=list[TopUserSchema])
def get_top_users(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Classe les créateurs selon les likes reçus sur leurs listes publiques."""
    rows = (
        db.query(
            UserModel.id,
            UserModel.username,
            UserModel.image_url,
            func.count(distinct(ListeModel.id)).label("public_lists_count"),
            func.count(ListeLikeModel.user_id).label("likes_received"),
        )
        .join(
            ListeModel,
            and_(
                ListeModel.users_id == UserModel.id,
                ListeModel.public.is_(True),
            ),
        )
        .outerjoin(ListeLikeModel, ListeLikeModel.liste_id == ListeModel.id)
        .group_by(UserModel.id, UserModel.username, UserModel.image_url)
        .order_by(
            func.count(ListeLikeModel.user_id).desc(),
            func.count(distinct(ListeModel.id)).desc(),
            UserModel.username.asc(),
        )
        .limit(limit)
        .all()
    )
    return [
        {
            "id": row.id,
            "username": row.username,
            "image_url": row.image_url,
            "public_lists_count": row.public_lists_count,
            "likes_received": row.likes_received,
        }
        for row in rows
    ]


@router.get("/{user_id}", response_model=PublicUserSchema)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    return user


@router.get("/{user_id}/notes")
def get_user_with_notes(user_id: int, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    notes = db.query(NoteModel).filter(NoteModel.id_user == user_id).all()

    return {
        "user": {
            "id": user.id,
            "created_at": user.created_at,
            "username": user.username,
            "bio": user.bio,
        },
        "notes": [
            {
                "id": note.id,
                "id_game": note.id_game,
                "id_user": note.id_user,
                "value": note.value,
                "body": note.body,
            }
            for note in notes
        ],
    }


@router.patch("/me", response_model=UserSchema)
def update_my_profile(user_data: UserUpdateSchema, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Met à jour le profil de l'utilisateur connecté"""
    if "email" in user_data.model_fields_set and user_data.email is not None:
        email = user_data.email.strip().lower()
        existing_email = db.query(UserModel).filter(UserModel.email == email, UserModel.id != current_user.id).first()
        if existing_email:
            raise HTTPException(status_code=409, detail="Cet email est déjà utilisé.")
        current_user.email = email

    if "username" in user_data.model_fields_set and user_data.username is not None:
        username = user_data.username.strip()
        if not username:
            raise HTTPException(status_code=400, detail="Le nom d'utilisateur est obligatoire.")
        existing_username = db.query(UserModel).filter(UserModel.username == username, UserModel.id != current_user.id).first()
        if existing_username:
            raise HTTPException(status_code=409, detail="Ce nom d'utilisateur est déjà pris.")
        current_user.username = username

    if "bio" in user_data.model_fields_set:
        current_user.bio = user_data.bio

    if "password" in user_data.model_fields_set and user_data.password:
        current_user.password = hash_password(user_data.password)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_profile(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Supprime le compte de l'utilisateur connecté"""
    db.delete(current_user)
    db.commit()
    return None
