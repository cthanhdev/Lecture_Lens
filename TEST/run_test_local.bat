@echo off
chcp 65001 > nul
set PYTHONIOENCODING=utf-8
echo =========================================================================
echo 🦊 LectureLens Audio Ingest Lab - Local Python Runner
echo =========================================================================

cd /d "%~dp0\.."

if exist ".venv\Scripts\python.exe" (
    set "PYTHON_CMD=%CD%\.venv\Scripts\python.exe"
) else (
    set "PYTHON_CMD=python"
)

echo [1/2] Đang mở trình duyệt web tới http://localhost:8090...
start "" "http://localhost:8090"

echo [2/2] Đang khởi chạy Test Server trên cổng 8090...
"%PYTHON_CMD%" TEST\server.py

pause
