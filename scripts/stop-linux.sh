#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CONTAINER_NAME="omniroute-backend"
STOPPED=0

# Stop Docker container if running
if command -v docker >/dev/null 2>&1; then
  if docker ps -q -f "name=^/${CONTAINER_NAME}$" | grep -q .; then
    echo "Stopping Docker container $CONTAINER_NAME..."
    docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
    STOPPED=1
  fi
fi

# Stop local process if running via .backend.pid
if [ -f "$PROJECT_ROOT/.backend.pid" ]; then
  LOCAL_PID="$(cat "$PROJECT_ROOT/.backend.pid")"
  if kill -0 "$LOCAL_PID" >/dev/null 2>&1; then
    echo "Stopping local backend process (PID $LOCAL_PID)..."
    kill "$LOCAL_PID" >/dev/null 2>&1 || true
    STOPPED=1
  fi
  rm -f "$PROJECT_ROOT/.backend.pid"
fi

# Free port 8000 if still active
if command -v fuser >/dev/null 2>&1; then
  fuser -k 8000/tcp >/dev/null 2>&1 || true
elif command -v lsof >/dev/null 2>&1; then
  PORT_PID=$(lsof -ti :8000 2>/dev/null || true)
  if [ -n "$PORT_PID" ]; then
    echo "Freeing port 8000 (PID $PORT_PID)..."
    kill -9 "$PORT_PID" >/dev/null 2>&1 || true
    STOPPED=1
  fi
fi

if [ "$STOPPED" -eq 1 ]; then
  echo "OmniRoute backend stopped."
else
  echo "OmniRoute backend was not running."
fi
