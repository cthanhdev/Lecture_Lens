@echo off
chcp 65001 > nul
echo =========================================================================
echo 🐳 LectureLens Stage 1 + Stage 2 Model Runner - Docker Compose Launcher
echo =========================================================================

cd /d "%~dp0"

echo [1/2] Đang khởi chạy Docker Compose (PostgreSQL 16 pgvector + PhoWhisper/BGE-M3 Studio)...
docker compose -f docker-compose.test.yml up --build -d

if %errorlevel% neq 0 (
    echo.
    echo ❌ Không thể khởi chạy Docker Compose.
    echo 💡 Hãy chắc chắn bạn đã mở Docker Desktop trên máy tính!
    echo 👉 Bạn có thể chạy thử nghiệm qua Python cục bộ bằng: TEST\run_test_local.bat
    echo.
    pause
    exit /b %errorlevel%
)

echo [2/2] Đang mở trình duyệt tới http://localhost:8090...
start "" "http://localhost:8090"

echo.
echo ✅ Hệ thống đã chạy thành công trong Docker!
echo 🌐 Giao diện TEST Studio: http://localhost:8090
echo 🐘 PostgreSQL + pgvector: localhost:5432 (db=lecturelens_db, user=ll_admin)
echo 🛑 Để dừng container: docker compose -f TEST\docker-compose.test.yml down
echo.
pause
