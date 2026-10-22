"""Unit tests for Project API endpoints."""

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


def test_get_projects_requires_auth(unauth_client):
    """GET /api/projects should return 401 when not authenticated."""
    resp = unauth_client.get("/api/projects")
    assert resp.status_code == 401


def test_get_projects_empty(client):
    """GET /api/projects should return empty list for new user."""
    resp = client.get("/api/projects")
    assert resp.status_code == 200
    data = resp.json()
    assert "projects" in data
    assert isinstance(data["projects"], list)
    assert len(data["projects"]) == 1  # Default "My Projects" project
    assert data["projects"][0]["title"] == "My Projects"


def test_seeded_project_has_slug(client):
    """The seeded project is addressable as /projects/MyProjects."""
    resp = client.get("/api/projects")
    assert resp.json()["projects"][0]["slug"] == "MyProjects"


def test_create_project_requires_auth(unauth_client):
    """POST /api/projects should return 401 when not authenticated."""
    resp = unauth_client.post("/api/projects", json={"title": "Test Project"})
    assert resp.status_code == 401


def test_create_project_requires_title(client):
    """POST /api/projects should return 400 when title is empty."""
    resp = client.post("/api/projects", json={"title": ""})
    assert resp.status_code == 400


def test_create_project_slug(client):
    """A freshly created project exposes its slug for navigation."""
    resp = client.post("/api/projects", json={
        "title": "My New Project", "description": "Test description"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["slug"] == "MyNewProject"
    assert data["projectId"] is not None


def test_create_project_unique_slugs(client):
    """Two projects with the same title get distinct slugs."""
    resp1 = client.post("/api/projects", json={"title": "My Project"})
    resp2 = client.post("/api/projects", json={"title": "My Project"})
    slugs = {
        resp1.json()["slug"],
        resp2.json()["slug"],
    }
    assert slugs == {"MyProject", "MyProject2"}


def test_create_project_success(client):
    """POST /api/projects should create a new project."""
    resp = client.post("/api/projects", json={
        "title": "New Project", "description": "Test description"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "projectId" in data


def test_get_project_requires_auth(unauth_client):
    """GET /api/projects/{id} should return 401 when not authenticated."""
    resp = unauth_client.get("/api/projects/1")
    assert resp.status_code == 401


def test_get_project_not_found(client):
    """GET /api/projects/{id} should return 404 for non-existent project."""
    resp = client.get("/api/projects/999")
    assert resp.status_code == 404


def test_get_project_success(client):
    """GET /api/projects/{id} should return project with boards."""
    # Get existing project
    resp = client.get("/api/projects")
    projects = resp.json()["projects"]
    project_id = projects[0]["id"]

    resp = client.get(f"/api/projects/{project_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert "project" in data
    assert "boards" in data
    assert data["project"]["title"] == "My Projects"
    assert isinstance(data["boards"], list)


def test_update_project_requires_auth(unauth_client):
    """PUT /api/projects/{id} should return 401 when not authenticated."""
    resp = unauth_client.put("/api/projects/1", json={"title": "Updated"})
    assert resp.status_code == 401


def test_update_project_success(client):
    """PUT /api/projects/{id} should update a project."""
    resp = client.get("/api/projects")
    project_id = resp.json()["projects"][0]["id"]

    resp = client.put(f"/api/projects/{project_id}", json={
        "title": "Updated Project", "description": "Updated description"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


def test_delete_project_requires_auth(unauth_client):
    """DELETE /api/projects/{id} should return 401 when not authenticated."""
    resp = unauth_client.delete("/api/projects/1")
    assert resp.status_code == 401


def test_delete_project_success(client):
    """DELETE /api/projects/{id} should delete a project."""
    # Create a project to delete
    resp = client.post("/api/projects", json={"title": "To Delete"})
    project_id = resp.json()["projectId"]

    resp = client.delete(f"/api/projects/{project_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True

    # Verify it's gone
    resp = client.get("/api/projects")
    project_ids = [p["id"] for p in resp.json()["projects"]]
    assert project_id not in project_ids