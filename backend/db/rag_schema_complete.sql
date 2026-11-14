-- =========================================================================
-- LECTURELENS - TOÀN BỘ KIẾN TRÚC RAG DATABASE (PGVECTOR 0.7.0+)
-- =========================================================================
-- Tệp tổng hợp: Chạy toàn bộ cấu trúc Schema, Tables, Indexes, Functions
-- Tương thích: PostgreSQL 16 + pgvector 0.7.0+
-- Thiết kế độc lập: Phân vùng schema "rag", không phụ thuộc bảng Spring Boot
-- =========================================================================

\echo '>>> 1/5: Kích hoạt Extensions & Khởi tạo Schema rag...'
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS rag;

CREATE OR REPLACE FUNCTION rag.immutable_unaccent(text)
RETURNS text 
LANGUAGE sql 
IMMUTABLE 
PARALLEL SAFE 
STRICT 
AS $$
    SELECT public.unaccent($1);
$$;

CREATE OR REPLACE FUNCTION rag.format_timestamp_display(seconds numeric)
RETURNS varchar(10)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
    SELECT CASE
        WHEN seconds >= 3600 THEN
            lpad((floor(GREATEST(seconds, 0))::bigint / 3600)::text, 2, '0') || ':' ||
            lpad(((floor(GREATEST(seconds, 0))::bigint % 3600) / 60)::text, 2, '0') || ':' ||
            lpad((floor(GREATEST(seconds, 0))::bigint % 60)::text, 2, '0')
        ELSE
            lpad((floor(GREATEST(seconds, 0))::bigint / 60)::text, 2, '0') || ':' ||
            lpad((floor(GREATEST(seconds, 0))::bigint % 60)::text, 2, '0')
    END::varchar(10);
$$;

\echo '>>> 2/5: Khởi tạo Bảng rag.lecture_chunks chuẩn hóa tiếng Việt...'
CREATE TABLE IF NOT EXISTS rag.lecture_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL,
    chunk_index INT NOT NULL,
    
    start_time_seconds NUMERIC(10, 3) NOT NULL,
    end_time_seconds NUMERIC(10, 3) NOT NULL,
    
    start_timestamp_display VARCHAR(10) GENERATED ALWAYS AS (
        rag.format_timestamp_display(start_time_seconds)
    ) STORED,
    end_timestamp_display VARCHAR(10) GENERATED ALWAYS AS (
        rag.format_timestamp_display(end_time_seconds)
    ) STORED,
    
    speaker_label VARCHAR(50) DEFAULT 'LECTURER',
    content TEXT NOT NULL,
    content_unaccent TEXT GENERATED ALWAYS AS (
        rag.immutable_unaccent(content)
    ) STORED,
    
    token_count INT NOT NULL DEFAULT 0,
    embedding_half halfvec(1024) NOT NULL,
    lexical_weights JSONB DEFAULT '{}'::jsonb,
    
    tsv_content TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('simple', rag.immutable_unaccent(content))
    ) STORED,
    
    prev_chunk_id UUID,
    next_chunk_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_lecture_chunk UNIQUE (lecture_id, chunk_index)
);

