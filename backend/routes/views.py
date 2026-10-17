"""View routes for serving frontend or fallback HTML."""

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["views"])

HELLO_WORLD_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>OmniRoute — Hello World</title>
</head>
<body>
  <main>
    <h1>Hello World</h1>
    <p>OmniRoute backend is running.</p>
  </main>
</body>
</html>
"""


@router.get("/", response_class=HTMLResponse)
async def root() -> str:
    """Example static HTML — hello world page."""
    return HELLO_WORLD_HTML
