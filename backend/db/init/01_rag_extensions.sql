-- =========================================================================
-- LECTURELENS RAG DB - 01_rag_extensions.sql
-- =========================================================================
-- Kích hoạt các extension cốt lõi phục vụ lưu trữ vector và xử lý tiếng Việt:
-- 1. vector: Hỗ trợ pgvector 0.7.0+ (halfvec, sparsevec, vector, HNSW)
-- 2. unaccent: Hỗ trợ loại bỏ dấu thanh điệu tiếng Việt
-- 3. pg_trgm: Hỗ trợ tìm kiếm mờ (fuzzy search), viết tắt, n-gram
-- 4. uuid-ossp: Hỗ trợ sinh khóa định danh UUIDv4
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tạo phân vùng Schema chuyên trách cho RAG
CREATE SCHEMA IF NOT EXISTS rag;

-- -------------------------------------------------------------------------
-- HÀM BẤT BIẾN: rag.immutable_unaccent(text)
-- -------------------------------------------------------------------------
-- Lưu ý kỹ thuật: PostgreSQL yêu cầu hàm trong cột sinh tự động (GENERATED ALWAYS AS)
-- phải được đánh dấu là IMMUTABLE. Do unaccent mặc định là STABLE (phụ thuộc collation),
-- wrapper function này đảm bảo tương thích 100% để tạo cột STORED mà không lỗi.
CREATE OR REPLACE FUNCTION rag.immutable_unaccent(text)
RETURNS text 
LANGUAGE sql 
IMMUTABLE 
PARALLEL SAFE 
STRICT 
AS $$
    SELECT public.unaccent($1);
$$;

-- PostgreSQL 16 yêu cầu hàm trong cột GENERATED ALWAYS AS (...) STORED phải IMMUTABLE
-- (to_char(interval, text) có provolatile='s' = STABLE nên bị từ chối).
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

COMMENT ON SCHEMA rag IS 'Phân vùng lưu trữ tri thức số hóa bài giảng, vector embedding 1024-d và chỉ mục HNSW phục vụ 2-Stage Neural RAG của LectureLens';
COMMENT ON FUNCTION rag.immutable_unaccent(text) IS 'Hàm hỗ trợ loại bỏ dấu thanh điệu tiếng Việt chuẩn IMMUTABLE phục vụ cột sinh tự động';
