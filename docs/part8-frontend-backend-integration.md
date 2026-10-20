# Part 8: Frontend + Backend Integration Plan

## Goal
Replace frontend's local BoardContext state management with backend API calls so the Kanban board becomes persistent across page refreshes, enabling true frontend-backend integration while maintaining identical UI/UX.

## Context
- Part 5 (Fake User Sign In) is complete: AuthContext login/logout/checkAuth with session cookies, protected routes, all verified
- Part 6 (Database Modeling) is complete: SQLite schema with users→boards→columns→cards, default data seeding, init_db wired to FastAPI startup
- Part 7 (Backend API) is complete: 6 Kanban CRUD endpoints (`/api/board`, `/api/board/card`, `/api/board/card/{id}`, `/api/board/column/{id}`, `/api/board/card/{id}/move`) with auth dependency, 25 backend unit tests passing
- Frontend `BoardContext.tsx` uses local `useReducer` + `boardReducer` with `initialBoard` (dummy data), all state is client-side only
- Frontend types (`Card`/`Column`/`Board`) use **string IDs** (e.g., `"card-1"`, `"col-backlog"`) while the backend uses **integer IDs** (e.g., `1`, `2`)
- API proxy configured in `next.config.ts`: `/api/*` → `http://localhost:8001/api/*`
- All 26 frontend unit tests and 25 backend unit tests passing
- Current state: Frontend operates on client-side only; board state is lost on page refresh

## Key Findings from Codebase Analysis

### Frontend Current State
1. **`src/context/BoardContext.tsx`**: Wraps `AuthenticatedBoard` in `page.tsx`. Uses `useReducer(boardReducer, initialBoard)`. Exposes: `board`, `moveCard`, `addCard`, `editCard`, `deleteCard`, `renameColumn`.
2. **`src/components/Board.tsx`**: Calls `useBoard()`, dispatches `MOVE_CARD`, `ADD_CARD`, `EDIT_CARD`, `DELETE_CARD`, `RENAME_COLUMN` actions via BoardContext. No direct API calls.
3. **`src/types/kanban.ts`**: `Board.id: string`, `Column.id: string`, `Card.id: string`.
4. **`src/data/dummyData.ts`**: `initialBoard` with string IDs like `"board-1"`, `"col-backlog"`, `"card-1"`.
5. AuthContext already makes API calls (`fetch`) to `/api/login`, `/api/logout`, `/api/auth/status` — established pattern.

