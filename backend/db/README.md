# 🐘 Kiến Trúc Cơ Sở Dữ Liệu pgvector 0.7.0+ Cho RAG Tiếng Việt (LectureLens)

Tài liệu này đặc tả toàn bộ kiến trúc cơ sở dữ liệu chuyên biệt cho hệ thống **2-Stage Neural RAG** của LectureLens, vận hành trên **PostgreSQL 16 + pgvector 0.7.0+** trong phân vùng `schema rag`.

---

## 📑 Danh Mục Tệp Khởi Tạo (`backend/db/`)

```
backend/db/
├── postgresql.conf                      # Cấu hình bộ nhớ, WAL, và tham số HNSW tối ưu cho 16-32GB RAM
├── rag_schema_complete.sql              # Tệp SQL duy nhất chứa toàn bộ schema, bảng, index và hàm
├── verify_rag_db.py                     # Script Python tự động kiểm thử và xác minh toàn bộ tính năng RAG
│
└── init/                                # Thư mục nạp tự động của Docker (docker-entrypoint-initdb.d)
    ├── 01_rag_extensions.sql            # Kích hoạt vector, unaccent, pg_trgm, uuid-ossp & hàm IMMUTABLE (immutable_unaccent, format_timestamp_display)
    ├── 02_rag_chunks_schema.sql         # Bảng rag.lecture_chunks chuẩn hóa tiếng Việt & BGE-M3
    ├── 03_rag_indexes.sql               # Chỉ mục HNSW halfvec(1024), GIN Trigram, GIN TSVector
    ├── 04_rag_hybrid_search_rrf.sql     # Hàm Hybrid Search 3 luồng (RRF) & Context Expansion ("position")
    ├── 05_rag_telemetry_cache.sql       # Bảng Semantic Query Cache & Audit Logs
    └── 06_app_jobs_status_migration.sql # Bổ sung trạng thái STT_COMPLETED, CHUNKING, EMBEDDING cho app.jobs (ADR 0002 & 0004)
```

---

## 🎯 4 Đặc Điểm Đột Phá Cho Tiếng Việt & BGE-M3

### 1. Kiểu Dữ Liệu `halfvec(1024)` (FP16)
- BGE-M3 sinh ra vector 1024 chiều. Thay vì dùng `vector(1024)` (32-bit float, 4096 bytes/vector), pgvector 0.7.0+ cung cấp `halfvec(1024)` (16-bit float, 2048 bytes/vector).
- **Lợi ích:** Tiết kiệm 50% dung lượng RAM của cây đồ thị HNSW, tốc độ tìm kiếm vector tăng ~1.8 lần mà vẫn đảm bảo độ chính xác (Recall) trên **99.2%**.

### 2. Định Dạng Thời Gian & Căn Chỉnh PhoWhisper Tự Động
- Bảng lưu giữ mốc giây chính xác đến mili-giây: `start_time_seconds NUMERIC(10, 3)`.
- Các cột `GENERATED ALWAYS AS (...) STORED` dùng hàm **`rag.format_timestamp_display(seconds numeric)`** (`IMMUTABLE PARALLEL SAFE STRICT` — thay thế cho `to_char(interval, text)` vốn có mức `STABLE` nên bị PostgreSQL 16 từ chối trong biểu thức cột sinh tự động):
  - Dưới 1 giờ (`< 3600s`): định dạng `[MM:SS]`, ví dụ `start_timestamp_display = '01:15'`, `end_timestamp_display = '02:15'`.
  - Từ 1 giờ trở lên (`>= 3600s`): định dạng `[HH:MM:SS]`.
  - Trực tiếp dùng cho giao diện phát âm thanh (Capsule Audio Player) và dẫn chứng trích dẫn (Citation) của LLM mà không cần chuyển đổi ở code backend.

### 3. Tìm Kiếm Lai 3 Luồng (Hybrid Search RRF)
Kết hợp 3 chiều thông tin:
1. **Dense Vector:** Khái niệm ngữ nghĩa trừu tượng qua BGE-M3 và HNSW Cosine.
2. **Lexical Full-Text:** Từ khóa chính xác qua PostgreSQL `tsvector`.
3. **Fuzzy Trigram:** Tìm kiếm mờ viết tắt và câu hỏi **không dấu** qua `pg_trgm` + `unaccent`.

Hợp nhất bằng thuật toán **Reciprocal Rank Fusion (RRF)**:
$$\text{RRF Score}(d) = \sum_{m \in \{\text{dense, lexical, fuzzy}\}} \frac{1}{60 + \text{rank}_m(d)}$$

### 4. Mở Rộng Ngữ Cảnh (Context Expansion / Linked Chunks)
Mỗi phân đoạn giữ liên kết 2 chiều với đoạn liền trước (`prev_chunk_id`) và đoạn liền sau (`next_chunk_id`). Hàm `rag.get_expanded_context(chunk_id)` trích xuất tức thì ngữ cảnh 3 phút trọn vẹn của giảng viên cung cấp cho LLM Gemma 4 E4B.

---

## 🚀 Hướng Dẫn Sử Dụng & Triển Khai

### Cách 1: Khởi Chạy Tự Động Qua Docker Compose

> [!TIP]
> Môi trường dev có sẵn [`backend/docker-compose.ai-dev.yml`](../docker-compose.ai-dev.yml). Tệp này mount `rag_schema_complete.sql` và `init/06_app_jobs_status_migration.sql` vào container `db`, rồi khởi chạy cùng container `ai` (FastAPI) trên mạng `rag-internal-network`:
> ```bash
> docker compose -f backend/docker-compose.ai-dev.yml up --build
> ```

Hoặc tự cấu hình Docker Compose để mount thư mục `backend/db/init/` vào thư mục khởi tạo của PostgreSQL container:

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    container_name: lecturelens-db
    environment:
      POSTGRES_DB: lecturelens_db
      POSTGRES_USER: ll_admin
      POSTGRES_PASSWORD: ll_secure_password_2026
    volumes:
      - ./db/init:/docker-entrypoint-initdb.d:ro
      - ./db/postgresql.conf:/etc/postgresql/postgresql.conf:ro
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
```

### Cách 2: Thực Thi Trực Tiếp Bằng Tệp Tổng Hợp (`psql`)
Nếu bạn đã có sẵn PostgreSQL 16 chạy trên máy chủ:

```bash
psql -U ll_admin -d lecturelens_db -f backend/db/rag_schema_complete.sql
```

### Cách 3: Chạy Kiểm Thử Tự Động (`verify_rag_db.py`)
```bash
# Chạy trên host (yêu cầu không có PostgreSQL khác chiếm cổng 5432 trên máy)
pip install psycopg2-binary
python backend/db/verify_rag_db.py

# Hoặc chạy trực tiếp bên trong mạng Docker khi TEST Studio đang bật (khuyến nghị trên Windows)
Get-Content -Raw -Encoding UTF8 backend/db/verify_rag_db.py | docker exec -e PYTHONIOENCODING=utf-8 -e POSTGRES_HOST=test-db -i lecturelens-test-ai-model python -
```
Script tự động nạp `vector.so` (`SELECT '[0]'::halfvec(1)`), kiểm tra `hnsw.iterative_scan` / `hnsw.ef_search`, chèn 2 chunks liên kết mẫu, kiểm tra cột sinh `[MM:SS]` (`rag.format_timestamp_display`) và `content_unaccent`, chạy tìm kiếm RRF không dấu và mở rộng ngữ cảnh 3 chiều, rồi dọn sạch dữ liệu thử nghiệm.
