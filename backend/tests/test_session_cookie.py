import os
import unittest

os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-secret-key-for-local-tests-that-is-long-enough-1234567890",
)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from db.database import Base
from models.game import GameModel
from models.likes_list import ListeLikeModel
from models.lists import ListeItemModel, ListeModel
from models.notes import NoteModel
from models.users import UserModel
from routes.users import get_db
from utils.security import hash_password


class JwtAuthTests(unittest.TestCase):
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
            image_url="/api/media/avatars/alice.webp",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        self.user_id = user.id
        db.close()

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_login_returns_jwt_and_bearer_auth_works(self):
        client = TestClient(app, base_url="http://localhost")

        response = client.post(
            "/api/users/login",
            json={"email": "alice@example.com", "password": "secret123"},
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertIn("access_token", response.json())
        token = response.json()["access_token"]

        profile_response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(profile_response.status_code, 200, profile_response.text)
        self.assertEqual(profile_response.json()["email"], "alice@example.com")

        without_token_response = client.get("/api/users/me")
        self.assertEqual(without_token_response.status_code, 401)

    def test_public_profile_returns_username_and_avatar_without_email(self):
        client = TestClient(app, base_url="http://localhost")

        response = client.get(f"/api/users/{self.user_id}")

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["username"], "alice")
        self.assertEqual(response.json()["image_url"], "/api/media/avatars/alice.webp")
        self.assertNotIn("email", response.json())

    def test_random_public_lists_include_owner_profile_data(self):
        db = self.SessionLocal()
        game = GameModel(titre="Test Game", image="/game.jpg")
        public_list = ListeModel(id=1, users_id=self.user_id, liste_title="À jouer", public=True, items_count=1)
        db.add_all([game, public_list])
        db.commit()
        db.refresh(game)
        db.add(ListeItemModel(id_list=public_list.id, id_item=game.id, id_user=self.user_id))
        db.add(ListeLikeModel(user_id=self.user_id, liste_id=public_list.id))
        db.commit()
        db.close()

        client = TestClient(app, base_url="http://localhost")
        response = client.get("/api/lists/public/random?limit=1")

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["owner_id"], self.user_id)
        self.assertEqual(response.json()[0]["owner"], "alice")
        self.assertEqual(response.json()[0]["owner_image_url"], "/api/media/avatars/alice.webp")
        self.assertEqual(response.json()[0]["likes_count"], 1)

        search_response = client.get("/api/lists/public/search")
        self.assertEqual(search_response.status_code, 200, search_response.text)
        self.assertEqual(search_response.json()[0]["likes_count"], 1)

    def test_game_notes_include_author_profile_image(self):
        db = self.SessionLocal()
        game = GameModel(titre="Test Game")
        db.add(game)
        db.commit()
        db.refresh(game)
        game_id = game.id
        db.add(NoteModel(id_game=game.id, id_user=self.user_id, value=5, body="Très bien"))
        db.commit()
        db.close()

        client = TestClient(app, base_url="http://localhost")
        response = client.get(f"/api/notes/game/{game_id}")

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["notes"][0]["username"], "alice")
        self.assertEqual(response.json()["notes"][0]["image_url"], "/api/media/avatars/alice.webp")

    def test_token_stays_valid_after_email_change(self):
        client = TestClient(app, base_url="http://localhost")
        login_response = client.post(
            "/api/users/login",
            json={"email": "alice@example.com", "password": "secret123"},
        )
        headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

        update_response = client.patch(
            "/api/users/me",
            json={"email": "Alice.New@example.com"},
            headers=headers,
        )
        self.assertEqual(update_response.status_code, 200, update_response.text)
        self.assertEqual(update_response.json()["email"], "alice.new@example.com")

        profile_response = client.get("/api/users/me", headers=headers)
        self.assertEqual(profile_response.status_code, 200, profile_response.text)
        self.assertEqual(profile_response.json()["email"], "alice.new@example.com")

    def test_followers_details_do_not_expose_email(self):
        db = self.SessionLocal()
        bob = UserModel(email="bob@example.com", password=hash_password("secret123"), username="bob")
        db.add(bob)
        db.commit()
        db.close()

        client = TestClient(app, base_url="http://localhost")
        bob_token = client.post(
            "/api/users/login",
            json={"email": "bob@example.com", "password": "secret123"},
        ).json()["access_token"]
        follow_response = client.post(
            "/api/abonnements/",
            json={"follow_id": self.user_id},
            headers={"Authorization": f"Bearer {bob_token}"},
        )
        self.assertEqual(follow_response.status_code, 201, follow_response.text)

        alice_token = client.post(
            "/api/users/login",
            json={"email": "alice@example.com", "password": "secret123"},
        ).json()["access_token"]
        response = client.get(
            "/api/abonnements/me/followers/details",
            headers={"Authorization": f"Bearer {alice_token}"},
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()[0]["user"]["username"], "bob")
        self.assertNotIn("email", response.json()[0]["user"])


if __name__ == "__main__":
    unittest.main()
