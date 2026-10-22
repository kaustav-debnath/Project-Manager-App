# Multi-stage Dockerfile for OmniRoute (FastAPI backend + static Next.js frontend)

# Stage 1: Build the Next.js static export
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build the FastAPI backend and serve static frontend
FROM python:3.13-slim

WORKDIR /app

# Install uv using the official standalone binary
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy Python dependency specifications first for layer caching
COPY backend/pyproject.toml backend/uv.lock /app/

# Install Python dependencies using frozen lockfile
RUN uv sync --frozen --no-cache --no-dev

# Copy backend application code
COPY backend/ /app/

# Copy static frontend build from builder stage
COPY --from=frontend-builder /app/frontend/out /app/frontend/out

# Configure static directory and virtualenv path
ENV STATIC_DIR="/app/frontend/out"
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

# Shell form so ${PORT} is expanded: Railway assigns the port at runtime
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
