"""Configuration settings for OmniRoute Backend."""

import os
from pathlib import Path


def _load_env_file(env_path: Path) -> None:
    """Load key-value pairs from a .env file into os.environ if not already set."""
    if not env_path.is_file():
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, val = stripped.split("=", 1)
            key = key.strip()
            val = val.strip().strip("\"'")
            if key and key not in os.environ:
                os.environ[key] = val


# Directory paths
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent


def _resolve_static_dir() -> Path:
    """Resolve directory containing built static frontend assets."""
    env_dir = os.getenv("STATIC_DIR")
    if env_dir:
        return Path(env_dir)
    default_root = PROJECT_ROOT / "frontend" / "out"
    if default_root.is_dir():
        return default_root
    backend_sub = BACKEND_DIR / "frontend" / "out"
    if backend_sub.is_dir():
        return backend_sub
    return default_root


STATIC_DIR = _resolve_static_dir()

# Automatically read root .env if present
_load_env_file(PROJECT_ROOT / ".env")

# Settings
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DB_PATH = os.getenv("DB_PATH", "backend/data/omniroute.db")
