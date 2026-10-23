import os
import sqlite3
import tempfile

import pytest
from fastapi.testclient import TestClient

DEMO = {"email": "user@example.com", "password": "password"}


@pytest.fixture
def client():
    from main import app
    with TestClient(app) as c:
        yield c


def register(client, name="Ada Lovelace", email="ada@example.com", password="analytical1"):
    return client.post("/api/register", json={"name": name, "email": email, "password": password})


def login(client, email, password):
    return client.post("/api/login", json={"email": email, "password": password})


# --- Password hashing ---

def test_hash_round_trip():
    from db import hash_password, verify_password

    stored = hash_password("correct horse")
    assert stored.startswith("scrypt$")
    assert "correct horse" not in stored
    assert verify_password("correct horse", stored)
    assert not verify_password("wrong", stored)


def test_hashes_use_a_random_salt():
    from db import hash_password

    assert hash_password("same") != hash_password("same")


def test_unhashed_value_never_verifies():
    from db import verify_password

    assert not verify_password("password", "password")


# --- Migration ---

def test_migration_upgrades_legacy_users_table():
    """An old database with plaintext passwords gains profile columns and hashed passwords."""
    import db

    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    try:
        conn = sqlite3.connect(path)
        conn.executescript("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO users (username, password_hash) VALUES ('user', 'password');
        """)
        conn.close()

        os.environ["DB_PATH"] = path
        db.close_db_connection()
        db.init_db()
        db.init_db()  # running twice must be safe

        user = db.get_user_by_email("user@example.com")
        assert user is not None
        assert user["name"] == "Demo User"
        assert db.verify_password("password", user["password_hash"])
    finally:
        db.close_db_connection()
        os.unlink(path)


# --- Registration ---

def test_register_creates_user_and_signs_in(client):
    resp = register(client)
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    assert data["user"]["email"] == "ada@example.com"
    assert data["user"]["name"] == "Ada Lovelace"
    assert "password_hash" not in data["user"]

    status = client.get("/api/auth/status").json()
    assert status["authenticated"] is True
    assert status["user"]["email"] == "ada@example.com"


def test_new_user_gets_sample_project_and_board(client):
    register(client)
    projects = client.get("/api/projects").json()["projects"]
    assert len(projects) == 1
    assert projects[0]["title"] == "My Projects"
    # Slugs are unique across all users, so the demo user's "MyProjects" forces a suffix
    assert projects[0]["slug"].startswith("MyProjects")

    boards = client.get(f"/api/projects/{projects[0]['id']}/boards").json()["boards"]
    assert len(boards) == 1


def test_new_user_can_log_in_with_their_password(client):
    register(client)
    client.post("/api/logout")
    assert login(client, "ada@example.com", "analytical1").status_code == 200


def test_register_duplicate_email_is_rejected(client):
    register(client)
    resp = register(client, email="ADA@example.com")
    assert resp.status_code == 409


def test_register_cannot_take_demo_email(client):
    resp = register(client, email="user@example.com")
    assert resp.status_code == 409


@pytest.mark.parametrize(
    "payload",
    [
        {"name": "", "email": "ada@example.com", "password": "analytical1"},
        {"name": "x" * 101, "email": "ada@example.com", "password": "analytical1"},
        {"name": "Ada", "email": "not-an-email", "password": "analytical1"},
        {"name": "Ada", "email": "ada@example.com", "password": "short"},
        {"email": "ada@example.com", "password": "analytical1"},
    ],
)
def test_register_validation(client, payload):
    resp = client.post("/api/register", json=payload)
    assert resp.status_code == 400


# --- Profile ---

def test_get_profile_requires_auth(client):
    assert client.get("/api/profile").status_code == 401


def test_get_profile_returns_current_user(client):
    login(client, **DEMO)
    resp = client.get("/api/profile")
    assert resp.status_code == 200
    assert resp.json()["user"]["email"] == "user@example.com"


def test_update_profile_name(client):
    login(client, **DEMO)
    resp = client.patch("/api/profile", json={"name": "Kaustav"})
    assert resp.status_code == 200
    assert resp.json()["user"]["name"] == "Kaustav"
    assert client.get("/api/auth/status").json()["user"]["name"] == "Kaustav"


def test_update_profile_email_keeps_session_and_can_log_in_again(client):
    login(client, **DEMO)
    resp = client.patch("/api/profile", json={"email": "new@example.com"})
    assert resp.status_code == 200
    assert client.get("/api/auth/status").json()["user"]["email"] == "new@example.com"

    client.post("/api/logout")
    assert login(client, "new@example.com", "password").status_code == 200
    assert login(client, "user@example.com", "password").status_code == 401


def test_update_profile_email_taken_is_rejected(client):
    register(client)
    client.post("/api/logout")
    login(client, **DEMO)
    resp = client.patch("/api/profile", json={"email": "ada@example.com"})
    assert resp.status_code == 409


def test_update_profile_keeps_own_email(client):
    login(client, **DEMO)
    resp = client.patch("/api/profile", json={"email": "user@example.com", "name": "Demo"})
    assert resp.status_code == 200


def test_update_profile_validation(client):
    login(client, **DEMO)
    assert client.patch("/api/profile", json={"name": ""}).status_code == 400
    assert client.patch("/api/profile", json={"email": "bad"}).status_code == 400


# --- Password change ---

def test_change_password_requires_correct_current_password(client):
    login(client, **DEMO)
    resp = client.post("/api/profile/password", json={"currentPassword": "nope", "newPassword": "brandnew1"})
    assert resp.status_code == 401


def test_change_password_rejects_short_new_password(client):
    login(client, **DEMO)
    resp = client.post("/api/profile/password", json={"currentPassword": "password", "newPassword": "short"})
    assert resp.status_code == 400


def test_change_password_then_login_uses_new_password(client):
    login(client, **DEMO)
    resp = client.post("/api/profile/password", json={"currentPassword": "password", "newPassword": "brandnew1"})
    assert resp.status_code == 200

    client.post("/api/logout")
    assert login(client, "user@example.com", "password").status_code == 401
    assert login(client, "user@example.com", "brandnew1").status_code == 200


def test_change_password_signs_out_other_sessions(client):
    from main import app

    login(client, **DEMO)
    with TestClient(app) as other:
        login(other, **DEMO)
        assert other.get("/api/auth/status").json()["authenticated"] is True

        client.post("/api/profile/password", json={"currentPassword": "password", "newPassword": "brandnew1"})

        assert other.get("/api/auth/status").json()["authenticated"] is False
        assert client.get("/api/auth/status").json()["authenticated"] is True


# --- Per-user data isolation ---

def test_users_only_see_their_own_projects(client):
    register(client)
    assert len(client.get("/api/projects").json()["projects"]) == 1
    client.post("/api/logout")

    login(client, **DEMO)
    titles = [p["title"] for p in client.get("/api/projects").json()["projects"]]
    assert titles == ["My Projects"]
    demo_project_id = client.get("/api/projects").json()["projects"][0]["id"]
    client.post("/api/logout")

    register(client, name="Grace", email="grace@example.com")
    grace_projects = client.get("/api/projects").json()["projects"]
    assert all(p["id"] != demo_project_id for p in grace_projects)
    assert client.get(f"/api/projects/{demo_project_id}").status_code == 404
