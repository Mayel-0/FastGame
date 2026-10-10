from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from db.database import Base, get_db
from models.users import UserModel
from utils.security import hash_password

PASSWORD = "secret123"


def create_test_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    return session_factory


def create_user(session_factory, username: str) -> int:
    db = session_factory()
    user = UserModel(
        email=f"{username}@example.com",
        password=hash_password(PASSWORD),
        username=username,
    )
    db.add(user)
    db.commit()
    user_id = user.id
    db.close()
    return user_id


def auth_headers(client: TestClient, username: str) -> dict[str, str]:
    response = client.post(
        "/api/users/login",
        json={"email": f"{username}@example.com", "password": PASSWORD},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
