import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv
from jose import JWTError, jwt
import bcrypt

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY est manquante dans backend/.env")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Le token expire au bout de 24h
SESSION_COOKIE_NAME = "fastgame_session"
SESSION_COOKIE_TTL_SECONDS = 12 * 60 * 60


def set_session_cookie(response, user_id: int):
    expires = datetime.now(timezone.utc) + timedelta(seconds=SESSION_COOKIE_TTL_SECONDS)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=str(user_id),
        max_age=SESSION_COOKIE_TTL_SECONDS,
        expires=expires,
        path="/",
        httponly=True,
        samesite="lax",
        secure=False,
    )

def hash_password(password: str):
    # On encode en bytes et on gère la limite de bcrypt (72 octets max)
    pwd_bytes = password.encode('utf-8')[:72]
    hashed = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    pwd_bytes = plain_password.encode('utf-8')[:72]
    return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
