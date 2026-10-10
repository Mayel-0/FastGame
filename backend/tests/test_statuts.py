import os
import unittest

os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-secret-key-for-local-tests-that-is-long-enough-1234567890abcxyz",
)

from fastapi.testclient import TestClient

from main import app
from models.game import GameModel
from tests.helpers import auth_headers, create_test_session, create_user


class GameStatusTests(unittest.TestCase):
    def setUp(self):
        self.SessionLocal = create_test_session()
        self.alice_id = create_user(self.SessionLocal, "alice")

        db = self.SessionLocal()
        db.add(GameModel(id=1, titre="Portal 2", genre="Puzzle"))
        db.commit()
        db.close()

        self.client = TestClient(app, base_url="http://localhost")
        self.alice = auth_headers(self.client, "alice")

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_set_then_replace_status(self):
        response = self.client.put("/api/statuts/1", json={"statut": "en_cours"}, headers=self.alice)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["statut"], "en_cours")

        self.client.put("/api/statuts/1", json={"statut": "termine"}, headers=self.alice)

        mine = self.client.get("/api/statuts/me", headers=self.alice).json()
        self.assertEqual(len(mine), 1)
        self.assertEqual(mine[0]["statut"], "termine")

    def test_unknown_status_is_rejected(self):
        response = self.client.put("/api/statuts/1", json={"statut": "perdu"}, headers=self.alice)

        self.assertEqual(response.status_code, 422, response.text)

    def test_unknown_game_returns_404(self):
        response = self.client.put("/api/statuts/999", json={"statut": "a_faire"}, headers=self.alice)

        self.assertEqual(response.status_code, 404, response.text)

    def test_public_library_lists_games_with_status(self):
        self.client.put("/api/statuts/1", json={"statut": "termine"}, headers=self.alice)

        response = self.client.get(f"/api/statuts/user/{self.alice_id}")

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()[0]["titre"], "Portal 2")
        self.assertEqual(response.json()[0]["statut"], "termine")

    def test_remove_status(self):
        self.client.put("/api/statuts/1", json={"statut": "a_faire"}, headers=self.alice)

        response = self.client.delete("/api/statuts/1", headers=self.alice)

        self.assertEqual(response.status_code, 204, response.text)
        self.assertEqual(self.client.get("/api/statuts/me", headers=self.alice).json(), [])


if __name__ == "__main__":
    unittest.main()
