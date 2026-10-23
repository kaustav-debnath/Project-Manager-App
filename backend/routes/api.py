"""API router for OmniRoute backend."""

import sqlite3

from fastapi import APIRouter, Request, HTTPException, status

from accounts import email_error, name_error, password_error

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/hello")
async def hello() -> dict[str, str]:
    """JSON API endpoint used to confirm the backend is reachable."""
    return {"message": "hello from omniroute backend"}


# --- Kanban Board CRUD endpoints ---

def get_authenticated_user_id(request: Request) -> int:
    """Get the DB user_id for the authenticated session."""
    from main import get_current_user

    user = get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user["user_id"]


# --- Profile endpoints ---

@router.get("/profile")
async def get_profile(request: Request):
    """Get the signed-in user's profile."""
    from db import get_user_by_id
    from main import public_user

    account = get_user_by_id(get_authenticated_user_id(request))
    return {"user": public_user(account)}


@router.patch("/profile")
async def update_profile(request: Request):
    """Update the signed-in user's name and/or email."""
    from db import get_user_by_id, get_user_by_email, update_user_profile
    from main import public_user

    user_id = get_authenticated_user_id(request)
    account = get_user_by_id(user_id)
    body = await request.json()

    name = str(body["name"]).strip() if "name" in body else account["name"]
    email = str(body["email"]).strip().lower() if "email" in body else account["email"]

    error = name_error(name) or email_error(email)
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    duplicate_detail = "An account with this email already exists"
    taken = get_user_by_email(email)
    if taken and taken["id"] != user_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=duplicate_detail)

    try:
        update_user_profile(user_id, name, email)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=duplicate_detail)

    return {"user": public_user(get_user_by_id(user_id))}


@router.post("/profile/password")
async def change_password(request: Request):
    """Change the signed-in user's password and sign out their other sessions."""
    from db import get_user_by_id, update_user_password, verify_password
    from main import SESSION_COOKIE, sign_out_other_sessions

    user_id = get_authenticated_user_id(request)
    account = get_user_by_id(user_id)
    body = await request.json()
    current_password = str(body.get("currentPassword", ""))
    new_password = str(body.get("newPassword", ""))

    if not verify_password(current_password, account["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    error = password_error(new_password)
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    update_user_password(user_id, new_password)
    sign_out_other_sessions(user_id, request.cookies.get(SESSION_COOKIE))
    return {"success": True}


def _require_project(request: Request, project_id: int) -> int:
    """Return the authenticated user id, raising 404 if the project is not theirs."""
    from db import get_project

    user_id = get_authenticated_user_id(request)
    if not get_project(project_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return user_id


def _require_board(project_id: int, board_id: int) -> None:
    """Raise 404 if the board does not belong to the project."""
    from db import get_board_for_project

    if not get_board_for_project(board_id, project_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found",
        )


# --- Project CRUD endpoints ---

@router.get("/projects")
async def get_projects(request: Request):
    """Get all projects for the authenticated user."""
    from db import get_projects_for_user

    user_id = get_authenticated_user_id(request)
    projects = get_projects_for_user(user_id)
    return {"projects": projects}


@router.post("/projects")
async def create_project(request: Request):
    """Create a new project for the authenticated user."""
    from db import create_project, get_project

    user_id = get_authenticated_user_id(request)
    body = await request.json()
    title = body.get("title", "").strip()
    description = body.get("description", "").strip()

    if not title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required",
        )

    project_id = create_project(user_id, title, description)
    project = get_project(project_id, user_id)
    return {"success": True, "projectId": project_id, "slug": project["slug"]}


@router.get("/projects/{project_id}")
async def get_project(request: Request, project_id: int):
    """Get a specific project with its boards."""
    from db import get_project, get_boards_for_project

    user_id = get_authenticated_user_id(request)
    project = get_project(project_id, user_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    boards = get_boards_for_project(project_id)
    return {"project": project, "boards": boards}


@router.put("/projects/{project_id}")
async def update_project(request: Request, project_id: int):
    """Update a project's title and description."""
    from db import update_project

    user_id = get_authenticated_user_id(request)
    body = await request.json()
    title = body.get("title", "").strip()
    description = body.get("description", "").strip()

    if not title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required",
        )

    try:
        update_project(project_id, user_id, title, description)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return {"success": True}


@router.delete("/projects/{project_id}")
async def delete_project(request: Request, project_id: int):
    """Delete a project (cascades to boards)."""
    from db import delete_project

    user_id = get_authenticated_user_id(request)
    try:
        delete_project(project_id, user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return {"success": True}


# --- Board CRUD endpoints (scoped to project) ---

@router.get("/projects/{project_id}/boards")
async def get_boards(request: Request, project_id: int):
    """Get all boards in a project."""
    from db import get_boards_for_project

    _require_project(request, project_id)
    boards = get_boards_for_project(project_id)
    return {"boards": boards}


@router.post("/projects/{project_id}/boards")
async def create_board(request: Request, project_id: int):
    """Create a new board in a project."""
    from db import create_board

    user_id = _require_project(request, project_id)

    body = await request.json()
    title = body.get("title", "").strip()

    if not title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required",
        )

    board_id = create_board(project_id, user_id, title)
    return {"success": True, "boardId": board_id}


@router.get("/projects/{project_id}/boards/{board_id}")
async def get_board(request: Request, project_id: int, board_id: int):
    """Get a specific board with columns and cards."""
    from db import get_board_for_project

    _require_project(request, project_id)
    board = get_board_for_project(board_id, project_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found",
        )
    return {"board": board}


@router.put("/projects/{project_id}/boards/{board_id}")
async def update_board(request: Request, project_id: int, board_id: int):
    """Update a board's title and/or position."""
    from db import update_board as db_update_board

    _require_project(request, project_id)
    _require_board(project_id, board_id)

    body = await request.json()
    title = body.get("title", "").strip()
    position = body.get("position")

    if not title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required",
        )

    db_update_board(board_id, title, position)
    return {"success": True}


@router.delete("/projects/{project_id}/boards/{board_id}")
async def delete_board(request: Request, project_id: int, board_id: int):
    """Delete a board."""
    from db import delete_board as db_delete_board

    _require_project(request, project_id)
    _require_board(project_id, board_id)

    db_delete_board(board_id)
    return {"success": True}


# --- Board-scoped Card/Column endpoints ---

@router.post("/projects/{project_id}/boards/{board_id}/columns/{column_id}/card")
async def add_card_to_board(request: Request, project_id: int, board_id: int, column_id: int):
    """Add a new card to a column in a board."""
    from db import create_card

    _require_project(request, project_id)
    _require_board(project_id, board_id)

    body = await request.json()
    title = body.get("title", "").strip()
    details = body.get("details", "").strip()

    if not title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required",
        )

    card_id = create_card(column_id, title, details)
    return {"success": True, "cardId": card_id}


