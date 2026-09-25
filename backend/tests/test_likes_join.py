import os
import unittest

os.environ["JWT_SECRET_KEY"] = (
    "test-secret-key-for-local-tests-that-is-long-enough-1234567890abcxyz"
)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from db.database import Base
from models.game import GameModel
from models.likes import LikeModel
from models.notes import NoteModel
from models.users import UserModel
from routes.users import get_db
from utils.security import hash_password


class LikesRouteTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

        def override_get_db():
            db = self.SessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db

        db = self.SessionLocal()
        user = UserModel(
            email="alice@example.com",
            password=hash_password("secret123"),
            username="alice",
            bio="hello",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        self.user_id = user.id

        game = GameModel(
            id=123,
            titre="Portal 2",
            studio="Valve",
            plateforme="PC",
            annee="2011",
            genre="Shooter",
            image="https://example.com/portal2.jpg",
            url="https://example.com/portal2",
        )
        db.add(game)
        db.commit()

        like = LikeModel(user_id=self.user_id, game_id=123)
        db.add(like)
        db.commit()
        db.close()

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_get_my_likes_returns_game_details_with_game_id(self):
        client = TestClient(app, base_url="http://localhost")
        login_response = client.post(
            "/api/users/login",
            json={"email": "alice@example.com", "password": "secret123"},
        )
        self.assertEqual(login_response.status_code, 200, login_response.text)

        token = login_response.json()["access_token"]
        response = client.get(
            "/api/likes/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["game_id"], 123)
        self.assertEqual(payload[0]["titre"], "Portal 2")

    def test_get_game_by_id_returns_average_note_from_notes_table(self):
        db = self.SessionLocal()
        db.add_all([
            NoteModel(id_game=123, id_user=self.user_id, value=5),
            NoteModel(id_game=123, id_user=self.user_id + 1, value=4),
        ])
        db.commit()
        db.close()

        client = TestClient(app, base_url="http://localhost")
        response = client.get("/api/jeux/id/123")

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["note"], 4.5)
        self.assertEqual(response.json()["note_moyenne"], 4.5)

    def test_get_game_notes_returns_all_user_notes(self):
        db = self.SessionLocal()
        second_user = UserModel(
            email="bob@example.com",
            password=hash_password("secret123"),
            username="bob",
            bio="second user",
        )
        db.add(second_user)
        db.commit()
        db.refresh(second_user)
        db.add_all([
            NoteModel(id_game=123, id_user=self.user_id, value=5, body="Excellent jeu"),
            NoteModel(id_game=123, id_user=second_user.id, value=3, body="Très bon"),
        ])
        db.commit()
        db.close()

        client = TestClient(app, base_url="http://localhost")
        login_response = client.post(
            "/api/users/login",
            json={"email": "alice@example.com", "password": "secret123"},
        )
        token = login_response.json()["access_token"]

        response = client.get(
            "/api/notes/game/123",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertEqual(payload["average_note"], 4.0)
        self.assertEqual(len(payload["notes"]), 2)
        self.assertEqual(payload["notes"][0]["username"], "alice")
        self.assertEqual(payload["notes"][0]["value"], 5)


if __name__ == "__main__":
    unittest.main()