### Backend API Surface (Part 7)
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/board` | — | `{"board": {id, title, columns:[{id, title, position, cards:[{id, title, details}]}]}}` |
| POST | `/api/board/card` | `{columnId, title, details}` | `{"success": true, "cardId": int}` |
| PUT | `/api/board/card/{cardId}` | `{title, details}` | `{"success": true}` |
| DELETE | `/api/board/card/{cardId}` | — | `{"success": true}` |
| PUT | `/api/board/column/{columnId}` | `{title}` | `{"success": true}` |
| PATCH | `/api/board/card/{cardId}/move` | `{newColumnId, newPosition}` | `{"success": true}` |

**Important discrepancy:** Backend returns integer IDs but the frontend `boardReducer` and all child components use **string IDs**. This requires a conversion layer.

## Approach

### Option A: Convert backend integer IDs to frontend string IDs at the API boundary (RECOMMENDED)
- Keep all frontend component code and the reducer unchanged — string IDs, string operations
- In BoardContext, convert the API response (integers → strings) before storing in state
- Convert string IDs back to integers when sending requests to the backend
- **Advantage**: Zero changes to `Board.tsx`, `ColumnContainer`, `CardItem`, `CardModal`, or the reducer. Minimal risk of breaking existing UI.
- **Disadvantage**: ID mapping logic lives in BoardContext, but it's simple.

### Option B: Change frontend types to use integer IDs throughout
- This would require touching every component file
- Much higher risk of breaking existing unit tests and UI
- Not recommended for an MVP

### Chosen Approach: Option A
- Keep the entire UI layer (`Board.tsx`, `ColumnContainer.tsx`, `CardItem.tsx`, `CardModal.tsx`, `boardReducer.ts`) unchanged
- Replace only `BoardContext.tsx` to be API-backed with ID conversion
- The reducer (`boardReducer.ts`) stays as-is for local mutations after data is loaded

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/context/BoardContext.tsx` | **Rewrite** | Fetch from `/api/board` on mount; convert int IDs → string IDs; replace each local mutation with an async API call + optimistic local update via `dispatch` |
| `frontend/src/components/Board.tsx` | **Minor update** | Handle `loading` and `error` states from BoardContext; show loading skeleton and error fallback UI |
| `frontend/src/components/BoardHeader.tsx` | **Minor update** | Handle `board: null` gracefully during loading |
| `frontend/src/components/ColumnContainer.tsx` | No change | Works unchanged because IDs are strings (converted by BoardContext) |
| `frontend/src/components/CardItem.tsx` | No change | Works unchanged |
| `frontend/src/components/CardModal.tsx` | No change | Works unchanged |
| `frontend/src/context/boardReducer.ts` | No change | Unchanged — handles local optimistic updates |
| `frontend/src/types/kanban.ts` | No change | Unchanged — string IDs |
| `frontend/src/data/dummyData.ts` | No change | Still used as fallback/empty-state if API fails |

## Detailed Implementation

### 1. BoardContext.tsx (Primary Rewrite)

**New interface:**
```typescript
interface BoardContextType {
  board: Board | null;
  loading: boolean;
  error: string | null;
  moveCard: (cardId, sourceColumnId, destColumnId, newIndex) => Promise<void>;
  addCard: (columnId, title, details) => Promise<void>;
  editCard: (cardId, title, details) => Promise<void>;
  deleteCard: (cardId) => Promise<void>;
  renameColumn: (columnId, title) => Promise<void>;
}
```

**Key changes:**
- Replace `useReducer` with `useState` for board (still use reducer for local optimistic dispatch)
- Keep internal `useReducer(boardReducer, emptyBoard)` for immediate UI feedback
- On mount, fetch `/api/board` and dispatch `SET_BOARD` with converted data
- Each mutation function becomes async: call API, then dispatch the same action for optimistic UI

**ID Conversion Helpers:**
```typescript
// Convert backend integer column IDs to frontend string IDs
// The backend returns columns with integer IDs (1-5)
// Frontend expects string IDs
// Strategy: map DB column IDs to the same string IDs the frontend already uses
// OR: use a simple prefix like "col-{dbId}" and "card-{dbId}"
```
**Decision:** Use `String(id)` conversion — backend returns `"id": 1`, frontend receives `"1"`. All components already work with any string ID, so this is clean.

Wait — the current dummy data uses semantic IDs (`"col-backlog"`, `"card-1"`). The backend returns integer IDs. The `boardReducer` uses these string IDs to find matching columns/cards. Since the reducer just does `col.id === cardId` string comparisons, **any unique string works**. Converting `String(db_id)` (e.g., `"1"`, `"2"`) will work everywhere as long as we're consistent.

**fetchBoard flow:**
1. Call `GET /api/board`
2. Convert response: `board.id = String(board.id)`, each `column.id = String(column.id)`, each `card.id = String(card.id)`
3. Dispatch `{ type: "SET_BOARD", payload: convertedBoard }` to local reducer
4. Set `loading: false`, `error: null`

**addCard flow (optimistic):**
1. Dispatch local `{ type: "ADD_CARD", payload: {columnId, card: {title, details}} }` for immediate UI
2. Call `POST /api/board/card` with `{ columnId: Number(columnId), title, details }`
3. If API fails, revert by re-fetching board from API