\echo '>>> 3/5: Xây dựng hệ thống chỉ mục HNSW halfvec, GIN Trigram, GIN TSVector...'
CREATE INDEX IF NOT EXISTS idx_chunks_hnsw_cosine 
ON rag.lecture_chunks 
USING hnsw (embedding_half halfvec_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_chunks_tsv 
ON rag.lecture_chunks 
USING gin (tsv_content);

CREATE INDEX IF NOT EXISTS idx_chunks_trgm_unaccent 
ON rag.lecture_chunks 
USING gin (content_unaccent gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_chunks_lecture_timeline 
ON rag.lecture_chunks (lecture_id, start_time_seconds);

CREATE INDEX IF NOT EXISTS idx_chunks_nav 
ON rag.lecture_chunks (id, prev_chunk_id, next_chunk_id);

\echo '>>> 4/5: Khởi tạo các hàm Hybrid Search 3 luồng (RRF) & Context Expansion...'
CREATE OR REPLACE FUNCTION rag.search_vietnamese_rag_rrf(
    p_lecture_ids UUID[],
    p_query_embedding halfvec(1024),
    p_query_text TEXT,
    p_top_k INT DEFAULT 25,
    p_rrf_k INT DEFAULT 60
)
RETURNS TABLE (
    chunk_id UUID,
    lecture_id UUID,
    chunk_index INT,
    start_time_seconds NUMERIC,
    end_time_seconds NUMERIC,
    start_timestamp_display VARCHAR,
    end_timestamp_display VARCHAR,
    speaker_label VARCHAR,
    content TEXT,
    prev_chunk_id UUID,
    next_chunk_id UUID,
    dense_score FLOAT,
    lexical_rank BIGINT,
    fuzzy_rank BIGINT,
    rrf_total_score FLOAT
)
LANGUAGE sql
STABLE
AS $$
WITH 
dense_stream AS (
    SELECT 
        id,
        (1 - (embedding_half <=> p_query_embedding)) AS similarity,
        ROW_NUMBER() OVER (ORDER BY embedding_half <=> p_query_embedding ASC) AS rank
    FROM rag.lecture_chunks
    WHERE lecture_id = ANY(p_lecture_ids)
    ORDER BY embedding_half <=> p_query_embedding ASC
    LIMIT 50
),
lexical_stream AS (
    SELECT 
        id,
        ts_rank_cd(tsv_content, plainto_tsquery('simple', rag.immutable_unaccent(p_query_text))) AS rank_score,
        ROW_NUMBER() OVER (ORDER BY ts_rank_cd(tsv_content, plainto_tsquery('simple', rag.immutable_unaccent(p_query_text))) DESC) AS rank
    FROM rag.lecture_chunks
    WHERE lecture_id = ANY(p_lecture_ids)
      AND tsv_content @@ plainto_tsquery('simple', rag.immutable_unaccent(p_query_text))
    LIMIT 50
),
fuzzy_stream AS (
    SELECT 
        id,
        similarity(content_unaccent, rag.immutable_unaccent(p_query_text)) AS trgm_sim,
        ROW_NUMBER() OVER (ORDER BY similarity(content_unaccent, rag.immutable_unaccent(p_query_text)) DESC) AS rank
    FROM rag.lecture_chunks
    WHERE lecture_id = ANY(p_lecture_ids)
      AND similarity(content_unaccent, rag.immutable_unaccent(p_query_text)) > 0.15
    LIMIT 50
),
merged_candidates AS (
    SELECT 
        COALESCE(d.id, l.id, f.id) AS chunk_id,
        COALESCE(d.similarity, 0.0) AS dense_sim,
        d.rank AS dense_r,
        l.rank AS lex_r,
        f.rank AS fuz_r,
        (
            COALESCE(1.0 / (p_rrf_k + d.rank), 0.0) +
            COALESCE(1.0 / (p_rrf_k + l.rank), 0.0) +
            COALESCE(1.0 / (p_rrf_k + f.rank), 0.0)
        ) AS rrf_score
    FROM dense_stream d
    FULL OUTER JOIN lexical_stream l ON d.id = l.id
    FULL OUTER JOIN fuzzy_stream f ON COALESCE(d.id, l.id) = f.id
)
SELECT 
    c.id AS chunk_id,
    c.lecture_id,
    c.chunk_index,
    c.start_time_seconds,
    c.end_time_seconds,
    c.start_timestamp_display,
    c.end_timestamp_display,
    c.speaker_label,
    c.content,
    c.prev_chunk_id,
    c.next_chunk_id,
    m.dense_sim::FLOAT AS dense_score,
    m.lex_r AS lexical_rank,
    m.fuz_r AS fuzzy_rank,
    m.rrf_score::FLOAT AS rrf_total_score
FROM merged_candidates m
JOIN rag.lecture_chunks c ON c.id = m.chunk_id
ORDER BY m.rrf_score DESC
LIMIT p_top_k;
$$;

CREATE OR REPLACE FUNCTION rag.get_expanded_context(p_chunk_id UUID)
RETURNS TABLE (
    "position" VARCHAR,
    chunk_id UUID,
    start_timestamp_display VARCHAR,
    end_timestamp_display VARCHAR,
    speaker_label VARCHAR,
    content TEXT
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        'PREVIOUS'::VARCHAR AS position, 
        c_prev.id, 
        c_prev.start_timestamp_display, 
        c_prev.end_timestamp_display, 
        c_prev.speaker_label, 
        c_prev.content
    FROM rag.lecture_chunks c_curr
    JOIN rag.lecture_chunks c_prev ON c_curr.prev_chunk_id = c_prev.id
    WHERE c_curr.id = p_chunk_id
    UNION ALL
    SELECT 
        'CURRENT'::VARCHAR AS position, 
        id AS chunk_id, 
        start_timestamp_display, 
        end_timestamp_display, 
        speaker_label, 
        content
    FROM rag.lecture_chunks 
    WHERE id = p_chunk_id
    UNION ALL
    SELECT 
        'NEXT'::VARCHAR AS position, 
        c_next.id, 
        c_next.start_timestamp_display, 
        c_next.end_timestamp_display, 
        c_next.speaker_label, 
        c_next.content
    FROM rag.lecture_chunks c_curr
    JOIN rag.lecture_chunks c_next ON c_curr.next_chunk_id = c_next.id
    WHERE c_curr.id = p_chunk_id;
$$;

\echo '>>> 5/5: Khởi tạo Semantic Cache & Audit Logs...'
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

CREATE INDEX IF NOT EXISTS idx_query_cache_hnsw 
ON rag.semantic_query_cache 
USING hnsw (query_embedding_half halfvec_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_query_cache_lecture 
ON rag.semantic_query_cache (lecture_id);

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

\echo '>>> HOÀN TẤT: Toàn bộ cấu trúc Schema RAG đã sẵn sàng phục vụ!'
