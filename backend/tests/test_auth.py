import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from main import app
    with TestClient(app) as c:
        yield c


def test_login_valid_credentials(client):
    """Valid credentials should return success and session cookie."""
    resp = client.post("/api/login", json={"username": "user", "password": "password"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "username" in data
    assert data["username"] == "user"


def test_login_invalid_username(client):
    """Invalid username should return 401."""
    resp = client.post("/api/login", json={"username": "wronguser", "password": "password"})
    assert resp.status_code == 401


def test_login_invalid_password(client):
    """Invalid password should return 401."""
    resp = client.post("/api/login", json={"username": "user", "password": "wrongpass"})
    assert resp.status_code == 401


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
    """After login, auth status should show authenticated."""
    client.post("/api/login", json={"username": "user", "password": "password"})
    resp = client.get("/api/auth/status")
    data = resp.json()
    assert data["authenticated"] is True
    assert data["username"] == "user"


def test_logout_clears_session(client):
    """Logout should clear the session."""
    client.post("/api/login", json={"username": "user", "password": "password"})
    resp = client.post("/api/logout")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True

    # Verify session is cleared
    resp = client.get("/api/auth/status")
    data = resp.json()
    assert data["authenticated"] is False
