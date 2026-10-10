import os
import unittest

os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-secret-key-for-local-tests-that-is-long-enough-1234567890abcxyz",
)

from fastapi.testclient import TestClient

from main import app
from models.game import GameModel
from models.notes import NoteModel
from tests.helpers import auth_headers, create_test_session, create_user


class NoteEditAndLikeTests(unittest.TestCase):
    def setUp(self):
        self.SessionLocal = create_test_session()
        self.alice_id = create_user(self.SessionLocal, "alice")
        self.bob_id = create_user(self.SessionLocal, "bob")

        db = self.SessionLocal()
        db.add(GameModel(id=1, titre="Portal 2"))
        db.add(NoteModel(id=1, id_game=1, id_user=self.alice_id, value=3, body="Bien"))
        db.add(NoteModel(id=2, id_game=1, id_user=self.bob_id, value=5, body="Excellent"))
        db.commit()
        db.close()

        self.client = TestClient(app, base_url="http://localhost")
        self.alice = auth_headers(self.client, "alice")
        self.bob = auth_headers(self.client, "bob")

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_owner_can_update_note(self):
        response = self.client.patch(
            "/api/notes/1",
            json={"value": 4, "body": "Finalement très bien"},
            headers=self.alice,
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["value"], 4)
        self.assertEqual(response.json()["body"], "Finalement très bien")
        self.assertIsNotNone(response.json()["updated_at"])

    def test_other_user_cannot_update_note(self):
        response = self.client.patch("/api/notes/1", json={"value": 0}, headers=self.bob)

        self.assertEqual(response.status_code, 403, response.text)

    def test_like_and_unlike_note(self):
        like_response = self.client.post("/api/notes/2/like", headers=self.alice)
        self.assertEqual(like_response.status_code, 201, like_response.text)
        self.assertEqual(like_response.json(), {"liked": True, "likes_count": 1})

        details = self.client.get("/api/notes/game/1", headers=self.alice).json()
        bob_note = next(note for note in details["notes"] if note["id"] == 2)
        self.assertEqual(bob_note["likes_count"], 1)
        self.assertTrue(bob_note["liked_by_me"])

        unlike_response = self.client.delete("/api/notes/2/like", headers=self.alice)
        self.assertEqual(unlike_response.json(), {"liked": False, "likes_count": 0})

    def test_cannot_like_own_note(self):
        response = self.client.post("/api/notes/1/like", headers=self.alice)

        self.assertEqual(response.status_code, 400, response.text)

    def test_deleting_a_liked_note_removes_it(self):
        self.client.post("/api/notes/2/like", headers=self.alice)

        response = self.client.delete("/api/notes/2", headers=self.bob)

        self.assertEqual(response.status_code, 204, response.text)
        details = self.client.get("/api/notes/game/1").json()
        self.assertEqual([note["id"] for note in details["notes"]], [1])


if __name__ == "__main__":
    unittest.main()
