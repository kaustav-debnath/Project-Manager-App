"""API router for OmniRoute backend."""

from fastapi import APIRouter, Request, HTTPException, status

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/hello")
async def hello() -> dict[str, str]:
    """JSON API endpoint used to confirm the backend is reachable."""
    return {"message": "hello from omniroute backend"}


# --- Kanban Board CRUD endpoints ---

@router.get("/board")
async def get_board(request: Request):
    """Get the authenticated user's board with all columns and cards."""
    from db import get_board_for_user

    user_id = get_authenticated_user_id(request)
    board = get_board_for_user(user_id)
    return {"board": board}


@router.post("/board/card")
async def add_card(request: Request):
    """Add a new card to a column."""
    from db import create_card

    user_id = get_authenticated_user_id(request)
    body = await request.json()
    column_id = body.get("columnId")
    title = body.get("title", "").strip()
    details = body.get("details", "").strip()

    if not title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required",
        )

    card_id = create_card(column_id, title, details)
    return {"success": True, "cardId": card_id}


@router.put("/board/card/{card_id}")
async def update_card(request: Request, card_id: int):
    """Update a card's title and details."""
    from db import update_card as db_update_card

    get_authenticated_user_id(request)
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


@router.delete("/board/card/{card_id}")
async def delete_card(request: Request, card_id: int):
    """Delete a card."""
    from db import delete_card as db_delete_card

    get_authenticated_user_id(request)
    db_delete_card(card_id)
    return {"success": True}


@router.put("/board/column/{column_id}")
async def rename_column(request: Request, column_id: int):
    """Rename a column."""
    from db import update_column_title

    get_authenticated_user_id(request)
    body = await request.json()
    title = body.get("title", "").strip()

    if not title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required",
        )

    update_column_title(column_id, title)
    return {"success": True}


@router.patch("/board/card/{card_id}/move")
async def move_card(request: Request, card_id: int):
    """Move a card to a new column and position (drag-and-drop)."""
    from db import move_card as db_move_card

    get_authenticated_user_id(request)
    body = await request.json()
    new_column_id = body.get("newColumnId")
    new_position = body.get("newPosition", 0)

    db_move_card(card_id, new_column_id, new_position)
    return {"success": True}


def get_authenticated_user_id(request: Request) -> int:
    """Get the DB user_id for the authenticated session."""
    from main import get_current_user
    from db import get_user_id

    user = get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return get_user_id(user["username"])