# Part 9: Multi Project Kanban and User Setup

## Goal
Extend the single-board MVP to support multiple projects per user, with multiple boards per project. Users will see a project list, select a project to see its boards, and then work on a specific board's Kanban view. All operations are scoped to the authenticated user's data.

## Context
- Part 8 (Frontend + Backend Integration) is complete: frontend calls backend API for persistent Kanban state.
- Current system: single fake user ("user"/"password"), single board per user, basic Kanban CRUD.
- Database: `users`, `boards`, `columns`, `cards` tables. `boards` has `user_id` FK.
- Auth: session cookie (`session_id`) with hardcoded credentials in `backend/main.py`.

## Requirements
> "In this module we will use the existing fake user. Now the user's authorization will be defined. The logged in user will have access to Projects. Inside projects, the user can see a list view of kanban boards. When clicked on a specific kanban, the user will see the detail view of that kanban. Then for that kanban the user may act upon existing cards like add, update, delete etc and all the operations will use the user's CRUD permissions on the db."

## Design Decision: Users → Projects → Boards

### Option A: Users → Projects → Boards (Recommended)
- Users create multiple projects
- Each project contains multiple boards
- Most flexible for future expansion (teams, sharing, etc.)

### Option B: Users → Boards (Projects as Board Groups)
- Users have multiple boards directly
- Projects are just labels/groupings for boards
- Simpler but less flexible

**Chosen: Option A** for better scalability and separation of concerns.

## Database Schema Changes

### New `projects` table
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Modified `boards` table
```sql
-- Change: user_id → project_id
CREATE TABLE boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_project_id ON boards(project_id);
```

### Migration Strategy
1. Add `projects` table
2. For each existing user, create a default project (e.g., "My Projects")
3. Move their existing board(s) into that project
4. Update `boards` table to use `project_id` instead of `user_id`
5. Add indexes
6. Update seed logic in `init_db()`

## API Endpoints to Implement

### Project Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/{id}` | Get project details (with boards) |
| PUT | `/api/projects/{id}` | Update project title/description |
| DELETE | `/api/projects/{id}` | Delete project (cascades to boards) |

### Board Endpoints (scoped to project)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/projects/{projectId}/boards` | List boards in project |
| POST | `/api/projects/{projectId}/boards` | Create board in project |
| GET | `/api/boards/{boardId}` | Get board with columns + cards |
| PUT | `/api/boards/{boardId}` | Update board (title, position) |
| DELETE | `/api/boards/{boardId}` | Delete board |

