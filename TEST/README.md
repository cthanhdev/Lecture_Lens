# 🧪 LectureLens Stage 1 & Stage 2 Verification Studio (`TEST/`)
*Thư mục kiểm thử cô lập 100% — Xóa sạch an toàn bất cứ lúc nào mà không ảnh hưởng mã nguồn cốt lõi*

---

## 🎯 Giới Thiệu

Thư mục `TEST/` cung cấp giao diện Web trực quan (phong cách **Kitsune Soft**) và API thử nghiệm cho **toàn bộ Pipeline Stage 1 + Stage 2**:

1. **Stage 1 (Audio Ingest & ASR):** Chuẩn hóa âm thanh qua FFmpeg (`16kHz Mono PCM` + khử nhiễu DSP) $\rightarrow$ Cắt khoảng lặng tự nhiên VAD $\rightarrow$ Nhận dạng giọng nói tiếng Việt qua **PhoWhisper** $\rightarrow$ Sinh `transcript.json`.
2. **Stage 2 (`[I5]` Chunking + `[I6]` BGE-M3 + ChunkStore):**
   - **RecursiveTokenChunker (`[I5]`):** Chia đoạn tối đa `<= 512` tokens (510 payload + 2 special tokens), giữ **overlap 64 tokens**, nội suy timestamp `[MM:SS]` và liên kết 2 chiều `prev_chunk_id` / `next_chunk_id`.
   - **BgeM3Embedder (`[I6]`):** Tải trọng số `backend/models/bge-m3` trực tiếp qua `transformers` + `sparse_linear.pt` (không cần `FlagEmbedding`) để sinh đồng thời **`halfvec(1024)` FP16 L2-normalized** và **`lexical_weights` JSONB**.
   - **ChunkStore & 3-Stream Hybrid RRF:** Lưu trữ vào PostgreSQL 16 `pgvector` (hoặc tự động fallback `InMemoryChunkStore` khi DB offline), hỗ trợ truy vấn tiếng Việt **có dấu hoặc không dấu** kèm mở rộng ngữ cảnh 3 chiều (`PREVIOUS` / `CURRENT` / `NEXT`).

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

## 💡 Hướng Dẫn Sử Dụng & Endpoints

### Trên Giao Diện Web (`http://localhost:8090`)
- **Thanh Diagnostics trên cùng:** Kiểm tra tức thì trạng thái **FFmpeg**, **Device / VRAM (`LOW_VRAM_MODE`)**, **PhoWhisper**, **BGE-M3 (+ `sparse_linear.pt`)**, và **PgVector DB**.
- **Nút "⚡ Test Nhanh Stage 2 (Chunking [I5] + BGE-M3 [I6] Thật)":** Tạo tức thì `transcript.json` bài giảng Đại học Tiếng Việt gồm 14 phân đoạn (Mạng Máy Tính, Active Directory, Đại Số Tuyến Tính, Gradient Descent) và chạy thật `[I5]` + `[I6]` + `ChunkStore` trong vài giây mà không cần chờ ASR audio. (Có thêm nút **Mock (<50ms)** để smoke test tức thời).
- **Chạy Full Pipeline 6 Bước:** Kéo thả audio (hoặc nạp `sample_lecture_vi.wav`) $\rightarrow$ theo dõi thanh tiến độ `1. Tiếp nhận` $\rightarrow$ `2. Khử Nhiễu DSP` $\rightarrow$ `3. PhoWhisper ASR` $\rightarrow$ `4. Chunking [I5]` $\rightarrow$ `5. BGE-M3 [I6]` $\rightarrow$ `6. DB & READY`.
- **6 Tab Kiểm Tra Chi Tiết:**
  1. `📜 Lời Thoại ASR (Segments)`: Danh sách segment kèm nút `[MM:SS]` bấm để phát đúng đoạn audio.
  2. `🧩 Chunks [I5] & BGE-M3 [I6]`: Kiểm tra số token `<= 512`, liên kết nhảy tới `prev_chunk_id` / `next_chunk_id`, các pill `lexical_weights`, chuẩn L2 norm và 12 chiều đầu của `embedding_half`.
  3. `🔍 Tìm Kiếm 3-Stream Hybrid RRF`: Nhập truy vấn **không dấu hoặc có dấu**, xem `rrf_total_score`, `dense_score`, `lexical_rank`, `fuzzy_rank`, và ngữ cảnh mở rộng 3 chiều (`PREVIOUS` / `CURRENT` / `NEXT`).
  4. `📄 JSON Artifacts`: Xem, copy và tải về `transcript.json` & `chunks.json`.
  5. `🏷️ File manifest.json`: Xem trạng thái tổng thể của `stt` và `chunking`.
  6. `🐘 Database (app.jobs & rag.lecture_chunks)`: Xem trạng thái kết nối DB thực tế và bảng phân đoạn đã lưu.

### API Endpoints Nội Bộ Của Test Studio
- `GET /api/system-diagnostics`
- `POST /api/test-stage2-sample?mode=real|mock`
- `POST /api/upload` & `POST /api/process/{job_id}?mode=real|mock`
- `GET /api/status/{job_id}` & `GET /api/result/{job_id}`
- `POST /api/search` (`{"lecture_id": "...", "query": "...", "top_k": 5, "mode": "real"}`)

---

## 🧹 Lệnh Xóa Sạch Thư Mục TEST

```powershell
# 1. Dừng container nếu đã chạy qua Docker
docker compose -f TEST/docker-compose.test.yml down -v

# 2. Xóa sạch thư mục TEST
Remove-Item -Recurse -Force TEST
```
