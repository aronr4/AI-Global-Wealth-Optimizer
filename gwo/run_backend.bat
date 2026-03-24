@echo off
echo =======================================================
echo    Booting MCP AI Global Wealth Optimizer Backend
echo =======================================================

cd /d "%~dp0\fastapi_backend"

echo Checking for existing virtual environment...
if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual Environment not found in fastapi_backend\venv!
    pause
    exit /b
)

echo [1/2] Syncing requirements (this may take a few minutes if downloading)...
call venv\Scripts\python.exe -m pip install -r requirements.txt

echo.
echo [2/2] Booting Uvicorn FastAPI Server on Port 8000!
echo Access the RAG Dashboard in React via http://localhost:5173 
echo.
call venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --reload

pause
