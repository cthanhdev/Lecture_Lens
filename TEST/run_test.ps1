# LectureLens Audio Ingest & Stage 2 RAG Lab - PowerShell Runner
$ErrorActionPreference = "Stop"

# Set UTF-8 Console Encoding
$env:PYTHONIOENCODING = "utf-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Hardware & Threading Optimization (16 logical CPUs / 16 GB RAM / 4 GB VRAM)
if (-not $env:DEVICE) { $env:DEVICE = "auto" }
if (-not $env:LOW_VRAM_MODE) { $env:LOW_VRAM_MODE = "true" }
if (-not $env:OMP_NUM_THREADS) { $env:OMP_NUM_THREADS = "4" }
if (-not $env:MKL_NUM_THREADS) { $env:MKL_NUM_THREADS = "4" }
if (-not $env:TORCH_NUM_THREADS) { $env:TORCH_NUM_THREADS = "4" }
$env:TOKENIZERS_PARALLELISM = "false"

# Navigate to project root
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $ProjectRoot

# Locate Python in .venv
$VenvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"

if (Test-Path $VenvPython) {
    $PythonCmd = $VenvPython
    Write-Host "✅ Đã tìm thấy Python trong môi trường ảo: $PythonCmd" -ForegroundColor Green
} else {
    $PythonCmd = "python"
    Write-Host "⚠️ Không tìm thấy .venv, thử dùng python toàn cục..." -ForegroundColor Yellow
}

Write-Host "🌐 Đang mở trình duyệt tới http://localhost:8090..." -ForegroundColor Cyan
Start-Process "http://localhost:8090"

Write-Host "🚀 Đang khởi chạy LectureLens TEST Studio (Stage 1 ASR + Stage 2 Chunking/BGE-M3) trên cổng 8090..." -ForegroundColor Magenta
& $PythonCmd TEST/server.py
