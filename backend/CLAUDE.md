# OmniRoute Backend

## Overview

The OmniRoute backend is a Python FastAPI web service powering the OmniRoute Project Management MVP. It provides REST API endpoints for user sessions, Kanban board state, and AI interactions, while also serving the statically-built NextJS frontend from root (`/`).

## Architecture and File Structure

- `backend/main.py`: Main application entry point. Initializes FastAPI, registers modular routers, and mounts static frontend assets when available.
- `backend/config.py`: Configuration and environment loading. Reads `.env` from project root and configures host, port, directory paths, and OpenRouter API keys.
- `backend/routes/api.py`: JSON API router (`/api/...`). Houses health check (`/api/hello`) and future Kanban and AI endpoints.
- `backend/routes/views.py`: View routes for root fallback (`/`) serving hello world HTML when static frontend build is not present.
- `backend/pyproject.toml`: Project metadata and dependency definitions managed via `uv`.
- `backend/uv.lock`: Locked dependency graph for reproducible builds.

## Technology Stack

- Language: Python >= 3.11 (3.13 in Docker)
- Framework: FastAPI
- Server: Uvicorn ASGI server
- Package Manager: uv
- Containerization: Docker (Debian slim + uv binary)

## Local Development

Run locally with uv:
```bash
cd backend
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Docker Container

Build and run via multi-stage Docker (compiles Next.js static export and packages FastAPI backend):
```bash
docker build -t omniroute-backend .
docker run -d --rm -p 8000:8000 --env-file .env omniroute-backend
```

## Start and Stop Scripts

Convenience scripts in `scripts/`:
- Mac: `scripts/start-mac.sh` / `scripts/stop-mac.sh`
- Linux: `scripts/start-linux.sh` / `scripts/stop-linux.sh`
- Windows: `scripts/start-windows.bat` / `scripts/stop-windows.bat`

## Coding Standards

- Keep implementations simple, modular, and idiomatic.
- No emojis anywhere in code, comments, or documentation.
- Maintain frozen lockfile reproducibility with `uv.lock`.
