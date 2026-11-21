# 🔍 LectureLens BE & Model Inspector (`TEST/`)
*Thư mục kiểm thử cô lập 100% — Xóa sạch an toàn bất cứ lúc nào mà không ảnh hưởng mã nguồn cốt lõi*

---

## 🎯 Giới Thiệu

Thư mục `TEST/` cung cấp giao diện **LectureLens BE & Model Inspector** (tông màu slate/neutral dịu mắt, mật độ thông tin phân tích cao) và các API kiểm thử cho **cả Offline Ingest Pipeline (`[I1]–[I6]`) và Online 2-Pass Pre-RAG (`[Q1]–[Q6+]`)**:

1. **Top Telemetry & BE Config Strip:** Hiển thị phiên bản `Python / transformers / PyTorch`, thiết bị suy luận (`CPU` / `CUDA VRAM`), `LOW_VRAM_MODE`, `LLM_ENGINE_MODE` (`transformers` / `ollama`), `DB` (`PostgreSQL pgvector` hoặc `InMemory`), `FFmpeg`, `CHUNK_MAX_TOKENS=512 / OVERLAP=64`, `RETRIEVAL_TOP_K`, `GPU_SEMAPHORE=1`, và xác nhận **Semantic Cache OFF (Audit Logs)**.
2. **4-Model Registry & Session Execution Matrix (`11.58 GiB` / `12.43 GB`):** Kiểm tra trực tiếp trọng số thật trong `backend/models/` (không tính `.cache/`), kiến trúc/quantization/ngữ cảnh tối đa, trạng thái `ACTIVE`, tình trạng nạp RAM/VRAM (`LOADED` / `UNLOADED`), và bộ đếm lượt chạy thực tế (`RAN Nx` vs `MOCK Nx`) kèm độ trễ & thiết bị của lượt gần nhất.
3. **Dual Pipeline Blueprint & Live Trace Rail + Audit Table:** Theo dõi luồng chạy trực tiếp qua:
   - **Offline Ingest (`[I1]–[I6]`):** `AudioStore` -> `FFmpeg DSP` -> `EnergyVad` -> `PhoWhisper-medium` -> `VRAM Offload` -> `RecursiveTokenChunker [I5]` -> `BgeM3Embedder [I6] + ChunkStore`.
   - **Online 2-Pass Pre-RAG (`[Q1]–[Q6+]`):** `Gemma 4 E2B Query Prep [Q1]` (với Query Drift Guard) -> `BGE-M3 + 3-Stream RRF [Q2]` -> `3-Way Expand [Q3]` -> `BGE-Reranker-v2-m3 [Q4]` -> `Gemma 4 E2B RAG Synthesis [Q5]` -> `Extra Stages [Q6+]` -> `rag.rag_audit_logs`.
4. **6 Tab Phân Tích Chi Tiết:** `1. Flow & State`, `2. Transcript [S1]` (kèm Audio Player tua click theo `[MM:SS]`), `3. Chunks & Vectors [S2]` (`prev/next_chunk_id`, sparse weights, `halfvec(1024)`), `4. Hybrid Search [Q2]` (bảng breakdown `embed_ms / rrf_ms / context_ms`), `5. 2-Pass Pre-RAG [Q1-Q6+]` (chọn adapter Real/Mock cho từng mô hình, chỉnh prompt Pass 1/Pass 2/preset, thêm `[Q6+]`, xem citations & rerank score), và `6. Artifacts & DB` (`manifest.json` & `rag.rag_audit_logs`).

---

## 🚀 Cách Chạy Kiểm Thử

### Cách 1: Chạy Siêu Tốc Cục Bộ (Không cần Docker)
Từ thư mục gốc của repository, nhấp đúp **`TEST\run_test_local.bat`** hoặc chạy PowerShell:

```powershell
# Chạy bằng script PowerShell (tự cấu hình OMP_NUM_THREADS=4 & LOW_VRAM_MODE=true)
.\TEST\run_test.ps1

# Hoặc chạy trực tiếp bằng Python trong .venv:
.\.venv\Scripts\python.exe TEST/server.py
```

Mở trình duyệt tới **`http://localhost:8090`**.

### Cách 2: Chạy Trọn Gói Bằng 1 Lệnh Docker Compose
Đã tối ưu sẵn cho máy **16 logical CPUs / 16 GB RAM / 4 GB VRAM** (`LOW_VRAM_MODE=true`, `OMP_NUM_THREADS=4`, PostgreSQL `1536M` + AI Model Studio `6G`):

```bash
# Từ thư mục gốc của repo:
docker compose -f TEST/docker-compose.test.yml up --build

# (Tùy chọn) Kiểm chứng toàn bộ schema pgvector 16 + 3-Stream RRF trực tiếp qua mạng Docker:
Get-Content -Raw -Encoding UTF8 backend/db/verify_rag_db.py | docker exec -e PYTHONIOENCODING=utf-8 -e POSTGRES_HOST=test-db -i lecturelens-test-ai-model python -
```
*(Hoặc nhấp đúp **`TEST\run_test_docker.bat`**)*

> **Ghi chú GPU (NVIDIA RTX 3050 4GB VRAM):** Mặc định `docker-compose.test.yml` đặt `DEVICE=auto` và comment khối `deploy.resources.reservations.devices` để không lỗi trên máy chưa cài `nvidia-container-toolkit`. Nếu host có NVIDIA Docker runtime, bỏ comment khối `devices:` trong `TEST/docker-compose.test.yml` (và `backend/docker-compose.ai-dev.yml`) để bật GPU passthrough.

---

## 💡 API Endpoints Nội Bộ Của Test Studio

- `GET /` — Giao diện **LectureLens BE & Model Inspector** (`TEST/templates/index.html`)
- `GET /api/system-diagnostics` — Telemetry runtime, BE config, 4-model registry + session run counters, và dual flow blueprint
- `GET /api/jobs` — Danh sách recent ingest jobs & recent RAG runs trong phiên
- `GET /api/sample-audio` & `GET /api/audio/{job_id}` — Phục vụ file audio mẫu hoặc audio của job
- `POST /api/test-stage2-sample?mode=real|mock` — Chạy nhanh `[I5]->[I6]` trên transcript mẫu 14 phân đoạn
- `POST /api/upload` & `POST /api/process/{job_id}?mode=real|mock&dsp=true&vad=true&prompt=...` — Chạy Full Pipeline `[I1]->[I6]`
- `GET /api/status/{job_id}` & `GET /api/result/{job_id}` — Trạng thái job, transcript, chunks, DB rows, và `trace`
- `POST /api/search` — Truy vấn 3-Stream Hybrid RRF (`{"lectureId": "...", "query": "...", "topK": 5, "mode": "real|mock"}`)
- `GET /api/rag/presets` — Lấy prompt presets Pass 1 `[Q1]` & Pass 2 `[Q5]`
- `POST /api/rag/query` — Thực thi 2-Pass Pre-RAG `[Q1]–[Q6+]` kèm chọn adapter (`embedderMode`, `rerankerMode`, `llmEngine`), trả `flow_trace` & `models_executed`
- `GET /api/rag/telemetry?lecture_id=...` — Xem `rag.rag_audit_logs`

Chạy test tích hợp HTTP seam cho `TEST/server.py`:
```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests/test_test_studio_api.py -v
```

---

## 🧹 Lệnh Xóa Sạch Thư Mục TEST

```powershell
# 1. Dừng container nếu đã chạy qua Docker
docker compose -f TEST/docker-compose.test.yml down -v

# 2. Xóa sạch thư mục TEST
Remove-Item -Recurse -Force TEST
```
