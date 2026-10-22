"""Unit tests for Board API endpoints."""

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


def first_project(client):
    """Return the id of the first project for the logged in user."""
    resp = client.get("/api/projects")
    return resp.json()["projects"][0]["id"]


def first_board(client, project_id):
    """Return the id of the first board in a project."""
    resp = client.get(f"/api/projects/{project_id}/boards")
    return resp.json()["boards"][0]["id"]


def test_get_boards_requires_auth(unauth_client):
    """GET /api/projects/{id}/boards should return 401 when not authenticated."""
    resp = unauth_client.get("/api/projects/1/boards")
    assert resp.status_code == 401


def test_get_boards_not_found_project(client):
    """GET /api/projects/{id}/boards should return 404 for non-existent project."""
    resp = client.get("/api/projects/999/boards")
    assert resp.status_code == 404


def test_get_boards_success(client):
    """GET /api/projects/{id}/boards should return boards for project."""
    project_id = first_project(client)

    resp = client.get(f"/api/projects/{project_id}/boards")
    assert resp.status_code == 200
    data = resp.json()
    assert "boards" in data
    assert isinstance(data["boards"], list)
    assert len(data["boards"]) >= 1  # Default project has at least the seeded board


def test_create_board_requires_auth(unauth_client):
    """POST /api/projects/{id}/boards should return 401 when not authenticated."""
    resp = unauth_client.post("/api/projects/1/boards", json={"title": "New Board"})
    assert resp.status_code == 401


def test_create_board_requires_title(client):
    """POST /api/projects/{id}/boards should return 400 when title is empty."""
    resp = client.post("/api/projects/1/boards", json={"title": ""})
    assert resp.status_code == 400


def test_create_board_success(client):
    """POST /api/projects/{id}/boards should create a board."""
    project_id = first_project(client)

    resp = client.post(f"/api/projects/{project_id}/boards", json={"title": "New Board"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "boardId" in data


def test_get_board_requires_auth(unauth_client):
    """GET /api/projects/{pid}/boards/{id} should return 401 when not authenticated."""
    resp = unauth_client.get("/api/projects/1/boards/1")
    assert resp.status_code == 401


def test_get_board_not_found(client):
    """GET /api/projects/{pid}/boards/{id} should return 404 for non-existent board."""
    project_id = first_project(client)
    resp = client.get(f"/api/projects/{project_id}/boards/999")
    assert resp.status_code == 404


def test_get_board_success(client):
    """GET /api/projects/{pid}/boards/{id} should return board with columns and cards."""
    project_id = first_project(client)
    board_id = first_board(client, project_id)

    resp = client.get(f"/api/projects/{project_id}/boards/{board_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert "board" in data
    board = data["board"]
    assert board["title"] != ""
    assert len(board["columns"]) == 5  # Default 5 columns


def test_get_board_wrong_project(client):
    """A board must not be reachable through a project it does not belong to."""
    project_id = first_project(client)
    other_project = client.post("/api/projects", json={"title": "Other"}).json()["projectId"]
    board_id = first_board(client, project_id)

    resp = client.get(f"/api/projects/{other_project}/boards/{board_id}")
    assert resp.status_code == 404


def test_update_board_requires_auth(unauth_client):
    """PUT /api/projects/{pid}/boards/{id} should return 401 when not authenticated."""
    resp = unauth_client.put("/api/projects/1/boards/1", json={"title": "Updated"})
    assert resp.status_code == 401


def test_update_board_success(client):
    """PUT /api/projects/{pid}/boards/{id} should update a board."""
    project_id = first_project(client)
    board_id = first_board(client, project_id)

    resp = client.put(f"/api/projects/{project_id}/boards/{board_id}", json={
        "title": "Updated Board Title", "position": 0
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


def test_delete_board_requires_auth(unauth_client):
    """DELETE /api/projects/{pid}/boards/{id} should return 401 when not authenticated."""
    resp = unauth_client.delete("/api/projects/1/boards/1")
    assert resp.status_code == 401


def test_delete_board_success(client):
    """DELETE /api/projects/{pid}/boards/{id} should delete a board."""
    project_id = first_project(client)
    board_id = first_board(client, project_id)

    resp = client.delete(f"/api/projects/{project_id}/boards/{board_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True

    # Verify it is gone
    resp = client.get(f"/api/projects/{project_id}/boards/{board_id}")
    assert resp.status_code == 404


def test_delete_board_not_found(client):
    """DELETE /api/projects/{pid}/boards/{id} should return 404 for a missing board."""
    project_id = first_project(client)
    resp = client.delete(f"/api/projects/{project_id}/boards/999")
    assert resp.status_code == 404


def test_delete_board_wrong_project(client):
    """A board must not be deletable through a project it does not belong to."""
    project_id = first_project(client)
    other_project = client.post("/api/projects", json={"title": "Other"}).json()["projectId"]
    board_id = first_board(client, project_id)

    resp = client.delete(f"/api/projects/{other_project}/boards/{board_id}")
    assert resp.status_code == 404

    # The board still exists in its own project
    resp = client.get(f"/api/projects/{project_id}/boards/{board_id}")
    assert resp.status_code == 200


def test_card_endpoints_are_nested_under_project(client):
    """Card and column endpoints live under the project and the board."""
    project_id = first_project(client)
    board_id = first_board(client, project_id)

    resp = client.get(f"/api/projects/{project_id}/boards/{board_id}")
    column_id = resp.json()["board"]["columns"][0]["id"]

    # Add a card
    resp = client.post(
        f"/api/projects/{project_id}/boards/{board_id}/columns/{column_id}/card",
        json={"title": "Nested card", "details": "details"},
    )
    assert resp.status_code == 200
    card_id = resp.json()["cardId"]

    # Update a card
    resp = client.put(
        f"/api/projects/{project_id}/boards/{board_id}/cards/{card_id}",
        json={"title": "Updated card", "details": "new details"},
    )
    assert resp.status_code == 200

    # Move a card
    resp = client.patch(
        f"/api/projects/{project_id}/boards/{board_id}/cards/{card_id}/move",
        json={"newColumnId": column_id, "newPosition": 0},
    )
    assert resp.status_code == 200

    # Delete a card
    resp = client.delete(f"/api/projects/{project_id}/boards/{board_id}/cards/{card_id}")
    assert resp.status_code == 200


def test_legacy_flat_board_routes_are_gone(client):
    """The old top-level board routes must no longer be served."""
    for method, url in [
        ("get", "/api/board"),
        ("post", "/api/board/card"),
        ("get", "/api/boards/1"),
        ("delete", "/api/boards/1"),
    ]:
        resp = getattr(client, method)(url)
        assert resp.status_code in (404, 405), f"{method.upper()} {url} should be gone"
