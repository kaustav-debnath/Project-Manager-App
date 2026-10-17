@echo off
setlocal

rem Navigate to repository root
cd /d "%~dp0\.."

set CONTAINER_NAME=omniroute-backend
set PORT=8000

rem Check if container is already running
docker inspect -f "{{.State.Running}}" %CONTAINER_NAME% 2>nul | findstr "true" >nul
if %ERRORLEVEL% equ 0 (
    echo OmniRoute backend container is already running.
    goto check_health
)

rem Check Docker availability
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker not available. Falling back to local uv run...
    if not exist frontend\out\index.html (
        echo Building frontend static assets...
        cd frontend && call npm run build && cd ..
    )
    cd backend
    start /b uv run uvicorn main:app --host 0.0.0.0 --port %PORT%
    cd ..
    goto check_health
)

echo Building Docker image %CONTAINER_NAME%...
docker build -t %CONTAINER_NAME% .
if %ERRORLEVEL% neq 0 (
    echo Docker build failed.
    exit /b 1
)

echo Starting Docker container %CONTAINER_NAME%...
if exist .env (
    docker run -d --rm --name %CONTAINER_NAME% -p %PORT%:8000 --env-file .env %CONTAINER_NAME%
) else (
    docker run -d --rm --name %CONTAINER_NAME% -p %PORT%:8000 %CONTAINER_NAME%
)

:check_health
echo Waiting for service at http://localhost:%PORT%...
set /a retries=20
:retry_loop
curl -s -f http://localhost:%PORT%/api/hello >nul 2>&1
if %ERRORLEVEL% equ 0 (
    curl -s -f http://localhost:%PORT%/ >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo OmniRoute backend started successfully.
        echo Root: http://localhost:%PORT%/
        echo API:  http://localhost:%PORT%/api/hello
        exit /b 0
    )
)
timeout /t 1 /nobreak >nul
set /a retries-=1
if %retries% gtr 0 goto retry_loop

echo Error: Backend failed to start within timeout.
exit /b 1
