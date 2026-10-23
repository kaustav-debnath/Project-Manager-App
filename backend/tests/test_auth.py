import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from main import app
    with TestClient(app) as c:
        yield c


def test_login_valid_credentials(client):
    """Valid email and password should return success and the user profile."""
    resp = client.post("/api/login", json={"email": "user@example.com", "password": "password"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["user"]["email"] == "user@example.com"
    assert data["user"]["name"] == "Demo User"
    assert "password" not in data["user"]


def test_login_unknown_email(client):
    """An email with no account should return 401."""
    resp = client.post("/api/login", json={"email": "nobody@example.com", "password": "password"})
    assert resp.status_code == 401


def test_login_invalid_password(client):
    """Invalid password should return 401."""
    resp = client.post("/api/login", json={"email": "user@example.com", "password": "wrongpass"})
    assert resp.status_code == 401


def test_login_email_is_case_insensitive(client):
    """Email lookup should ignore case and surrounding spaces."""
    resp = client.post("/api/login", json={"email": "  User@Example.COM ", "password": "password"})
    assert resp.status_code == 200


def test_login_empty_credentials(client):
    """Empty credentials should return 401."""
    resp = client.post("/api/login", json={})
    assert resp.status_code == 401


def test_auth_status_unauthenticated(client):
    """Without login, auth status should show not authenticated."""
    resp = client.get("/api/auth/status")
    data = resp.json()
    assert data["authenticated"] is False


def test_auth_status_authenticated(client):
    """After login, auth status should return the signed-in user."""
    client.post("/api/login", json={"email": "user@example.com", "password": "password"})
    resp = client.get("/api/auth/status")
    data = resp.json()
    assert data["authenticated"] is True
    assert data["user"]["email"] == "user@example.com"
    assert data["user"]["name"] == "Demo User"


def test_logout_clears_session(client):
    """Logout should clear the session."""
    client.post("/api/login", json={"email": "user@example.com", "password": "password"})
    resp = client.post("/api/logout")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True

    # Verify session is cleared
    resp = client.get("/api/auth/status")
    data = resp.json()
    assert data["authenticated"] is False


def test_public_pages_served_without_login(client):
    """Login and register pages must be reachable while signed out."""
    from config import STATIC_DIR

    if not (STATIC_DIR / "register.html").is_file():
        pytest.skip("frontend static export not built")
    assert client.get("/register").status_code == 200
    assert client.get("/login").status_code == 200
