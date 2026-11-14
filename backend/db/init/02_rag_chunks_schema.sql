-- =========================================================================
-- LECTURELENS RAG DB - 02_rag_chunks_schema.sql
-- =========================================================================
-- Đặc tả bảng thực thể cốt lõi chứa các phân đoạn bài giảng và vector
-- Tối ưu hóa lưu trữ đầu ra từ PhoWhisper-base (ASR) và BGE-M3 (Embedder)
-- =========================================================================

CREATE TABLE IF NOT EXISTS rag.lecture_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Khóa ngoại logic liên kết với bài giảng (Độc lập với schema của Spring Boot)
    lecture_id UUID NOT NULL,
    chunk_index INT NOT NULL,
    
    -- Mốc thời gian chính xác từ PhoWhisper (độ phân giải mili-giây)
    start_time_seconds NUMERIC(10, 3) NOT NULL,
    end_time_seconds NUMERIC(10, 3) NOT NULL,
    
    -- Cột sinh tự động: Chuỗi định dạng hiển thị [MM:SS] phục vụ trực tiếp cho UI và Trích dẫn Citation
    start_timestamp_display VARCHAR(10) GENERATED ALWAYS AS (
        rag.format_timestamp_display(start_time_seconds)
    ) STORED,
    end_timestamp_display VARCHAR(10) GENERATED ALWAYS AS (
        rag.format_timestamp_display(end_time_seconds)
    ) STORED,
    
    -- Nhãn phân biệt người nói (Giảng viên / Sinh viên / Diễn giả - phục vụ Diarization)
    speaker_label VARCHAR(50) DEFAULT 'LECTURER',
    
    -- Nội dung bài giảng gốc: Tiếng Việt có đầy đủ dấu thanh chuẩn xác
    content TEXT NOT NULL,
    
    -- Nội dung chuẩn hóa không dấu (sinh tự động): Hỗ trợ tìm kiếm khi sinh viên gõ không dấu
    content_unaccent TEXT GENERATED ALWAYS AS (
        rag.immutable_unaccent(content)
    ) STORED,
    
    -- Số lượng token theo BGE-M3 tokenizer (đảm bảo <= 512 tokens để bảo toàn mật độ thông tin)
    token_count INT NOT NULL DEFAULT 0,
    
    -- Vector dense BGE-M3 (1024 chiều):
    -- Sử dụng kiểu dữ liệu halfvec(1024) (FP16 16-bit float của pgvector 0.7.0+)
    -- Lợi ích: Tiết kiệm 50% dung lượng RAM và đĩa, tốc độ quét HNSW tăng ~1.8x, recall > 99.2%
    embedding_half halfvec(1024) NOT NULL,
    
    -- Trọng số từ vựng (Learned Lexical Weights từ BGE-M3):
    -- Lưu trữ dạng JSONB: {"token_str": weight, ...} để đối chiếu từ khóa chuyên ngành
    lexical_weights JSONB DEFAULT '{}'::jsonb,
    
    -- Cột Full-Text Search TSVECTOR tiếng Việt (sinh tự động trên văn bản không dấu)
    tsv_content TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('simple', rag.immutable_unaccent(content))
    ) STORED,
    
    -- Liên kết mở rộng ngữ cảnh (Context Expansion / Double Linked Chunks)
    -- Giúp trích xuất ngay lập tức chunk trước và chunk sau cho LLM mà không cần re-query
    prev_chunk_id UUID,
    next_chunk_id UUID,
    
    -- Metadata mở rộng (tiêu đề mục, slide số, từ khóa trọng tâm, cấu trúc Cornell cues)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_lecture_chunk UNIQUE (lecture_id, chunk_index)
);

COMMENT ON TABLE rag.lecture_chunks IS 'Lưu trữ các phân đoạn bài giảng âm thanh đã phiên âm và vector nhúng 1024 chiều halfvec';
COMMENT ON COLUMN rag.lecture_chunks.embedding_half IS 'Vector dense 1024-d FP16 sinh từ BGE-M3 dùng cho tìm kiếm HNSW';
COMMENT ON COLUMN rag.lecture_chunks.start_timestamp_display IS 'Chuỗi thời gian bắt đầu [MM:SS] dùng hiển thị giao diện và citation';
COMMENT ON COLUMN rag.lecture_chunks.content_unaccent IS 'Nội dung tiếng Việt đã loại bỏ dấu phục vụ tìm kiếm mờ trigram';
