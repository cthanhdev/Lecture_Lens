# ADR 0005: Online Hybrid RAG, Cross-Encoder Reranking, and Multi-Pass Gemma 4 Prompt Chain (`[Q1]`–`[Q6+]`)

- **Status:** Accepted
- **Date:** 2026-11-15
- **Supersedes / Extends:** [ADR 0001](./0001-privacy-first-local-ai-architecture.md), [ADR 0004](./0004-recursive-chunking-and-bge-m3-halfvec-indexing.md)

## Context

Sau khi hoàn thành Stage 1 (PhoWhisper ASR `[I1]–[I4]`) và Stage 2 (Recursive Token Chunker `[I5]` + BGE-M3 Dual Embedder `[I6]`), hệ thống LectureLens cần hoàn thiện **Stage 3 — Online RAG & Multi-Pass LLM Generation (`[Q1]`–`[Q6+]`)** để phục vụ các tác vụ hỏi đáp bài giảng có trích dẫn mốc thời gian `[MM:SS]`, tổng hợp ghi chú Cornell Notes, và sinh trắc nghiệm JSON từ kho tri thức cục bộ `pgvector`.

Các yêu cầu kiến trúc cốt lõi cho Stage 3 bao gồm:
1. **Không sử dụng `[Q0]` Query Rewriting**: Câu hỏi gốc (`query`) đi thẳng vào `[Q1]` Semantic Cache và `[Q2]` Hybrid Retrieval để bảo toàn thuật ngữ chuyên ngành của giảng viên và tránh độ trễ/sai lệch khi gọi LLM tiền xử lý.
2. **Chất lượng trích dẫn & định dạng đầu ra nghiêm ngặt**: Kết quả từ RAG Pass 1 cần được tinh chỉnh câu chữ (khắc phục lỗi chính tả ASR như `f(x)`/`sách` hoặc thuật ngữ chuyên ngành) và ép đúng định dạng/văn phong theo System Prompt tùy biến của người dùng hoặc từng tính năng trên Mobile App.
3. **Vận hành cục bộ 100% và an toàn VRAM 4 GB**: Tuân thủ Privacy-First ([ADR 0001](./0001-privacy-first-local-ai-architecture.md)) và `LOW_VRAM_MODE=true` ([ADR 0004](./0004-recursive-chunking-and-bge-m3-halfvec-indexing.md)), đảm bảo `BgeM3Embedder`, `BgeRerankerV2M3` và `Gemma 4 E4B` không tranh chấp GPU VRAM.
4. **Hỗ trợ cả Unified API lẫn Modular Reuse**: Spring Boot Gateway cần một endpoint thống nhất để giảm round-trip, đồng thời hệ thống cần mở sẵn các endpoint thành phần và ranh giới Protocol để dễ mở rộng thêm các bước tinh chỉnh hậu kỳ (`[Q7+]`).

## Decision

1. **Áp dụng Unified RAG Query Endpoint (Cách 2) kèm các Endpoint Thành Phần**:
   - Endpoint chính thống nhất: `POST /internal/v1/ai/rag/query` do `RagPipelineCoordinator` (`backend/ai_service/pipeline/rag_pipeline.py`) điều phối trọn vẹn chuỗi `[Q1]`–`[Q6+]`.
   - Các endpoint thành phần được giữ modular và mở song song dưới `backend/ai_service/routers/rag.py` (tất cả bảo vệ bởi `X-Internal-Secret`):
     - `POST /internal/v1/ai/rag/retrieve` (`[Q1]`–`[Q4]` không gọi LLM).
     - `POST /internal/v1/ai/llm/generate` (chạy chuỗi Gemma 4 trực tiếp với ngữ cảnh/hướng dẫn tùy ý).
     - `GET /internal/v1/ai/rag/presets` (trả về metadata và preset System Prompt cho `[Q6]`).

