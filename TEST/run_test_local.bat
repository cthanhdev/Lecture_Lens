@echo off
chcp 65001 > nul
set PYTHONIOENCODING=utf-8
if "%DEVICE%"=="" set DEVICE=auto
if "%LOW_VRAM_MODE%"=="" set LOW_VRAM_MODE=true
if "%OMP_NUM_THREADS%"=="" set OMP_NUM_THREADS=4
if "%MKL_NUM_THREADS%"=="" set MKL_NUM_THREADS=4
if "%TORCH_NUM_THREADS%"=="" set TORCH_NUM_THREADS=4
set TOKENIZERS_PARALLELISM=false

echo =========================================================================
echo 🦊 LectureLens Stage 1 + Stage 2 RAG Lab - Local Python Runner
echo =========================================================================

cd /d "%~dp0\.."

if exist ".venv\Scripts\python.exe" (
    set "PYTHON_CMD=%CD%\.venv\Scripts\python.exe"
) else (
    set "PYTHON_CMD=python"
)

echo [1/2] Đang mở trình duyệt web tới http://localhost:8090...
start "" "http://localhost:8090"

echo [2/2] Đang khởi chạy Test Server trên cổng 8090 (DEVICE=%DEVICE%, LOW_VRAM_MODE=%LOW_VRAM_MODE%)...
"%PYTHON_CMD%" TEST\server.py

pause
