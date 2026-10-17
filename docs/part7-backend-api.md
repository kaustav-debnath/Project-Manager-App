# Part 7: Backend API Plan

## Goal
Implement API routes to read/change the Kanban board per user. Database auto-creates if it doesn't exist. Backend unit tests.

## Context
- Part 6 (Database Modeling) is complete: `backend/db.py` has tables `users`, `boards`, `columns`, `cards` with default data seeded, and `init_db()` is wired into FastAPI startup.
- `backend/routes/api.py` only has `/api/hello` — no Kanban CRUD endpoints exist yet.
- Frontend `BoardContext.tsx` uses `boardReducer` with actions: `MOVE_CARD`, `ADD_CARD`, `DELETE_CARD`, `EDIT_CARD`, `RENAME_COLUMN`, `SET_BOARD`.
- Frontend types: `Card` (id, title, details), `Column` (id, title, cards[]), `Board` (id, title, columns[]).
- Frontend `BoardContext` exposes: `moveCard`, `addCard`, `editCard`, `deleteCard`, `renameColumn`.

## API Endpoints to Implement

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/board` | Get the current user's board (columns + cards) |
| POST | `/api/board/card` | Add a new card to a column |
| PUT | `/api/board/card/{cardId}` | Edit a card title/details |
| DELETE | `/api/board/card/{cardId}` | Delete a card |
| PUT | `/api/board/column/{columnId}` | Rename a column |
| PATCH | `/api/board/card/{cardId}/move` | Move a card (drag-and-drop) |

## Request/Response Shapes

### GET /api/board
Returns the authenticated user's board with all columns and cards:
```json
{
  "board": {
    "id": 1,
    "title": "Project Alpha Roadmap",
    "columns": [
      {
        "id": 1,
        "title": "Backlog",
        "position": 0,
        "cards": [
          {"id": 1, "title": "Define system metrics", "details": "...", "position": 0}
        ]
      }
    ]
  }
}
```

### POST /api/board/card
Creates a new card in the specified column.
**Request body:** `{ "columnId": 1, "title": "New task", "details": "Notes" }`
**Response:** The created card object with `id`.

### PUT /api/board/card/{cardId}
Updates a card's title and details.
**Request body:** `{ "title": "Updated", "details": "..." }`
**Response:** `{"success": true}`

### DELETE /api/board/card/{cardId}
Deletes a card.
**Response:** `{"success": true}`

### PUT /api/board/column/{columnId}
Renames a column.
**Request body:** `{ "title": "New column name" }`
**Response:** `{"success": true}`

### PATCH /api/board/card/{cardId}/move
Moves a card between columns or reorders within a column (for drag-and-drop).
**Request body:** `{ "newColumnId": 2, "newPosition": 0 }`
**Response:** `{"success": true}`

## Authentication

All endpoints require authentication via the session cookie `session_id`.
- The `get_current_user` function from `main.py` is used to extract the authenticated user.
- If not authenticated, return `401 Unauthorized`.

To get the user's DB user_id, map the session's `username` to the `users` table:
```python
def get_authenticated_user_id(request: Request) -> int:
    user = get_current_user(request)
    if not user:
        raise HTTPException(401, "Not authenticated")
    return get_user_id_from_username(user["username"])
```

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `backend/routes/api.py` | Modify | Add 6 Kanban CRUD endpoints with auth dependency |
| `backend/db.py` | Modify | Add helper functions: `get_board_for_user`, `create_card`, `update_card`, `delete_card`, `update_column_title`, `move_card` |
| `backend/tests/test_kanban.py` | Create | Unit tests for all endpoints (login first, then test each CRUD op) |

## Database Helper Functions (to add to db.py)

- `get_user_id(username: str) -> int` — look up user ID by username
- `get_board_for_user(user_id: int) -> dict` — returns board with nested columns/cards
- `create_card(column_id: int, title: str, details: str) -> int` — insert card, return new card ID
- `update_card(card_id: int, title: str, details: str) -> None` — update card
- `delete_card(card_id: int) -> None` — delete card
- `update_column_title(column_id: int, title: str) -> None` — rename column
- `move_card(card_id: int, new_column_id: int, new_position: int) -> None` — move card

## Verification Steps

1. Start backend: `cd backend && uv run uvicorn main:app --port 8001`
2. Login: `curl -X POST .../api/login` with user/password → get session cookie
3. `curl -b "session_id=..." .../api/board` → returns board JSON with 5 columns, 9 cards
4. Test `POST /api/board/card` with valid columnId → returns created card
5. Test `PUT /api/board/card/{id}` → updates card
6. Test `DELETE /api/board/card/{id}` → deletes card
7. Test `PUT /api/board/column/{id}` → renames column
8. Test `PATCH /api/board/card/{id}/move` → moves card between columns
9. Run `uv run python -m pytest tests/` → all tests pass (12 existing + new kanban tests)
10. Run `npm test -- --run` in frontend → all 26 tests still pass

## Dependencies
- No new dependencies. Uses existing FastAPI + Python sqlite3 stdlib.