2. **Luồng thực thi `[Q1]`–`[Q6+]` không có `[Q0]`**:
   - **`[Q1]` Semantic Query Cache (`rag.semantic_query_cache`)**: Nhúng câu hỏi gốc bằng `BgeM3Embedder` (`halfvec(1024)`), đối chiếu cosine similarity (`>= RAG_CACHE_SIMILARITY_THRESHOLD`, mặc định `0.95` trong `config.py`) trong phạm vi `lecture_ids` và **cùng `prompt_hash`**. `prompt_hash` (SHA-256) được tính từ `draft_system_prompt`, `refiner_system_prompt`, `profile`, `response_format`, `use_expanded_context` và `extra_stages`, lưu kèm trong `cached_citations` JSONB để giữ tương thích 100% với DDL `05_rag_telemetry_cache.sql`. Đổi System Prompt sẽ tự động cache miss và không trả nhầm kết quả cũ.
   - **`[Q2]` Hybrid 3-Stream Retrieval + RRF (`search_vietnamese_rag_rrf`)**: Truy vấn kết hợp Dense `halfvec(1024)` + Sparse `lexical_weights` JSONB + PostgreSQL Vietnamese FTS (`tsv_content` & `unaccent`), lấy Top `retrievalTopK` (mặc định `25`).
   - **`[Q3]` Doubly-Linked Context Expansion (`get_expanded_context`)**: Mở rộng cửa sổ `prev_chunk_id` / `next_chunk_id` để giữ nguyên vẹn mạch lập luận của giảng viên trước và sau đoạn khớp.
   - **`[Q4]` Cross-Encoder Reranking (`BgeRerankerV2M3`)**: Nạp `backend/models/bge-reranker-v2-m3` qua `transformers` (`AutoModelForSequenceClassification`, `local_files_only=True`), chấm điểm cặp `(query, expanded_text)` và chọn Top `topK` (mặc định `5`).
   - **`[Q5]` Gemma 4 Pass 1 — Grounded RAG Draft**: `GroundedPromptBuilder.build_rag_draft_prompt()` dựng ngữ cảnh có gắn mốc `[MM:SS] [Chunk N]` và yêu cầu Gemma 4 E4B sinh `draft_answer` bám sát tài liệu, nghiêm cấm bịa đặt.
   - **`[Q6]` Gemma 4 Pass 2 — Custom System Prompt Refiner**: `GroundedPromptBuilder.build_refinement_prompt()` nhận `(query, draft_answer, Top K RAG contexts)` cùng `systemPrompt` tùy chỉnh (hoặc preset `qa_refine` / `cornell_notes` / `quiz_json` / `custom`) và `responseFormat` (`text` | `json`) để Gemma 4 sửa lỗi chính tả ASR, trau chuốt câu chữ và ép chuẩn cấu trúc đầu ra.
   - **`[Q7+]` Extensible Pipeline Stages (`extraStages`)**: Nhận danh sách `LLMStageConfig[]` (mỗi stage có `stageId`, `systemPrompt`, `responseFormat`, `temperature`, `maxNewTokens`, `enabled`), nối tiếp output của pass trước vào pass tiếp theo để dễ dàng cắm thêm các bước (ví dụ: verifier, translator, flashcard extractor) mà không phá vỡ hợp đồng API.

3. **Kiến trúc Gemma 4 Dual Runtime (`CompositeLLMClient`)**:
   - Hỗ trợ chế độ `"auto"` (ưu tiên Ollama cục bộ tại `OLLAMA_BASE_URL` với `OLLAMA_MODEL=gemma-4-e4b`, tự động fallback sang `TransformersGemmaClient` nạp trực tiếp `backend/models/gemma-4-e4b` bằng `AutoModelForCausalLM` ở `torch.bfloat16` trên cả CUDA và CPU, `local_files_only=True`), `"ollama"`, `"transformers"`, và `"mock"` (`FakeLLMClient` chỉ dùng cho unit test hoặc Mock Studio).
   - Bảo toàn danh sách `eos_token_id` gốc (`[1, 106, 50]` gồm `<turn|>`) và loại bỏ khối suy nghĩ nội bộ `<|channel>thought...<channel|>` trước khi trả về `answer` / `draft_answer`.

4. **Protocol Seams & Sequential VRAM Offloading**:
   - Định nghĩa rõ 3 seam mới: `RerankerProtocol`, `LLMClientProtocol`, `TelemetryStoreProtocol` (kèm `InMemoryTelemetryStore`, `PostgresTelemetryStore`, `CompositeTelemetryStore`).
   - Toàn bộ `RagPipelineCoordinator.run_query()` thực thi dưới `GLOBAL_GPU_SEMAPHORE = asyncio.Semaphore(1)`. Khi `LOW_VRAM_MODE=true`, hệ thống tuần tự `embedder.unload()` sau `[Q2]`, `reranker.unload()` sau `[Q4]`, và `llm_client.unload()` sau `[Q5]–[Q7+]` để vừa khít GPU 4 GB VRAM.

## Consequences

- **Positive:**
  - Giao tiếp Gateway ↔ AI Service gọn nhẹ qua 1 endpoint `/internal/v1/ai/rag/query`, đồng thời mở sẵn `/rag/retrieve` và `/llm/generate` cho các tác vụ chuyên biệt.
  - Người dùng và Mobile App kiểm soát hoàn toàn định dạng đầu ra (`text`, Cornell Notes, Quiz JSON) qua `[Q6]` Custom System Prompt mà không làm yếu tính trung thực trích dẫn `[MM:SS]` của `[Q5]`.
  - Dễ dàng mở rộng chuỗi `[Q7+]` chỉ bằng payload `extraStages`.
  - Hoạt động tin cậy từ môi trường dev/test không GPU (`FakeReranker`/`FakeLLMClient`/`InMemoryTelemetryStore`) tới Docker cục bộ 4 GB VRAM (`LOW_VRAM_MODE=true`).
- **Trade-offs & Mitigations:**
  - Chạy 2+ pass LLM (`[Q5]` + `[Q6]`) tăng độ trễ gấp đôi so với 1 pass. Giảm thiểu bằng: `[Q1]` Semantic Cache hit bỏ qua toàn bộ `[Q2]`–`[Q7+]`, hỗ trợ tách modular qua `/rag/retrieve` + `/llm/generate` khi cần, và tách timing từng bước (`telemetry`: `embed_ms`, `cache_ms`, `retrieval_ms`, `expand_ms`, `rerank_ms`, `llm_ms`, `total_ms`) cùng `rag.rag_audit_logs` để theo dõi bottleneck.
