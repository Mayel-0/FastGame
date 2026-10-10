import os
import unittest

os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-secret-key-for-local-tests-that-is-long-enough-1234567890abcxyz",
)

from fastapi.testclient import TestClient

from main import app
from models.game import GameModel
from models.lists import ListeModel
from models.notes import NoteModel
from tests.helpers import auth_headers, create_test_session, create_user


class NotificationTests(unittest.TestCase):
    def setUp(self):
        self.SessionLocal = create_test_session()
        self.alice_id = create_user(self.SessionLocal, "alice")
        self.bob_id = create_user(self.SessionLocal, "bob")

        db = self.SessionLocal()
        db.add(GameModel(id=1, titre="Portal 2"))
        db.add(ListeModel(id=1, users_id=self.alice_id, liste_title="À jouer", public=True, items_count=0))
        db.add(NoteModel(id=1, id_game=1, id_user=self.alice_id, value=5))
        db.commit()
        db.close()

        self.client = TestClient(app, base_url="http://localhost")
        self.alice = auth_headers(self.client, "alice")
        self.bob = auth_headers(self.client, "bob")

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_follow_list_like_and_note_like_notify_the_owner(self):
        self.client.post("/api/abonnements/", json={"follow_id": self.alice_id}, headers=self.bob)
        self.client.post("/api/lists/1/like", headers=self.bob)
        self.client.post("/api/notes/1/like", headers=self.bob)

        response = self.client.get("/api/notifications/", headers=self.alice)

        self.assertEqual(response.status_code, 200, response.text)
        notifications = response.json()
        self.assertEqual(
            [item["type"] for item in notifications],
            ["like_note", "like_liste", "abonnement"],
        )
        self.assertTrue(all(item["actor"]["username"] == "bob" for item in notifications))
        self.assertEqual(notifications[0]["game"]["titre"], "Portal 2")
        self.assertEqual(notifications[1]["liste"]["title"], "À jouer")
        self.assertEqual(self.client.get("/api/notifications/", headers=self.bob).json(), [])

    def test_unread_count_and_mark_as_read(self):
        self.client.post("/api/lists/1/like", headers=self.bob)
        count = self.client.get("/api/notifications/unread-count", headers=self.alice).json()
        self.assertEqual(count, {"count": 1})

        response = self.client.patch("/api/notifications/lues", headers=self.alice)

        self.assertEqual(response.status_code, 204, response.text)
        count = self.client.get("/api/notifications/unread-count", headers=self.alice).json()
        self.assertEqual(count, {"count": 0})
        self.assertTrue(self.client.get("/api/notifications/", headers=self.alice).json()[0]["lue"])

    def test_repeated_likes_do_not_duplicate_unread_notifications(self):
        self.client.post("/api/lists/1/like", headers=self.bob)
        self.client.delete("/api/lists/1/like", headers=self.bob)
        self.client.post("/api/lists/1/like", headers=self.bob)

        notifications = self.client.get("/api/notifications/", headers=self.alice).json()

        self.assertEqual(len(notifications), 1)


if __name__ == "__main__":
    unittest.main()