### Existing Endpoints (updated for board context)
- `GET /api/board` → **Deprecated** (keep as alias to user's first board for backward compat)
- Card/column operations now scoped via `board_id` context in URL or session

### New Card/Column Endpoints (board-scoped)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/boards/{boardId}/columns/{columnId}/card` | Add card to column |
| PUT | `/api/boards/{boardId}/cards/{cardId}` | Edit card |
| DELETE | `/api/boards/{boardId}/cards/{cardId}` | Delete card |
| PUT | `/api/boards/{boardId}/columns/{columnId}` | Rename column |
| PATCH | `/api/boards/{boardId}/cards/{cardId}/move` | Move card |

## Database Helper Functions (add to db.py)

### Project helpers
- `create_project(user_id: int, title: str, description: str) -> int`
- `get_projects_for_user(user_id: int) -> list[dict]`
- `get_project(project_id: int, user_id: int) -> dict | None` (verifies ownership)
- `update_project(project_id: int, user_id: int, title: str, description: str) -> None`
- `delete_project(project_id: int, user_id: int) -> None`

### Board helpers
- `get_boards_for_project(project_id: int) -> list[dict]`
- `create_board(project_id: int, title: str) -> int`
- `get_board(board_id: int) -> dict` (with columns + cards)
- `update_board(board_id: int, title: str, position: int) -> None`
- `delete_board(board_id: int) -> None`

### Updated helpers
- `get_board_for_user(user_id: int)` → **Deprecated** (use `get_boards_for_project` instead)
- All card/column operations: add `board_id` parameter for scoping

## Frontend Changes

### New Pages
1. **`/projects`** — Project list page
   - List all projects for logged-in user
   - "New Project" button → modal to create project
   - Click project → navigate to `/projects/[projectId]`

2. **`/projects/[projectId]`** — Project detail page
   - Show project title/description
   - List boards in project (cards with board title, card count)
   - "New Board" button → modal to create board
   - Click board → navigate to `/projects/[projectId]/boards/[boardId]`

3. **`/projects/[projectId]/boards/[boardId]`** — Board detail page
   - Reuse existing `Board` component (Kanban view)
   - Pass `boardId` to context for API calls
   - Board title editing (from header or column header)

### Components
- `ProjectList` — renders project cards in a grid
- `ProjectCard` — individual project display with title, board count
- `ProjectModal` — create/edit project form
- `BoardSelector` — board list within project
- `BoardModal` — create/edit board form
- Updated `BoardHeader` — show project/board context, breadcrumbs

### Routing
```
/
  └── /login (existing)
  └── /projects (new) - project list
      └── /projects/[projectId] (new) - project detail
          └── /projects/[projectId]/boards/[boardId] (new) - board Kanban
```

### Navigation/Breadcrumbs
- Header shows: Project Title > Board Title
- "Projects" link to return to project list
- Project selector dropdown in header (optional, for quick switching)

## Authentication & Authorization
- Keep existing session-based auth (`session_id` cookie)
- All new endpoints require authentication
- Authorization: verify `user_id` owns the `project_id` / `board_id`
- Return 403/404 for unauthorized access

## Files to Modify

### Backend
| File | Action |
|------|--------|
| `backend/db.py` | Add project/board helpers, update schema in `init_db()`, migrate existing data |
| `backend/routes/api.py` | Add project/board endpoints, update existing card/column endpoints |
| `backend/main.py` | Update imports, ensure DB migration runs on startup |

### Frontend
| File | Action |
|------|--------|
| `frontend/src/app/projects/page.tsx` | Create - Project list page |
| `frontend/src/app/projects/[projectId]/page.tsx` | Create - Project detail page |
| `frontend/src/app/projects/[projectId]/boards/[boardId]/page.tsx` | Create - Board detail page |
| `frontend/src/components/Board.tsx` | Modify - Accept `boardId` prop/param |
| `frontend/src/components/ProjectList.tsx` | Create - New component |
| `frontend/src/components/ProjectCard.tsx` | Create - New component |
| `frontend/src/components/ProjectModal.tsx` | Create - New component |
| `frontend/src/components/BoardSelector.tsx` | Create - New component |
| `frontend/src/components/BoardModal.tsx` | Create - New component |
| `frontend/src/app/layout.tsx` | Modify - Add breadcrumbs, project context |
| `frontend/src/app/page.tsx` | Modify - Redirect to `/projects` |

## Verification

### Database
- [ ] `projects` table created with FK to `users`
- [ ] `boards` table uses `project_id` FK
- [ ] Existing user's board migrated to default project
- [ ] Indexes created for `projects.user_id`, `boards.project_id`

### API
- [ ] `GET /api/projects` returns user's projects
- [ ] `POST /api/projects` creates project
- [ ] `GET /api/projects/{id}` returns project with boards
- [ ] `PUT/DELETE /api/projects/{id}` work
- [ ] `GET /api/projects/{id}/boards` returns boards
- [ ] `POST /api/projects/{id}/boards` creates board
- [ ] `GET /api/boards/{id}` returns full board with columns/cards
- [ ] Board-scoped card/column operations work
- [ ] 403/404 on unauthorized access
- [ ] Backward compat: `GET /api/board` still works (first board)

### Frontend
- [ ] `/projects` shows project list
- [ ] Create project modal works
- [ ] Project detail shows board list
- [ ] Create board modal works
- [ ] Board detail shows Kanban with data
- [ ] All CRUD ops work within board context
- [ ] Breadcrumbs navigation works
- [ ] Refresh persists data

### End-to-End Flow
1. Login as "user"/"password"
2. See project list (default "My Projects" project)
3. Click project → see board list (migrated "Project Alpha Roadmap")
4. Click board → Kanban view with seeded data
5. Add/edit/delete/move cards
6. Create new project "Website Redesign"
7. Create boards "Design", "Development", "Launch"
8. Switch between projects/boards
9. Refresh → data persists

## Dependencies
- No new npm packages (uses existing React Router, @dnd-kit, Tailwind)
- No new Python packages (uses FastAPI, sqlite3 stdlib)
- Existing session auth, db connection patterns

## Risks & Mitigation
| Risk | Mitigation |
|------|------------|
| Data migration loss | Write migration script, test on DB copy first |
| API breaking changes | Keep `/api/board` as alias to user's first board |
| UI complexity | Clear breadcrumbs, consistent styling, gradual disclosure |

## Estimated Work
- Database migration & helpers: 2-3 hours
- Backend API endpoints: 4-5 hours
- Frontend pages & components: 6-8 hours
- Testing: 2-3 hours
- **Total: ~14-19 hours**