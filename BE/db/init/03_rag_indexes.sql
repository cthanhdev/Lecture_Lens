-- =========================================================================
-- LECTURELENS RAG DB - 03_rag_indexes.sql
-- =========================================================================
-- Hệ thống chỉ mục đa tầng kết hợp:
-- 1. HNSW Index: Tìm kiếm vector ngữ nghĩa tương đồng (Dense)
-- 2. GIN TSVector: Tìm kiếm toàn văn từ khóa chính xác (Lexical)
-- 3. GIN Trigram: Tìm kiếm mờ cho tiếng Việt không dấu / lỗi gõ (Fuzzy)
-- 4. B-Tree: Tối ưu bộ lọc WHERE lecture_id và điều hướng mốc thời gian
-- =========================================================================

-- 1. Chỉ mục HNSW Cosine Distance trên vector halfvec(1024)
-- m = 16: Số liên kết hai chiều giữa các node trên mỗi tầng đồ thị
-- ef_construction = 64: Kích thước danh sách ứng viên trong quá trình xây dựng đồ thị
CREATE INDEX IF NOT EXISTS idx_chunks_hnsw_cosine 
ON rag.lecture_chunks 
USING hnsw (embedding_half halfvec_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 2. Chỉ mục GIN Full-Text Search trên TSVECTOR không dấu
CREATE INDEX IF NOT EXISTS idx_chunks_tsv 
ON rag.lecture_chunks 
USING gin (tsv_content);

-- 3. Chỉ mục GIN Trigram (pg_trgm) cho phép tìm kiếm mờ, viết tắt, và từ khóa không dấu
CREATE INDEX IF NOT EXISTS idx_chunks_trgm_unaccent 
ON rag.lecture_chunks 
USING gin (content_unaccent gin_trgm_ops);

-- 4. Chỉ mục B-tree kết hợp hỗ trợ lọc nhanh theo bài giảng và mốc thời gian
-- Phục vụ tính năng Capsule Audio Player đồng bộ dòng chữ khi phát âm thanh
CREATE INDEX IF NOT EXISTS idx_chunks_lecture_timeline 
ON rag.lecture_chunks (lecture_id, start_time_seconds);

-- 5. Chỉ mục B-tree hỗ trợ truy vấn mở rộng ngữ cảnh (Context Expansion)
CREATE INDEX IF NOT EXISTS idx_chunks_nav 
ON rag.lecture_chunks (id, prev_chunk_id, next_chunk_id);

COMMENT ON INDEX rag.idx_chunks_hnsw_cosine IS 'Chỉ mục HNSW trên halfvec(1024) đạt độ trễ milli-giây cho tìm kiếm vector xấp xỉ Top-K';
COMMENT ON INDEX rag.idx_chunks_trgm_unaccent IS 'Chỉ mục GIN trigram phục vụ tìm kiếm tiếng Việt không dấu và từ khóa viết tắt';
