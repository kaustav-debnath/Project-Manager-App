"""FastAPI backend for the OmniRoute Project Management MVP.

Serves the statically-built NextJS frontend at / and exposes API routes
for the Kanban board. This file is the entry point for Part 3 scaffolding
and will grow through Parts 4-11.
"""

import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles

# Ensure backend directory is in sys.path so modules resolve whether executed
# from within backend/ or from repository root.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from accounts import email_error, name_error, password_error  # noqa: E402
from config import STATIC_DIR  # noqa: E402
from db import (  # noqa: E402
    init_db,
    close_db_connection,
    create_user,
    get_user_by_email,
    get_user_by_id,
    verify_password,
)
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

# Session cookie name
SESSION_COOKIE = "session_id"

# Frontend index.html path
FRONTEND_INDEX = STATIC_DIR / "index.html"


def create_session(user_id: int) -> str:
    """Create a new session for an authenticated user."""
    import secrets

    session_id = secrets.token_urlsafe(32)
    active_sessions[session_id] = {
        "user_id": user_id,
        "created_at": datetime.utcnow().isoformat(),
    }
    return session_id


def sign_out_other_sessions(user_id: int, keep_session_id: str | None) -> None:
    """End every session of a user except the one making the request."""
    for session_id in [
        sid for sid, data in active_sessions.items()
        if data["user_id"] == user_id and sid != keep_session_id
    ]:
        del active_sessions[session_id]


def get_current_user(request: Request) -> dict | None:
    """Get the session for the request's session cookie."""
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        return None
    session = active_sessions.get(session_id)
    if not session:
        return None
    return session


def public_user(account: dict) -> dict:
    """The profile fields that are safe to send to the browser."""
    return {"id": account["id"], "name": account["name"], "email": account["email"]}


def set_session_cookie(response: JSONResponse, session_id: str) -> None:
    """Attach the session cookie to a response."""
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_id,
        httponly=True,
        secure=False,  # Set True in production with HTTPS
        samesite="lax",
        max_age=60 * 60 * 24,  # 24 hours
    )


@app.post("/api/login")
async def login(request: Request):
    """Sign in with email and password."""
    body = await request.json()
    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))

    account = get_user_by_email(email) if email else None
    if account and verify_password(password, account["password_hash"]):
        session_id = create_session(account["id"])
        response = JSONResponse(content={"success": True, "user": public_user(account)})
        set_session_cookie(response, session_id)
        return response
    return JSONResponse(
        content={"success": False, "error": "Invalid email or password"},
        status_code=status.HTTP_401_UNAUTHORIZED,
    )


@app.post("/api/register")
async def register(request: Request):
    """Create an account, sign the new user in and give them a sample project."""
    body = await request.json()
    name = str(body.get("name", "")).strip()
    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))

    error = name_error(name) or email_error(email) or password_error(password)
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    duplicate_detail = "An account with this email already exists"
    if get_user_by_email(email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=duplicate_detail)

    try:
        user_id = create_user(name, email, password)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=duplicate_detail)

    session_id = create_session(user_id)
    response = JSONResponse(
        content={"success": True, "user": public_user(get_user_by_id(user_id))},
        status_code=status.HTTP_201_CREATED,
    )
    set_session_cookie(response, session_id)
    return response


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
    """Check authentication status and return the signed-in user's profile."""
    session = get_current_user(request)
    if session:
        account = get_user_by_id(session["user_id"])
        if account:
            return {"authenticated": True, "user": public_user(account)}
    return {"authenticated": False}


def _is_authenticated(request: Request) -> bool:
    return get_current_user(request) is not None


# Pages anyone can open without signing in
PUBLIC_PAGES = {"login", "register"}


def _resolve_static(path: str) -> Path | None:
    """Map a request path to the exported file that serves it.

    The projects namespace is a single client-rendered route, so every path
    inside it resolves to the same exported page: the browser reads the
    project slug and board id from the URL. The ".txt" variant is the RSC
    payload the Next.js client router requests for client-side navigation.
    """
    is_payload = path.endswith(".txt")
    route = path[:-4] if is_payload else path

    if route == "projects" or route.startswith("projects/"):
        name = "projects.txt" if is_payload else "projects.html"
        candidate = STATIC_DIR / name
        return candidate if candidate.is_file() else None

    if route in {"login", "register", "profile"} and not is_payload:
        candidate = STATIC_DIR / f"{route}.html"
        return candidate if candidate.is_file() else None

    return FRONTEND_INDEX if FRONTEND_INDEX.is_file() else None


@app.api_route("/", methods=["GET", "HEAD"])
async def serve_frontend(request: Request):
    """Serve the statically-built NextJS frontend with auth check."""
    if not _is_authenticated(request):
        return HTMLResponse(content=LOGIN_HTML, status_code=200)
    if FRONTEND_INDEX.is_file():
        return FileResponse(FRONTEND_INDEX)
    return HTMLResponse(content=HELLO_WORLD_HTML)


@app.api_route("/{path:path}", methods=["GET", "HEAD"])
async def catch_all(request: Request, path: str):
    """Catch-all route for SPA routing and static assets."""
    # Serve Next.js static assets without auth check
    if path.startswith("_next/"):
        if STATIC_DIR.is_dir():
            file_path = STATIC_DIR / path
            if file_path.is_file():
                return FileResponse(file_path)
        return HTMLResponse(status_code=404)

    # Unknown API routes are not pages
    if path.startswith("api/"):
        return HTMLResponse(status_code=404)

    # Public pages are served without the auth gate
    if path in PUBLIC_PAGES:
        file_path = _resolve_static(path)
        return FileResponse(file_path) if file_path else HTMLResponse(status_code=404)

    # Require auth for all other routes
    if not _is_authenticated(request):
        return HTMLResponse(content=LOGIN_HTML, status_code=200)

    file_path = _resolve_static(path)
    if file_path is None:
        return HTMLResponse(status_code=404)
    return FileResponse(file_path)
