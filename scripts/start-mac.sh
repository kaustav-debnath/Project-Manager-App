#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

CONTAINER_NAME="omniroute-backend"
PORT="8000"

# Stop any existing container with the same name
if command -v docker >/dev/null 2>&1; then
  if docker ps -q -f "name=^/${CONTAINER_NAME}$" | grep -q .; then
    echo "Stopping existing $CONTAINER_NAME container..."
    docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
fi

# Determine if Docker is available
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "Starting backend via Docker..."
  docker build -t "$CONTAINER_NAME" .

  ENV_ARGS=()
  if [ -f ".env" ]; then
    ENV_ARGS=(--env-file ".env")
  fi

  docker run -d --rm --name "$CONTAINER_NAME" -p "$PORT:8000" "${ENV_ARGS[@]}" "$CONTAINER_NAME"
else
  echo "Docker not available. Falling back to local uv run..."
  if [ -f ".backend.pid" ]; then
    OLD_PID="$(cat .backend.pid)"
    kill "$OLD_PID" >/dev/null 2>&1 || true
    rm -f .backend.pid
  fi

  if [ ! -f "$PROJECT_ROOT/frontend/out/index.html" ]; then
    echo "Building frontend static assets..."
    (cd "$PROJECT_ROOT/frontend" && npm run build)
  fi

  cd "$PROJECT_ROOT/backend"
  uv run uvicorn main:app --host 0.0.0.0 --port "$PORT" >/tmp/omniroute-backend.log 2>&1 &
  echo $! > "$PROJECT_ROOT/.backend.pid"
  cd "$PROJECT_ROOT"
fi

# Wait for backend and frontend to be healthy
echo "Waiting for service at http://localhost:$PORT..."
MAX_ATTEMPTS=20
ATTEMPT=0
READY=0

while [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ]; do
  if curl -sf "http://localhost:$PORT/api/hello" >/dev/null 2>&1 && curl -sf "http://localhost:$PORT/" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
  ATTEMPT=$((ATTEMPT + 1))
done

if [ "$READY" -eq 1 ]; then
  echo "OmniRoute backend started successfully."
  echo "Root: http://localhost:$PORT/"
  echo "API:  http://localhost:$PORT/api/hello"
else
  echo "Error: Backend failed to start within timeout."
  exit 1
fi
