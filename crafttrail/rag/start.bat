@echo off
echo ================================================
echo   CraftTrail RAG Server
echo ================================================
echo.

REM Check if venv exists
if not exist "venv\Scripts\python.exe" (
    echo [Setup] Creating virtual environment...
    python -m venv venv
    echo [Setup] Installing dependencies (first time, takes 2-3 min)...
    venv\Scripts\python.exe -m pip install -r requirements.txt
)

echo [Ingest] Building knowledge base...
venv\Scripts\python.exe ingest.py

echo.
echo [Server] Starting RAG server at http://localhost:5050
echo          Press Ctrl+C to stop
echo.
venv\Scripts\python.exe app.py
