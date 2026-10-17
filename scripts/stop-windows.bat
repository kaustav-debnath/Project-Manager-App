@echo off
setlocal

set CONTAINER_NAME=omniroute-backend

echo Stopping OmniRoute backend...
docker stop %CONTAINER_NAME% >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo OmniRoute backend stopped.
) else (
    echo OmniRoute backend was not running.
)
exit /b 0
