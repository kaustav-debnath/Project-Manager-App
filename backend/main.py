"""FastAPI backend for the OmniRoute Project Management MVP.

Serves the statically-built NextJS frontend at / and exposes API routes
for the Kanban board. This file is the entry point for Part 3 scaffolding
and will grow through Parts 4-11.
"""

import os
import sys
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

# Ensure backend directory is in sys.path so modules resolve whether executed
# from within backend/ or from repository root.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import STATIC_DIR  # noqa: E402
from routes.api import router as api_router  # noqa: E402
from routes.views import router as views_router  # noqa: E402

app = FastAPI(title="OmniRoute Backend")

# Register API router
app.include_router(api_router)


def mount_static_or_fallback() -> None:
    """Mount the statically-built NextJS frontend if present; otherwise fallback to views."""
    index_file = STATIC_DIR / "index.html"
    if STATIC_DIR.is_dir() and index_file.is_file():
        app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
    else:
        app.include_router(views_router)


mount_static_or_fallback()
