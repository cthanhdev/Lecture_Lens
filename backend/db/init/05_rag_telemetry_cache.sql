-- =========================================================================
-- LECTURELENS RAG DB - 05_rag_telemetry_cache.sql
-- =========================================================================
-- Quản lý nhật ký hiệu năng & truy xuất RAG (Audit Logs)
-- Semantic Query Cache đã được loại bỏ theo kiến trúc 2-Pass Pre-RAG mới
-- =========================================================================

DROP TABLE IF EXISTS rag.semantic_query_cache;

-- -------------------------------------------------------------------------
-- 1. BẢNG NHẬT KÝ ĐÁNH GIÁ CHẤT LƯỢNG RAG (AUDIT LOGS)
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

COMMENT ON TABLE rag.rag_audit_logs IS 'Lưu vết lịch sử truy vấn để đánh giá độ trễ và chất lượng trích xuất';
