import os
import unittest

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-local-tests")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from db.database import Base
from models.users import UserModel
from routes.users import get_db
from utils.security import hash_password


class SessionCookieAuthTests(unittest.TestCase):
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
        db.close()

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_login_sets_session_cookie_with_user_id_and_cookie_auth_works(self):
        client = TestClient(app)

        response = client.post(
            "/api/users/login",
            json={"email": "alice@example.com", "password": "secret123"},
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertIn("access_token", response.json())
        self.assertIn("fastgame_session", response.cookies)
        self.assertEqual(response.cookies["fastgame_session"], str(self.user_id))

        profile_response = client.get(
            "/api/users/me",
            cookies={"fastgame_session": str(self.user_id)},
        )

        self.assertEqual(profile_response.status_code, 200, profile_response.text)
        self.assertEqual(profile_response.json()["email"], "alice@example.com")


if __name__ == "__main__":
    unittest.main()
