"""Unit tests for Kanban card and column API endpoints."""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Get a test client with logged-in session."""
    from main import app

    with TestClient(app) as c:
        # Login first
        c.post("/api/login", json={"email": "user@example.com", "password": "password"})
        yield c


@pytest.fixture
def unauth_client():
    """Get a test client without authentication."""
    from main import app

    with TestClient(app) as c:
        yield c


def seeded_board(client):
    """Return the project id, board id and column ids of the seeded board."""
    project_id = client.get("/api/projects").json()["projects"][0]["id"]
    board_id = client.get(f"/api/projects/{project_id}/boards").json()["boards"][0]["id"]
    board = client.get(f"/api/projects/{project_id}/boards/{board_id}").json()["board"]
    columns = {column["title"]: column["id"] for column in board["columns"]}
    return project_id, board_id, columns


def test_get_board_requires_auth(unauth_client):
    """GET board should return 401 when not authenticated."""
    resp = unauth_client.get("/api/projects/1/boards/1")
    assert resp.status_code == 401


def test_get_board_returns_seeded_data(client):
    """GET board should return the seeded board with columns and cards."""
    project_id, board_id, _ = seeded_board(client)
    resp = client.get(f"/api/projects/{project_id}/boards/{board_id}")
    assert resp.status_code == 200
    board = resp.json()["board"]
    assert board["title"] == "Project Alpha Roadmap"
    assert len(board["columns"]) == 5
    column_titles = [c["title"] for c in board["columns"]]
    assert "Backlog" in column_titles
    assert "To Do" in column_titles
    assert "In Progress" in column_titles
    assert "In Review" in column_titles
    assert "Done" in column_titles


def test_add_card_requires_auth(unauth_client):
    """POST card should return 401 when not authenticated."""
    resp = unauth_client.post("/api/projects/1/boards/1/columns/1/card", json={
        "title": "Test", "details": "Test details"
    })
    assert resp.status_code == 401


def test_add_card_requires_title(client):
    """POST card should return 400 when title is empty."""
    project_id, board_id, columns = seeded_board(client)
    resp = client.post(
        f"/api/projects/{project_id}/boards/{board_id}/columns/{columns['Backlog']}/card",
        json={"title": "", "details": "Test"},
    )
    assert resp.status_code == 400


def test_add_card_success(client):
    """POST card should create a new card."""
    project_id, board_id, columns = seeded_board(client)
    resp = client.post(
        f"/api/projects/{project_id}/boards/{board_id}/columns/{columns['Backlog']}/card",
        json={"title": "New Test Card", "details": "Test details"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "cardId" in data


def test_update_card_requires_auth(unauth_client):
    """PUT card should return 401 when not authenticated."""
    resp = unauth_client.put("/api/projects/1/boards/1/cards/1", json={
        "title": "Updated", "details": "Updated details"
    })
    assert resp.status_code == 401


def test_update_card_success(client):
    """PUT card should update a card."""
    project_id, board_id, _ = seeded_board(client)
    resp = client.put(f"/api/projects/{project_id}/boards/{board_id}/cards/1", json={
        "title": "Updated Title", "details": "Updated details"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


def test_delete_card_requires_auth(unauth_client):
    """DELETE card should return 401 when not authenticated."""
    resp = unauth_client.delete("/api/projects/1/boards/1/cards/1")
    assert resp.status_code == 401


def test_delete_card_success(client):
    """DELETE card should delete a card."""
    project_id, board_id, _ = seeded_board(client)
    resp = client.delete(f"/api/projects/{project_id}/boards/{board_id}/cards/1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


def test_rename_column_requires_auth(unauth_client):
    """PUT column should return 401 when not authenticated."""
    resp = unauth_client.put("/api/projects/1/boards/1/columns/1", json={"title": "Renamed"})
    assert resp.status_code == 401


def test_rename_column_success(client):
    """PUT column should rename a column."""
    project_id, board_id, columns = seeded_board(client)
    resp = client.put(
        f"/api/projects/{project_id}/boards/{board_id}/columns/{columns['To Do']}",
        json={"title": "Renamed Column"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


def test_move_card_requires_auth(unauth_client):
    """PATCH card move should return 401 when not authenticated."""
    resp = unauth_client.patch("/api/projects/1/boards/1/cards/1/move", json={
        "newColumnId": 2, "newPosition": 0
    })
    assert resp.status_code == 401


def test_move_card_success(client):
    """PATCH card move should move a card."""
    project_id, board_id, columns = seeded_board(client)
    resp = client.patch(
        f"/api/projects/{project_id}/boards/{board_id}/cards/3/move",
        json={"newColumnId": columns["To Do"], "newPosition": 0},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
