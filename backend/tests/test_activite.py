import os
import unittest
from datetime import datetime, timedelta, timezone

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
from tests.helpers import auth_headers, create_test_session, create_user


class ActivityFeedTests(unittest.TestCase):
    def setUp(self):
        self.SessionLocal = create_test_session()
        self.alice_id = create_user(self.SessionLocal, "alice")
        self.bob_id = create_user(self.SessionLocal, "bob")
        self.carol_id = create_user(self.SessionLocal, "carol")

        now = datetime.now(timezone.utc)
        db = self.SessionLocal()
        db.add(GameModel(id=1, titre="Portal 2"))
        db.commit()
        db.add_all([
            Abonnement(user_id=self.alice_id, follow_id=self.bob_id),
            NoteModel(id_game=1, id_user=self.bob_id, value=5, body="Top", created_at=now - timedelta(hours=3)),
            LikeModel(user_id=self.bob_id, game_id=1, created_at=now - timedelta(hours=2)),
            ListeModel(users_id=self.bob_id, liste_title="À jouer", public=True, created_at=now - timedelta(hours=1)),
            ListeModel(users_id=self.bob_id, liste_title="Secrète", public=False, created_at=now),
            NoteModel(id_game=1, id_user=self.carol_id, value=1, created_at=now),
        ])
        db.commit()
        db.close()

        self.client = TestClient(app, base_url="http://localhost")

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_feed_lists_followed_users_activity_newest_first(self):
        response = self.client.get("/api/activite/", headers=auth_headers(self.client, "alice"))

        self.assertEqual(response.status_code, 200, response.text)
        feed = response.json()
        self.assertEqual([item["type"] for item in feed], ["liste", "like", "note"])
        self.assertEqual(feed[0]["liste"]["title"], "À jouer")
        self.assertEqual(feed[2]["note_value"], 5)
        self.assertTrue(all(item["user"]["username"] == "bob" for item in feed))

    def test_feed_is_paginated(self):
        response = self.client.get(
            "/api/activite/?limit=1&offset=1",
            headers=auth_headers(self.client, "alice"),
        )

        self.assertEqual([item["type"] for item in response.json()], ["like"])

    def test_feed_is_empty_without_subscriptions(self):
        response = self.client.get("/api/activite/", headers=auth_headers(self.client, "carol"))

        self.assertEqual(response.json(), [])


if __name__ == "__main__":
    unittest.main()
