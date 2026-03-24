@echo off
title MCP AI Stock Optimizer - Mobile Launcher

echo =========================================================
echo    MCP AI Global Wealth Optimizer - Mobile Launcher
echo =========================================================
echo.
echo  This launcher exposes your project to your Local Network
echo  so you can access it from your Mobile Phone!
echo.

REM ---- Check Backend Virtual Environment ----
if not exist "%~dp0fastapi_backend\venv\Scripts\python.exe" (
    echo [ERROR] Backend virtual environment NOT found!
    echo Expected at: fastapi_backend\venv\
    pause
    exit /b 1
)

REM ---- Get Local IP Address ----
echo Finding your Local IP Address...
for /f "tokens=14" %%a in ('ipconfig ^| findstr IPv4') do set LOCAL_IP=%%a
echo.
echo Your Local IP is: %LOCAL_IP%
echo.

echo [1/2] Starting FastAPI Backend on http://0.0.0.0:8000 ...
start "FastAPI Backend (Mobile Enabled)" cmd /k "cd /d "%~dp0fastapi_backend" && venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --reload"

echo [2/2] Starting React Frontend on http://0.0.0.0:5173 ...
timeout /t 3 /nobreak >nul
start "React Frontend (Mobile Enabled)" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host"

echo.
echo =========================================================
echo  SERVERS RUNNING!
echo.
echo  ON YOUR PHONE: (Must be on the same Wi-Fi as this PC)
echo  Open your browser and go to:
echo  http://%LOCAL_IP%:5173
echo =========================================================
echo.
timeout /t 5 /nobreak >nul
start http://%LOCAL_IP%:5173

pause
