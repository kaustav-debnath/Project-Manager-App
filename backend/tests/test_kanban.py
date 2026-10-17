"""Unit tests for Kanban board API endpoints."""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Get a test client with logged-in session."""
    from main import app

    with TestClient(app) as c:
        # Login first
        c.post("/api/login", json={"username": "user", "password": "password"})
        yield c


@pytest.fixture
def unauth_client():
    """Get a test client without authentication."""
    from main import app

    with TestClient(app) as c:
        yield c


def test_get_board_requires_auth(unauth_client):
    """GET /api/board should return 401 when not authenticated."""
    resp = unauth_client.get("/api/board")
    assert resp.status_code == 401


def test_get_board_returns_seeded_data(client):
    """GET /api/board should return the seeded board with columns and cards."""
    resp = client.get("/api/board")
    assert resp.status_code == 200
    data = resp.json()
    board = data["board"]
    assert board["title"] == "Project Alpha Roadmap"
    assert len(board["columns"]) == 5
    column_titles = [c["title"] for c in board["columns"]]
    assert "Backlog" in column_titles
    assert "To Do" in column_titles
    assert "In Progress" in column_titles
    assert "In Review" in column_titles
    assert "Done" in column_titles


def test_add_card_requires_auth(unauth_client):
    """POST /api/board/card should return 401 when not authenticated."""
    resp = unauth_client.post("/api/board/card", json={
        "columnId": 1, "title": "Test", "details": "Test details"
    })
    assert resp.status_code == 401


def test_add_card_requires_title(client):
    """POST /api/board/card should return 400 when title is empty."""
    resp = client.post("/api/board/card", json={
        "columnId": 1, "title": "", "details": "Test"
    })
    assert resp.status_code == 400


def test_add_card_success(client):
    """POST /api/board/card should create a new card."""
    resp = client.post("/api/board/card", json={
        "columnId": 1, "title": "New Test Card", "details": "Test details"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "cardId" in data


def test_update_card_requires_auth(unauth_client):
    """PUT /api/board/card/{id} should return 401 when not authenticated."""
    resp = unauth_client.put("/api/board/card/1", json={
        "title": "Updated", "details": "Updated details"
    })
    assert resp.status_code == 401


def test_update_card_success(client):
    """PUT /api/board/card/{id} should update a card."""
    resp = client.put("/api/board/card/1", json={
        "title": "Updated Title", "details": "Updated details"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


def test_delete_card_requires_auth(unauth_client):
    """DELETE /api/board/card/{id} should return 401 when not authenticated."""
    resp = unauth_client.delete("/api/board/card/1")
    assert resp.status_code == 401


def test_delete_card_success(client):
    """DELETE /api/board/card/{id} should delete a card."""
    resp = client.delete("/api/board/card/1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


def test_rename_column_requires_auth(unauth_client):
    """PUT /api/board/column/{id} should return 401 when not authenticated."""
    resp = unauth_client.put("/api/board/column/1", json={"title": "Renamed"})
    assert resp.status_code == 401


def test_rename_column_success(client):
    """PUT /api/board/column/{id} should rename a column."""
    # Use column 2 (To Do) to avoid affecting the seeded Backlog column
    resp = client.put("/api/board/column/2", json={"title": "Renamed Column"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


def test_move_card_requires_auth(unauth_client):
    """PATCH /api/board/card/{id}/move should return 401 when not authenticated."""
    resp = unauth_client.patch("/api/board/card/1/move", json={
        "newColumnId": 2, "newPosition": 0
    })
    assert resp.status_code == 401


def test_move_card_success(client):
    """PATCH /api/board/card/{id}/move should move a card."""
    # Use card 3 (still exists after delete_card test deletes card 1)
    resp = client.patch("/api/board/card/3/move", json={
        "newColumnId": 2, "newPosition": 0
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True