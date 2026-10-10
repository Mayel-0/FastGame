import os
import unittest

os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-secret-key-for-local-tests-that-is-long-enough-1234567890abcxyz",
)

from fastapi.testclient import TestClient

from main import app
from models.abonnement import Abonnement
from models.game import GameModel
from models.likes import LikeModel
from models.lists import ListeModel
from models.notes import NoteModel
from tests.helpers import create_test_session, create_user


class UserStatsTests(unittest.TestCase):
    def setUp(self):
        self.SessionLocal = create_test_session()
        self.alice_id = create_user(self.SessionLocal, "alice")
        self.bob_id = create_user(self.SessionLocal, "bob")
        self.client = TestClient(app, base_url="http://localhost")

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_stats_aggregate_ratings_likes_lists_and_followers(self):
        db = self.SessionLocal()
        db.add_all([
            GameModel(id=1, titre="Portal 2", genre="Puzzle"),
            GameModel(id=2, titre="The Witness", genre="Puzzle"),
            GameModel(id=3, titre="Doom", genre="Shooter"),
        ])
        db.commit()
        db.add_all([
            NoteModel(id_game=1, id_user=self.alice_id, value=5),
            NoteModel(id_game=3, id_user=self.alice_id, value=2),
            LikeModel(user_id=self.alice_id, game_id=2),
            LikeModel(user_id=self.alice_id, game_id=3),
            ListeModel(users_id=self.alice_id, liste_title="Publique", public=True),
            ListeModel(users_id=self.alice_id, liste_title="Privée", public=False),
            Abonnement(user_id=self.bob_id, follow_id=self.alice_id),
        ])
        db.commit()
        db.close()

        response = self.client.get(f"/api/users/{self.alice_id}/stats")

        self.assertEqual(response.status_code, 200, response.text)
        stats = response.json()
        self.assertEqual(stats["ratings_count"], 2)
        self.assertEqual(stats["average_rating"], 3.5)
        self.assertEqual(stats["likes_count"], 2)
        self.assertEqual(stats["public_lists_count"], 1)
        self.assertEqual(stats["followers_count"], 1)
        self.assertEqual(stats["following_count"], 0)
        self.assertEqual(stats["favorite_genre"], "Puzzle")
        self.assertEqual(stats["ratings_distribution"][0], {"value": 5, "count": 1})

    def test_stats_of_user_without_activity(self):
        response = self.client.get(f"/api/users/{self.bob_id}/stats")

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["ratings_count"], 0)
        self.assertIsNone(response.json()["average_rating"])
        self.assertIsNone(response.json()["favorite_genre"])

    def test_stats_of_unknown_user_returns_404(self):
        response = self.client.get("/api/users/999/stats")

        self.assertEqual(response.status_code, 404, response.text)


if __name__ == "__main__":
    unittest.main()
