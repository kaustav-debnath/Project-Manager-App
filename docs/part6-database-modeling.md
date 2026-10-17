# Part 6: Database Modeling Plan

## Goal
Propose a SQLite schema for the Kanban board with multi-user support, document it in docs/, and obtain user sign-off before implementation in Part 7.

## Context
- Part 5 (Fake User Sign In) is complete: hardcoded "user"/"password" login, session cookies, auth-protected routes, all verified.
- Part 7 (Backend API) will implement the API routes to read/change Kanban per user using this schema.
- MVP limitation per CLAUDE.md: only 1 Kanban board per signed-in user, but the database will support multiple users for future.
- Current data lives only in-memory (frontend `dummyData.ts` + `boardReducer.ts`, backend `active_sessions` dict).
- Technology: SQLite via Python, `uv` package manager, FastAPI backend.
- `.env` at project root contains `OPENROUTER_API_KEY` (gitignored).

## Schema Design

### Tables

| Table | Purpose |
|-------|---------|
| `users` | Registered users (MVP: hardcoded "user"/"password", future: real auth) |
| `boards` | One board per user (MVP: 1 per user, future: N per user) |
| `columns` | Columns within a board (title, position/order) |
| `cards` | Cards within a column (title, details, position/order) |

### Schema Definition

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Project Alpha Roadmap',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Columns table
CREATE TABLE IF NOT EXISTS columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    column_id INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_column_id ON cards(column_id);
```

### Relationships

- `users` → `boards`: 1 user can have N boards (MVP enforced at app level: 1 board per user)
- `boards` → `columns`: 1 board has N columns (fixed 5 columns per MVP, renamable)
- `columns` → `cards`: 1 column has N cards
- Cascade delete: deleting a board deletes its columns and cards; deleting a column deletes its cards

### Positioning / Ordering

- `columns.position`: determines column order left-to-right within a board
- `cards.position`: determines card order top-to-bottom within a column
- Used for drag-and-drop reordering (update position values on move)

### Default Data (MVP Seed)

When a user signs up (or for the MVP hardcoded user), seed:
- 1 board: "Project Alpha Roadmap"
- 5 columns: Backlog, To Do, In Progress, In Review, Done (positions 0-4)
- 9 dummy cards distributed across columns (from `frontend/src/data/dummyData.ts`)

## Technology Choices

- SQLite local database file (created automatically if it doesn't exist)
- Python `sqlite3` standard library (no extra dependency needed)
- Database file location: project root or `backend/data/omniroute.db` (configurable via env)
- `uv` for dependency management (add `sqlite3` not needed — stdlib)

## Files to Create/Modify

### New files
- `docs/part6-database-modeling.md` — this plan (schema documentation)
- `backend/models.py` (or similar) — SQLAlchemy or raw sqlite3 schema + connection helpers
- `backend/db.py` — database initialization, `init_db()`, seed default data

### Existing files to reference
- `frontend/src/types/kanban.ts` — Card/Column/Board TypeScript interfaces (must match DB shape)
- `frontend/src/data/dummyData.ts` — dummy data to seed
- `backend/main.py` — FastAPI app entry point (will wire DB init in Part 7)
- `backend/config.py` — configuration (add DB_PATH setting)
- `backend/pyproject.toml` — dependency declarations

## Verification Steps (Part 6 only — documentation/sign-off)

1. Review proposed schema against MVP requirements:
   - [ ] Supports multiple users (future-proof)
   - [ ] 1 board per user (MVP limitation, enforced at app layer)
   - [ ] Fixed 5 columns per board (renamable)
   - [ ] Cards have title + details only
   - [ ] Drag-and-drop ordering via `position` column

2. Review schema against existing frontend types:
   - [ ] `Card`: id, title, details ✅ matches cards table
   - [ ] `Column`: id, title, cards[] ✅ matches columns + cards tables
   - [ ] `Board`: id, title, columns[] ✅ matches boards + columns tables

3. Confirm database initialization strategy:
   - [ ] Create DB file if it doesn't exist (on app startup)
   - [ ] Seed default user "user" and default board/columns/cards
   - [ ] Idempotent initialization (safe to run on every start)

4. Obtain user sign-off on the proposed schema before Part 7 implementation.

## Success Criteria

- SQLite schema documented in `docs/part6-database-modeling.md` with full DDL
- Schema supports MVP requirements (1 board/user, 5 columns, card CRUD, drag ordering)
- Schema is future-proof for multi-user support
- User sign-off obtained before Part 7 begins
- Dummy data seeding strategy documented

## Dependencies

- No new Python dependencies needed (`sqlite3` is stdlib)
- No new frontend dependencies needed
- Aligns with existing `Card`/`Column`/`Board` TypeScript types
