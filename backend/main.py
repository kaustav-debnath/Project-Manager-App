"""FastAPI backend for the OmniRoute Project Management MVP.

Serves the statically-built NextJS frontend at / and exposes API routes
for the Kanban board. This file is the entry point for Part 3 scaffolding
and will grow through Parts 4-11.
"""

import os
import sys
from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

# Ensure backend directory is in sys.path so modules resolve whether executed
# from within backend/ or from repository root.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import STATIC_DIR  # noqa: E402
from db import init_db, close_db_connection, get_default_user_id  # noqa: E402
from routes.api import router as api_router  # noqa: E402
from routes.views import router as views_router, LOGIN_HTML, HELLO_WORLD_HTML  # noqa: E402

app = FastAPI(title="OmniRoute Backend")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Register API router
app.include_router(api_router)

# Session store for MVP (in-memory, for demo purposes)
# In production, this would use Redis or database-backed sessions
active_sessions: dict[str, dict] = {}

# Credentials for MVP (hardcoded as per requirements)
VALID_USERNAME = "user"
VALID_PASSWORD = "password"

# Session cookie name
SESSION_COOKIE = "session_id"

# Frontend index.html path
FRONTEND_INDEX = STATIC_DIR / "index.html"


def create_session(username: str) -> str:
    """Create a new session for authenticated user."""
    import secrets

    session_id = secrets.token_urlsafe(32)
    active_sessions[session_id] = {
        "username": username,
        "created_at": datetime.utcnow().isoformat(),
    }
    return session_id


def get_current_user(request: Request) -> dict | None:
    """Get current user from session cookie."""
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        return None
    session = active_sessions.get(session_id)
    if not session:
        return None
    return session


@app.post("/api/login")
async def login(request: Request):
    """Login endpoint with hardcoded credentials for MVP."""
    body = await request.json()
    username = body.get("username", "")
    password = body.get("password", "")

    if username == VALID_USERNAME and password == VALID_PASSWORD:
        session_id = create_session(str(username))
        response = JSONResponse(content={"success": True, "username": username})
        response.set_cookie(
            key=SESSION_COOKIE,
            value=session_id,
            httponly=True,
            secure=False,  # Set True in production with HTTPS
            samesite="lax",
            max_age=60 * 60 * 24,  # 24 hours
        )
        return response
    else:
        return JSONResponse(
            content={"success": False, "error": "Invalid username or password"},
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


@app.post("/api/logout")
async def logout(request: Request):
    """Logout endpoint - clears session."""
    session_id = request.cookies.get(SESSION_COOKIE)
    if session_id and session_id in active_sessions:
        del active_sessions[session_id]

    response = JSONResponse(content={"success": True})
    response.delete_cookie(SESSION_COOKIE)
    return response


@app.get("/api/auth/status")
async def auth_status(request: Request):
    """Check authentication status."""
    user = get_current_user(request)
    if user:
        return {"authenticated": True, "username": user["username"]}
    return {"authenticated": False}


def _is_authenticated(request: Request) -> bool:
    return get_current_user(request) is not None


@app.get("/")
async def serve_frontend(request: Request):
    """Serve the statically-built NextJS frontend with auth check."""
    if not _is_authenticated(request):
        return HTMLResponse(content=LOGIN_HTML, status_code=200)
    if FRONTEND_INDEX.is_file():
        return HTMLResponse(content=FRONTEND_INDEX.read_text(encoding="utf-8"))
    return HTMLResponse(content=HELLO_WORLD_HTML)


@app.get("/{path:path}")
async def catch_all(request: Request, path: str):
    """Catch-all route for SPA routing and static assets."""
    # Serve Next.js static assets without auth check
    if path.startswith("_next/"):
        if STATIC_DIR.is_dir():
            file_path = STATIC_DIR / path
            if file_path.is_file():
                return HTMLResponse(
                    content=file_path.read_text(encoding="utf-8"),
                    media_type="text/plain",
                )
        return HTMLResponse(status_code=404)

    # Require auth for all other routes
    if not _is_authenticated(request):
        return HTMLResponse(content=LOGIN_HTML, status_code=200)
    if FRONTEND_INDEX.is_file():
        return HTMLResponse(content=FRONTEND_INDEX.read_text(encoding="utf-8"))
    return HTMLResponse(content=HELLO_WORLD_HTML)
