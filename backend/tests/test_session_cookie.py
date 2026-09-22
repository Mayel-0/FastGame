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
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        self.user_id = user.id
        db.close()

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_login_returns_jwt_and_bearer_auth_works(self):
        client = TestClient(app)

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


if __name__ == "__main__":
    unittest.main()
