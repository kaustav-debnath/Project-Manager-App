# Project Management MVP - Master Plan

## Part 1: Plan -- COMPLETE

Enriched planning document with detailed substeps and success criteria.

## Part 2: Frontend Build -- COMPLETE

Build the frontend MVP as a NextJS app in `frontend/`.

### Technology Choices
- NextJS (latest, client-rendered)
- @dnd-kit for drag and drop
- Tailwind CSS for styling
- React Context + useReducer for state
- Vitest + React Testing Library for unit tests
- Playwright for integration tests

### Phase 1: Project Scaffolding
- [x] Create NextJS app with TypeScript + Tailwind CSS
- [x] Install @dnd-kit, Vitest, Playwright
- [x] Configure Tailwind custom colors and Vitest/Playwright
- [x] Add .gitignore and README.md

### Phase 2: Data Model and State Management
- [x] Define types (Card, Column, Board)
- [x] Create dummy data (5 columns with sample cards)
- [x] Create BoardContext with useReducer (MOVE_CARD, ADD_CARD, DELETE_CARD, EDIT_CARD, RENAME_COLUMN)
- [x] Unit tests for the reducer

### Phase 3: Core UI Components
- [x] BoardHeader, Column, Card, CardModal, Board components
- [x] Apply color scheme throughout
- [x] Unit tests for each component

### Phase 4: Drag and Drop
- [x] Integrate @dnd-kit for cross-column card movement
- [x] Reorder within column, visual feedback during drag
- [x] Unit tests

### Phase 5: Card CRUD Operations
- [x] Add card, edit card, delete card, rename column
- [x] Unit tests for each operation

### Phase 6: UI Polish
- [x] Responsive layout, transitions, hover states
- [x] Empty column state, card counts, keyboard accessibility

### Phase 7: Integration Testing (Playwright)
- [x] Test all key flows end-to-end
- [x] Fix defects

### Phase 8: Final Verification
- [x] All tests green, app runs cleanly

---

## Part 3: Scaffolding -- COMPLETE

Set up Docker, FastAPI backend, start/stop scripts. Serve example static HTML to confirm hello world works and make an API call.

## Part 4: Add Frontend to Backend -- COMPLETE

Statically build NextJS and serve from FastAPI at /. Comprehensive tests.

## Part 5: Fake User Sign In -- COMPLETE

Login with dummy credentials ("user", "password"). Logout. Comprehensive tests.

See [docs/part5-auth.md](part5-auth.md) for the detailed plan.

## Part 6: Database Modeling -- COMPLETE

SQLite schema documented in docs/part6-database-modeling.md. Database layer implemented in backend/db.py with tables users, boards, columns, cards, default data seeding, and DB initialization wired into FastAPI startup event.

See [docs/part6-database-modeling.md](part6-database-modeling.md) for the detailed plan.

## Part 7: Backend API -- COMPLETE

API routes to read/change Kanban per user. Create DB if it doesn't exist. Backend unit tests.

See [docs/part7-backend-api.md](part7-backend-api.md) for the detailed plan.

## Part 8: Frontend + Backend Integration -- COMPLETE

Frontend uses backend API for persistent Kanban. Board state persists across page refreshes. Backend Kanban CRUD routes wired in `backend/routes/api.py`, frontend `BoardContext.tsx` is API-backed with optimistic local updates. 25 backend tests + 26 frontend tests passing.

See [docs/part8-frontend-backend-integration.md](part8-frontend-backend-integration.md) for the detailed plan.

## Part 9: Multi Project Kanban and user setup -- COMPLETE

    In this module we will use the existing fake user 
    Now the user's authorization will be defined
    The logged in user will have access to Projects
    Inside projects, the user can see a list view of kanban boards
    When clicked on a specific kanban, the user will see the detail view of that kanban
    Then for that kanban the user may act upon existing cards like add, update, delete etc and all the operations will use the user's CRUD permissions on the db 

See [docs/part9-multi-project-user-setup.md](part9-multi-project-user-setup.md) for the detailed plan.

### Completed Implementation
- **Database**: `projects` table added, `boards.project_id` FK added, 50 backend tests pass
- **API**: All project/board endpoints implemented in `backend/routes/api.py`
- **Frontend**: `/projects` list page, `/projects/[projectId]` detail page, `/projects/[projectId]/boards/[boardId]` Kanban page
- **Testing**: 50 backend tests + 26 frontend tests passing

## Part 9a: Slug Routing and Nested Board API -- COMPLETE

Projects are addressed by slug and boards are nested under their project, in the URL and in the
API. The `/projects/**` namespace is one client-rendered route so runtime-created projects and
boards stay reachable under a static export. Board and project deletion go through an explicit
confirmation dialog.

See [docs/part9a-routing-and-nested-api.md](part9a-routing-and-nested-api.md) for the detailed plan.

### Completed Implementation
- **URLs**: `/projects`, `/projects/<slug>`, `/projects/<slug>/boards/<boardId>`
- **API**: every board endpoint nested under `/api/projects/{project_id}/boards/{board_id}`; the legacy flat routes removed
- **Database**: `projects.slug` column with migration, backfill and uniqueness
- **Testing**: 58 backend tests, 28 frontend unit tests, 13 Playwright e2e tests passing

## Part 10: New User Registration, User DB CRUD operations -- IMPLEMENTED (deploy check pending)

See [docs/part10-user-registration-profile.md](part10-user-registration-profile.md) for the detailed plan. Implementation starts after plan approval.

In this module we will be building new user registration/setup which will be very simple
so the user db needs to be created if not setup already
There will be a Profile page accessible under the logged in user's avatar on the top right corner of the page
From this profile page, the user can change his/her name, email id, password

## Part 11: AI Connectivity

Backend makes AI call via OpenRouter. Test with "2+2" test.

## Part 12: AI Structured Outputs

AI receives Kanban JSON + user question + conversation history. Responds with structured output including response and optional Kanban update.

## Part 13: AI Chat Sidebar

Beautiful sidebar widget for AI chat. AI can update Kanban via structured outputs. UI refreshes automatically on Kanban changes.