@router.put("/projects/{project_id}/boards/{board_id}/cards/{card_id}")
async def update_card(request: Request, project_id: int, board_id: int, card_id: int):
    """Update a card's title and details."""
    from db import update_card as db_update_card

    _require_project(request, project_id)
    _require_board(project_id, board_id)

    body = await request.json()
    title = body.get("title", "").strip()
    details = body.get("details", "").strip()

    if not title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required",
        )

    db_update_card(card_id, title, details)
    return {"success": True}


@router.delete("/projects/{project_id}/boards/{board_id}/cards/{card_id}")
async def delete_card(request: Request, project_id: int, board_id: int, card_id: int):
    """Delete a card."""
    from db import delete_card as db_delete_card

    _require_project(request, project_id)
    _require_board(project_id, board_id)

    db_delete_card(card_id)
    return {"success": True}


@router.put("/projects/{project_id}/boards/{board_id}/columns/{column_id}")
async def rename_column(request: Request, project_id: int, board_id: int, column_id: int):
    """Rename a column."""
    from db import update_column_title

    _require_project(request, project_id)
    _require_board(project_id, board_id)

    body = await request.json()
    title = body.get("title", "").strip()

    if not title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required",
        )

    update_column_title(column_id, title)
    return {"success": True}


@router.patch("/projects/{project_id}/boards/{board_id}/cards/{card_id}/move")
async def move_card(request: Request, project_id: int, board_id: int, card_id: int):
    """Move a card to a new column and position (drag-and-drop)."""
    from db import move_card as db_move_card

    _require_project(request, project_id)
    _require_board(project_id, board_id)

    body = await request.json()
    new_column_id = body.get("newColumnId")
    new_position = body.get("newPosition", 0)

    db_move_card(card_id, new_column_id, new_position)
    return {"success": True}