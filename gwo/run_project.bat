@echo off
title MCP AI Stock Optimizer - Project Launcher

echo =========================================================
echo    MCP AI Global Wealth Optimizer - Project Launcher
echo =========================================================
echo.

REM ---- Check Backend Virtual Environment ----
if not exist "%~dp0fastapi_backend\venv\Scripts\python.exe" (
    echo [INFO] Backend virtual environment NOT found! Creating one now...
    cd /d "%~dp0fastapi_backend"
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment! Make sure Python is installed.
        pause
        exit /b 1
    )
    cd /d "%~dp0"
)

echo [INFO] Checking/Installing backend dependencies...
cd /d "%~dp0fastapi_backend"
venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies!
    pause
    exit /b 1
)
cd /d "%~dp0"
echo [SUCCESS] Backend environment setup complete!

REM ---- Check Node/NPM ----
call npm -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm/Node.js NOT found! Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM ---- Check frontend node_modules ----
if not exist "%~dp0frontend\node_modules" (
    echo [INFO] node_modules not found. Running initial setup...
)
echo [INFO] Checking/Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)
cd /d "%~dp0"

echo [1/2] Starting FastAPI Backend on http://0.0.0.0:8000 ...
start "FastAPI Backend" cmd /k "cd /d "%~dp0fastapi_backend" && venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --reload"

echo [2/2] Starting React Frontend on http://localhost:5173 ...
timeout /t 3 /nobreak >nul
start "React Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo =========================================================
echo  Both servers are starting in separate windows!
echo  Backend  -^> http://localhost:8000
echo  Frontend -^> http://localhost:5173
echo  API Docs -^> http://localhost:8000/docs
echo =========================================================
echo  Wait ~15 seconds for the backend to fully load models...
echo.
timeout /t 5 /nobreak >nul
start http://localhost:5173

pause
