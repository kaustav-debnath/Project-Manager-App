# Part 9a: Slug Routing and Nested Board API

## Goal
Close the three defects reported after Part 9 went live:

1. A newly created project bounced back to `/projects` instead of opening `/projects/MyProjects`.
2. A newly created board bounced back to `/projects` instead of opening `/projects/MyProjects/boards/<id>`.
3. Deleting a board did nothing.

## Root Causes

### The bounce
`output: "export"` can only pre-render the ids it knows at build time, so the export contained
`out/projects/1.html` and `out/projects/1/boards/1.html` and nothing else. `backend/main.py`'s
catch-all fell through to `out/index.html` for every runtime id, so the browser loaded the
**root** route. The root route renders `router.replace("/projects")` (`frontend/src/app/page.tsx`),
which is the bounce.

The Next client router made it worse: the RSC payload request for the same path
(`/projects/1/boards/4.txt`) was answered with the root route's payload, again HTTP 200, so the
app rehydrated the root route. Container logs showed exactly that sequence.

### The dead delete button
`docker logs omniroute-backend | grep -c DELETE` returned **0** for the board delete: the request
never fired. `BoardSelector.handleDelete` was a silent two-step confirm -- the first click only set
a flag, and the only affordance was the icon tinting red. `db.delete_board` also never checked
`cursor.rowcount`, so a failed delete still answered 200.

## Decisions

### One client-rendered route for the whole namespace
`frontend/src/app/projects/[[...path]]/page.tsx` is the only route in the namespace. It exports
`generateStaticParams()` returning `[{ path: [] }]`, so the build emits `out/projects.html` plus
its RSC payload `out/projects.txt`, and nothing else. The browser resolves the slug and board id
from `usePathname()` (`ProjectsApp.tsx`).

`backend/main.py` maps every path in the namespace to that one pair of files:

| Request | Served |
| --- | --- |
| `/projects`, `/projects/<slug>`, `/projects/<slug>/boards/<id>` | `out/projects.html` |
| `/projects*.txt` (RSC payload) | `out/projects.txt` |
| `/login` | `out/login.html` |
| `/_next/...` | the asset file |
| `/api/...` that matches no route | 404 |

The RSC payload matters: serving the wrong page's payload is what rehydrates the wrong route.
With the namespace payload in place, a client-side navigation keeps the canonical URL of the
requested path, and a direct load takes the URL from `window.location`
(`createInitialRouterState` in `next/dist/client/components/router-reducer/`).

### Slugs
A project URL uses the project title with everything but letters and digits removed, case
preserved: `"My Projects"` -> `MyProjects`. A taken slug gets `2`, `3`, ... appended
(`RuntimeProject`, `RuntimeProject2`). The column is added by a migration in `db.init_db()` and
backfilled for existing rows, so old databases keep working.

### Boards are nested under projects
Every board endpoint is scoped by its project. The handlers resolve the project for the session
(`get_project(project_id, user_id)` -> 404) and then the board inside it
(`get_board_for_project(board_id, project_id)` -> 404).

| Method | Path |
| --- | --- |
| GET | `/api/projects/{project_id}/boards/{board_id}` |
| PUT | `/api/projects/{project_id}/boards/{board_id}` |
| DELETE | `/api/projects/{project_id}/boards/{board_id}` |
| POST | `/api/projects/{project_id}/boards/{board_id}/columns/{column_id}/card` |
| PUT | `/api/projects/{project_id}/boards/{board_id}/cards/{card_id}` |
| DELETE | `/api/projects/{project_id}/boards/{board_id}/cards/{card_id}` |
| PUT | `/api/projects/{project_id}/boards/{board_id}/columns/{column_id}` |
| PATCH | `/api/projects/{project_id}/boards/{board_id}/cards/{card_id}/move` |

The legacy flat routes (`/api/board`, `/api/board/card/{id}`, ...) are gone. `db.delete_board`
raises `ValueError` when nothing was deleted, and the route turns that into 404.

### An explicit delete confirmation
`frontend/src/components/ConfirmDialog.tsx` is a modal with Cancel and Delete. The trash button on
a board or a project opens it; Delete performs the request, checks `response.ok`, and shows the
error in the dialog if the request fails.

## Verification

- `uv run python -m pytest tests/ -q` -- 58 backend tests pass, covering slug generation and
  uniqueness, nested board ownership (404 for a board of another project), and delete.
- `npx vitest run` -- 28 frontend unit tests pass.
- `npx playwright test` -- 13 e2e tests pass against `http://localhost:8000`: open a project by
  slug, open a board nested under it, open a project and a board created at runtime, delete a
  board through the confirmation dialog, and the board card/column/drag-and-drop flows. The e2e
  suite creates its own project and board so the seeded data stays untouched and every run starts
  from the same state.
- `docker logs omniroute-backend` shows the `DELETE` request and no 5xx responses.
