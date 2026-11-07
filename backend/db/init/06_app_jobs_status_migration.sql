-- =========================================================================
-- LECTURELENS - MIGRATION: BỔ SUNG TRẠNG THÁI STT_COMPLETED CHO APP.JOBS
-- =========================================================================
-- Tệp di chuyển dữ liệu (Migration): Cập nhật check constraint của bảng app.jobs
-- Phục vụ ranh giới (Seam) giữa Giai đoạn 1 (PhoWhisper ASR) và Giai đoạn 2 (BGE-M3 Chunking)
-- =========================================================================

\echo '>>> 6/6: Cập nhật Check Constraint cho app.jobs (bổ sung STT_COMPLETED)...'

DO $$
BEGIN
    -- Chỉ thực hiện nếu bảng app.jobs tồn tại
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'app' AND table_name = 'jobs'
    ) THEN
        ALTER TABLE app.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
        ALTER TABLE app.jobs ADD CONSTRAINT jobs_status_check
            CHECK (status IN ('QUEUED', 'PROCESSING_STT', 'STT_COMPLETED', 'CHUNKING', 'EMBEDDING', 'READY', 'FAILED'));
        RAISE NOTICE 'Constraint jobs_status_check updated successfully with STT_COMPLETED.';
    ELSE
        RAISE NOTICE 'Table app.jobs does not exist yet. Ensure the initial schema creation includes STT_COMPLETED.';
    END IF;
END $$;
