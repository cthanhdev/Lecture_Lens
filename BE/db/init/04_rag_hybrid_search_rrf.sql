-- =========================================================================
-- LECTURELENS RAG DB - 04_rag_hybrid_search_rrf.sql
-- =========================================================================
-- Cung cấp hai hàm truy vấn nâng cao:
-- 1. rag.search_vietnamese_rag_rrf(): Tìm kiếm lai 3 luồng (Dense + Lexical + Trigram Fuzzy)
--    hợp nhất bằng thuật toán Reciprocal Rank Fusion (RRF)
-- 2. rag.get_expanded_context(): Mở rộng ngữ cảnh bài giảng (Context Window)
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. HÀM TÌM KIẾM HYBRID SEARCH 3 LUỒNG CHO TIẾNG VIỆT
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rag.search_vietnamese_rag_rrf(
    p_lecture_ids UUID[],              -- Danh sách ID bài giảng sinh viên được phép truy vấn
    p_query_embedding halfvec(1024),   -- Vector nhúng từ BGE-M3 của câu hỏi
    p_query_text TEXT,                 -- Câu hỏi nguyên bản của sinh viên
    p_top_k INT DEFAULT 25,            -- Top kết quả ứng viên trả về cho Cross-Encoder
    p_rrf_k INT DEFAULT 60             -- Hằng số làm mượt RRF chuẩn
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
-- Luồng 1: Tìm kiếm ngữ nghĩa Dense Vector (BGE-M3 qua HNSW halfvec)
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

-- Luồng 2: Tìm kiếm từ khóa chuẩn xác (Full-Text TSVECTOR)
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

-- Luồng 3: Tìm kiếm mờ viết tắt và lỗi gõ không dấu (Trigram Similarity qua pg_trgm)
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

-- Hợp nhất 3 luồng điểm số bằng thuật toán Reciprocal Rank Fusion (RRF)
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

-- -------------------------------------------------------------------------
-- 2. HÀM MỞ RỘNG NGỮ CẢNH (CONTEXT EXPANSION)
-- -------------------------------------------------------------------------
-- Khi Cross-Encoder chọn ra chunk xuất sắc nhất, hàm này lấy kèm đoạn trước
-- và đoạn sau để tạo thành đoạn văn mạch lạc 2-3 phút cho LLM trả lời.
CREATE OR REPLACE FUNCTION rag.get_expanded_context(p_chunk_id UUID)
RETURNS TABLE (
    position VARCHAR,
    chunk_id UUID,
    start_timestamp_display VARCHAR,
    end_timestamp_display VARCHAR,
    speaker_label VARCHAR,
    content TEXT
)
LANGUAGE sql
STABLE
AS $$
    -- Đoạn liền trước (nếu có)
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
    
    -- Đoạn hiện tại (trung tâm)
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
    
    -- Đoạn liền sau (nếu có)
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

COMMENT ON FUNCTION rag.search_vietnamese_rag_rrf IS 'Tìm kiếm lai 3 luồng tối ưu tiếng Việt (Dense halfvec, Lexical tsvector, Fuzzy Trigram) kết hợp RRF';
COMMENT ON FUNCTION rag.get_expanded_context IS 'Mở rộng ngữ cảnh 3 chiều (Trước, Hiện tại, Sau) giúp LLM trả lời chính xác trọn vẹn ý bài giảng';
