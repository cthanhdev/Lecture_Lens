# LectureLens Audio Ingest Lab - PowerShell Runner
$ErrorActionPreference = "Stop"

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

Write-Host "🚀 Đang khởi chạy server trên cổng 8090 (Bấm Ctrl+C để dừng)..." -ForegroundColor Magenta
& $PythonCmd TEST/server.py
