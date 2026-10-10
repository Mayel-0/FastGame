import os
import unittest

os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-secret-key-for-local-tests-that-is-long-enough-1234567890abcxyz",
)

from fastapi.testclient import TestClient

from main import app
from models.game import GameModel
from models.likes import LikeModel
from models.notes import NoteModel
from tests.helpers import auth_headers, create_test_session, create_user


class RecommendationTests(unittest.TestCase):
    def setUp(self):
        self.SessionLocal = create_test_session()
        self.alice_id = create_user(self.SessionLocal, "alice")
        self.bob_id = create_user(self.SessionLocal, "bob")

        db = self.SessionLocal()
        db.add_all([
            GameModel(id=1, titre="Portal", genre="Puzzle", studio="Valve"),
            GameModel(id=2, titre="Portal 2", genre="Puzzle", studio="Valve"),
            GameModel(id=3, titre="The Witness", genre="Puzzle", studio="Thekla"),
            GameModel(id=4, titre="Doom", genre="Shooter", studio="id Software"),
            GameModel(id=5, titre="Baba Is You", genre="Puzzle", studio="Unknown"),
        ])
        db.commit()
        db.add(LikeModel(user_id=self.alice_id, game_id=1))
        db.add(NoteModel(id_game=5, id_user=self.alice_id, value=4))
        db.commit()
        db.close()

        self.client = TestClient(app, base_url="http://localhost")

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_recommends_same_studio_first_then_same_genre(self):
        response = self.client.get(
            "/api/jeux/recommandations",
            headers=auth_headers(self.client, "alice"),
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual([game["id"] for game in response.json()], [2, 3])
        self.assertEqual(response.json()[0]["raison"], "Du studio Valve")
        self.assertEqual(response.json()[1]["raison"], "Parce que tu aimes le genre Puzzle")

    def test_user_without_likes_gets_no_recommendation(self):
        response = self.client.get(
            "/api/jeux/recommandations",
            headers=auth_headers(self.client, "bob"),
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json(), [])

    def test_recommendations_require_authentication(self):
        response = self.client.get("/api/jeux/recommandations")

        self.assertEqual(response.status_code, 401, response.text)


if __name__ == "__main__":
    unittest.main()
