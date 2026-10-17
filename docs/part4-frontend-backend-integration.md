# Part 4: Frontend and Backend Integration Plan

## Goal
Statically build the Next.js frontend and serve it from the FastAPI backend at `/`, while keeping `/api` routes intact. Package everything into a multi-stage Docker container and execute comprehensive tests.

## Context
- Frontend (Part 2) is a Next.js app in `frontend/` with client-rendered Kanban board.
- Backend (Part 3) is a FastAPI service in `backend/` running Uvicorn and managed with `uv`.
- Part 4 combines them into a single deployable unit where the FastAPI server serves the compiled Next.js static assets at `/` and backend endpoints at `/api/...`.

## Technology Choices
- Next.js static HTML export (`output: 'export'`)
- FastAPI `StaticFiles` mounted at `/`
- Multi-stage Dockerfile (`node:20-slim` for build, `python:3.13-slim` + `uv` for runtime)
- Cross-platform startup scripts in `scripts/`
- Vitest for unit tests, Playwright for E2E integration tests against FastAPI

## Phase 1: Frontend Static Export
- [ ] Configure `frontend/next.config.ts` for static export (`output: 'export'`, `images: { unoptimized: true }`).
- [ ] Run `npm run build` in `frontend/` and confirm `frontend/out/index.html` is produced.
- [ ] Run `npm test -- --run` in `frontend/` to confirm all unit tests pass.

## Phase 2: Backend Static Serving
- [ ] Update `backend/config.py` to resolve `STATIC_DIR` across local and Docker environments.
- [ ] Update `backend/main.py` to mount `STATIC_DIR` at `/` when built, falling back to `views_router` when not built.
- [ ] Verify `GET /` serves the Next.js Kanban board HTML and `GET /api/hello` continues to return JSON.

## Phase 3: Multi-Stage Dockerfile
- [ ] Update `Dockerfile` to build frontend in `node:20-slim` stage and copy `/app/frontend/out` into `python:3.13-slim` runtime stage.
- [ ] Update `.dockerignore` to ignore `frontend/.next`, `frontend/out`, and `frontend/node_modules`.
- [ ] Verify `docker build -t omniroute-backend .` succeeds.

## Phase 4: Playwright Integration & Start Scripts
- [ ] Update `frontend/playwright.config.ts` to support `PLAYWRIGHT_BASE_URL` override.
- [ ] Update `scripts/start-mac.sh`, `scripts/start-linux.sh`, and `scripts/start-windows.bat` to build frontend if missing in local mode.
- [ ] Run Playwright tests against FastAPI at `http://localhost:8000`.

## Phase 5: Verification & Documentation
- [ ] Run `./scripts/start-mac.sh` and verify endpoints via curl.
- [ ] Confirm Playwright tests pass against running container/backend.
- [ ] Stop backend with `./scripts/stop-mac.sh`.
- [ ] Update `docs/PLAN.md` and commit changes to git.

## Success Criteria
- Next.js builds statically to `frontend/out` with zero errors.
- FastAPI serves Next.js board at `/` and API at `/api/hello`.
- Single Docker container packages both frontend and backend.
- Start and stop scripts work seamlessly with Docker and local fallback.
- All unit and Playwright integration tests pass.
