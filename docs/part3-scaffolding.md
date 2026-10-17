# Part 3: Scaffolding Plan

## Goal
Set up the Python FastAPI backend packaged in Docker, start/stop scripts for Mac, PC, and Linux, and serve example static HTML to confirm hello world works and make an API call.

## Context
- Frontend (Part 2) is already built, tested, and validated in `frontend/`.
- Part 4 will statically build NextJS and serve it from FastAPI at `/`.
- Part 3 keeps it simple: FastAPI backend serving example static HTML plus one JSON API endpoint, runnable in Docker.

## Technology Choices
- Python FastAPI backend
- `uv` as the Python package manager (in Docker)
- uvicorn ASGI server
- Docker container packaging everything

## Phase 1: Backend Scaffold
- [x] Create `backend/pyproject.toml` defining `fastapi` and `uvicorn` deps via `uv`
- [x] Create `backend/main.py` FastAPI app:
  - `GET /` -> example static HTML (hello world page)
  - `GET /api/hello` -> JSON response (API call check)
- [x] Create `.env` at project root with `OPENROUTER_API_KEY`
- [x] Create multiple backend py files for each functionality

## Phase 2: Docker
- [x] Create `Dockerfile` at project root using Python slim image, `uv sync --frozen`, run `uvicorn`
- [x] Confirm `docker build` succeeds
- [x] Confirm container runs and serves hello world at `http://localhost:8000/`
- [x] Confirm `http://localhost:8000/api/hello` returns JSON

## Phase 3: Start/Stop Scripts (in `scripts/`)
- [x] `scripts/start-mac.sh` — start backend (Docker or local) on Mac
- [x] `scripts/start-linux.sh` — start backend on Linux
- [x] `scripts/start-windows.bat` — start backend on Windows
- [x] `scripts/stop-mac.sh` — stop backend on Mac
- [x] `scripts/stop-linux.sh` — stop backend on Linux
- [x] `scripts/stop-windows.bat` — stop backend on Windows
- [x] Scripts start/stop the FastAPI backend and confirm it's reachable

## Phase 4: Verification
- [x] Hello world static HTML served at `/`
- [x] API call to `/api/hello` returns JSON
- [x] Backend starts via scripts on Mac and Linux (Windows script authored)
- [x] Project root `.env` contains `OPENROUTER_API_KEY`
- [x] `backend/CLAUDE.md` updated with backend description
- [x] All Part 3 files committed to git

## Success Criteria
- FastAPI backend runs inside a Docker container built with `uv`
- `GET /` serves example static HTML
- `GET /api/hello` returns JSON
- Start/stop scripts exist for Mac, PC, Linux and work
- `OPENROUTER_API_KEY` present in `.env` at project root
- Frontend remains untouched (already validated)
