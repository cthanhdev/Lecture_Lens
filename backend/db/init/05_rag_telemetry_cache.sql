-- =========================================================================
-- LECTURELENS RAG DB - 05_rag_telemetry_cache.sql
-- =========================================================================
-- Quản lý bộ đệm ngữ nghĩa (Semantic Caching) và nhật ký hiệu năng RAG
-- Giúp giảm tải cho LLM khi sinh viên hỏi các câu có ý nghĩa tương đương
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. BẢNG SEMANTIC QUERY CACHE
-- -------------------------------------------------------------------------
-- Nếu câu hỏi mới có độ tương đồng Cosine > 0.95 với câu hỏi đã lưu,
-- hệ thống có thể trả về câu trả lời đã tạo ngay lập tức (< 10ms) mà không cần gọi LLM
CREATE TABLE IF NOT EXISTS rag.semantic_query_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL,
    query_text TEXT NOT NULL,
    query_unaccent TEXT GENERATED ALWAYS AS (rag.immutable_unaccent(query_text)) STORED,
    query_embedding_half halfvec(1024) NOT NULL,
    cached_answer TEXT NOT NULL,
    cached_citations JSONB NOT NULL,
    hit_count INT DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_hit_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Chỉ mục HNSW cho câu hỏi trong cache
CREATE INDEX IF NOT EXISTS idx_query_cache_hnsw 
ON rag.semantic_query_cache 
USING hnsw (query_embedding_half halfvec_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_query_cache_lecture 
ON rag.semantic_query_cache (lecture_id);

-- -------------------------------------------------------------------------
-- 2. BẢNG NHẬT KÝ ĐÁNH GIÁ CHẤT LƯỢNG RAG (AUDIT LOGS)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rag.rag_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL,
    query_text TEXT NOT NULL,
    top_chunks_retrieved UUID[] NOT NULL,
    rerank_scores FLOAT[] NOT NULL,
    latency_retrieval_ms INT,
    latency_rerank_ms INT,
    latency_llm_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rag_audit_lecture 
ON rag.rag_audit_logs (lecture_id, created_at DESC);

COMMENT ON TABLE rag.semantic_query_cache IS 'Bộ đệm ngữ nghĩa lưu câu trả lời cho các câu hỏi trùng lặp hoặc tương đồng cao';
COMMENT ON TABLE rag.rag_audit_logs IS 'Lưu vết lịch sử truy vấn để đánh giá độ trễ và chất lượng trích xuất';