**editCard flow:**
1. Call `PUT /api/board/card/{cardId}` with `{ title, details }` (cardId converted to Number)
2. Dispatch local `{ type: "EDIT_CARD", ... }` 
3. On error, revert or re-fetch

**deleteCard flow:**
1. Call `DELETE /api/board/card/{cardId}` (cardId → Number)
2. Dispatch local `{ type: "DELETE_CARD", ... }`
3. On error, re-fetch

**renameColumn flow:**
1. Call `PUT /api/board/column/{columnId}` with `{ title }`
2. Dispatch local `{ type: "RENAME_COLUMN", ... }`
3. On error, revert

**moveCard flow:**
1. Determine destination column ID and index from the drag event
2. Call `PATCH /api/board/card/{cardId}/move` with `{ newColumnId: Number(destColId), newPosition: newIndex }`
3. Dispatch local `{ type: "MOVE_CARD", ... }` for optimistic UI
4. On error, re-fetch board

### 2. Board.tsx (Minor Update)
```typescript
export function Board() {
  const { board, loading, error, moveCard, addCard, editCard, deleteCard, renameColumn } = useBoard();
  
  if (loading) return <BoardLoadingSkeleton />;
  if (error) return <BoardErrorFallback error={error} onRetry={refetchBoard} />;
  if (!board) return <BoardErrorFallback error="No board found" />;
  
  // ... rest unchanged
}
```

### 3. BoardHeader.tsx (Minor Update)
- Guard against `board` being null/undefined during loading: `const { board } = useBoard()` already throws if used outside provider — but board could be null. Add null guard: `if (!board) return null;` or handle gracefully.

### 4. Login flow integration
AuthContext already handles login → redirect to `/`. After login, `page.tsx` renders `BoardProvider` inside `AuthenticatedBoard`. BoardContext's useEffect to fetch board runs on mount. No change needed to the auth flow.

## Testing Strategy

### Phase 1: Frontend Unit Tests (Vitest)
- Existing 26 tests should still pass (they mock BoardContext, Board, etc.)
- Update any mocks that reference `board` as non-null
- May need to update mocks that test board mutations to handle async functions
- Add new tests: BoardContext loading state, error state, API call verification

### Phase 2: Backend Tests (still passing)
- All 25 existing backend tests should pass unchanged

### Phase 3: Integration/E2E Testing (Playwright)
- Run existing `frontend/e2e/kanban.spec.ts` tests — should pass
- These tests already handle login and check for board rendering
- Add tests: refresh page → board data persists, add card → refresh → card still there

### Phase 4: Manual Verification
1. Start backend on port 8001
2. Start frontend dev server
3. Login → board loads with seeded data
4. Add/edit/delete/move/rename all operations
5. Refresh → all changes persist
6. Logout → login → board restored

## Success Criteria
- [ ] BoardContext fetches initial board data from `/api/board` on mount
- [ ] All board mutations call the correct backend API endpoints
- [ ] Board state persists across page refreshes
- [ ] UI/UX is identical to the current local-only implementation
- [ ] Loading and error states are handled gracefully
- [ ] All 26 frontend unit tests pass
- [ ] All 25 backend unit tests pass
- [ ] Existing Playwright E2E tests pass
- [ ] Manual testing confirms persistence across refresh

## Dependencies
- No new dependencies required
- Uses existing `fetch` API (already used in AuthContext)
- Uses existing `next.config.ts` API proxy to backend
- Uses existing `boardReducer.ts` for local optimistic updates

## Risk Mitigation
- The entire UI layer (`Board.tsx`, `ColumnContainer.tsx`, `CardItem.tsx`, `CardModal.tsx`) remains unchanged — risk is isolated to `BoardContext.tsx`
- If the integration causes issues, can fall back to `initialBoard` dummy data
- `boardReducer.ts` is kept unchanged — the `SET_BOARD` action already exists for loading data
- Error handling includes fallback to re-fetch or re-display last known good state