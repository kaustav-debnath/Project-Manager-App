"""API router for OmniRoute backend."""

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/hello")
async def hello() -> dict[str, str]:
    """JSON API endpoint used to confirm the backend is reachable."""
    return {"message": "hello from omniroute backend"}
