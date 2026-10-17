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

## Part 3: Scaffolding

Set up Docker, FastAPI backend, start/stop scripts. Serve example static HTML to confirm hello world works and make an API call.

## Part 4: Add Frontend to Backend

Statically build NextJS and serve from FastAPI at /. Comprehensive tests.

## Part 5: Fake User Sign In

Login with dummy credentials ("user", "password"). Logout. Comprehensive tests.

## Part 6: Database Modeling

Propose SQLite schema for the Kanban. Document in docs/ and get user sign off.

## Part 7: Backend API

API routes to read/change Kanban per user. Create DB if it doesn't exist. Backend unit tests.

## Part 8: Frontend + Backend Integration

Frontend uses backend API for persistent Kanban. Thorough testing.

## Part 9: AI Connectivity

Backend makes AI call via OpenRouter. Test with "2+2" test.

## Part 10: AI Structured Outputs

AI receives Kanban JSON + user question + conversation history. Responds with structured output including response and optional Kanban update.

## Part 11: AI Chat Sidebar

Beautiful sidebar widget for AI chat. AI can update Kanban via structured outputs. UI refreshes automatically on Kanban changes.
