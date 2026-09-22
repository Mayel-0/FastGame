from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from db.database import get_db
from models.users import UserModel, UserSchema, UserCreateSchema, UserLoginSchema, TokenSchema
from utils.security import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

# Utilisation de HTTPBearer pour un champ de token simple et direct dans Swagger
security = HTTPBearer()

# Fonction utilitaire pour récupérer l'utilisateur connecté grâce à son token
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# 1. INSCRIPTION (POST) -> Hache le mot de passe
@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreateSchema, db: Session = Depends(get_db)):
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

# 2. CONNEXION (POST) -> Renvoie un Token JWT au Front-end
@router.post("/login", response_model=TokenSchema)
def login_user(user_data: UserLoginSchema, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=400, detail="Email ou mot de passe incorrect.")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# 3. GET MON PROFIL (Sécurisé)
@router.get("/me", response_model=UserSchema)
def get_my_profile(current_user: UserModel = Depends(get_current_user)):
    """Récupère uniquement les infos de l'utilisateur connecté via son token"""
    return current_user

# 4. MODIFIER MON PROFIL (Sécurisé)
@router.put("/me", response_model=UserSchema)
def update_my_profile(user_data: UserCreateSchema, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Met à jour le profil de l'utilisateur connecté"""
    current_user.email = user_data.email
    current_user.username = user_data.username
    current_user.bio = user_data.bio
    if user_data.password:
        current_user.password = hash_password(user_data.password)

    db.commit()
    db.refresh(current_user)
    return current_user

# 5. SUPPRIMER MON PROFIL (Sécurisé)
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_profile(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Supprime le compte de l'utilisateur connecté"""
    db.delete(current_user)
    db.commit()
    return None