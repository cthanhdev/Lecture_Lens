# ADR 0005: Local Model Stack Transition (`PhoWhisper-medium` & `Gemma 4 E2B` QAT Mobile) and 2-Pass Pre-RAG without Semantic Cache

## Status
Accepted

## Context
During hardware validation and end-to-end RAG integration across `backend/models/` and PostgreSQL 16 + `pgvector`:
1. **`PhoWhisper-base` Vietnamese ASR limitations:** `PhoWhisper-base` showed lower transcription fidelity on dense Vietnamese technical/academic lectures (computer science, linear algebra, multi-speaker acoustics) compared to `vinai/PhoWhisper-medium` (`checkpoint-12000`, 24 encoder / 24 decoder layers, `d_model=1024`, ~769M parameters, `2.85 GiB` / `3.06 GB` FP32 checkpoint).
2. **`Gemma 4 E4B` VRAM & disk footprint vs `Gemma 4 E2B` QAT Mobile:** On developer workstations constrained to `16 GB RAM / 4 GB VRAM` (`LOW_VRAM_MODE=true`), running `Gemma 4 E4B` alongside `PhoWhisper-medium`, `BGE-M3`, and `BGE-Reranker-v2-m3` risked memory pressure and slower local inference. Google's `google/gemma-4-E2B-it-qat-mobile-transformers` (`model_type="gemma4"`, 35 text layers, `hidden_size=1536`, `131,072` token / 128K context, 2.3B effective / 5.1B total parameters with PLE, native `GemmaQuantizer` `wNa8o8` 2/4/8-bit QAT Mobile quantization, `2.32 GiB` / `2.49 GB` safetensors) fits comfortably inside the 4 GB VRAM budget while retaining strong Vietnamese instruction-following and grounded citation adherence.
3. **2-Pass Pre-RAG without Semantic Query Cache:** Static semantic caching (`rag.semantic_query_cache`) caused stale or rigid answers when students refined prompts, switched prompt profiles (`qa_refine`, `cornell_notes`, `flashcards`, `quiz_gen`), or appended follow-up prompt stages (`[Q6+]`). In addition, direct raw-question embeddings risked lexical drift on Vietnamese diacritics and specialized terminology.

## Decision
We standardize LectureLens's local AI stack and online RAG execution pipeline as follows:

1. **Canonical 4-Model On-Premise Inventory (`11.58 GiB` / `12.43 GB` total on disk excluding `.cache/`):**
   - **Stage 1 ASR (`[I4]`):** `phowhisper-medium` (`vinai/PhoWhisper-medium`, `pytorch_model.bin`, `2.85 GiB` / `3.06 GB`, `WhisperForConditionalGeneration`, 80 mel bins, vocab `51865`). Replaces `phowhisper-base` across `config.py`, `asr.py`, `schemas.py`, `ingest_pipeline.py`, and `download_models.py`.
   - **Stage 2 & Online Dense/Sparse Embedding (`[I6]`, `[Q2]`):** `bge-m3` (`BAAI/bge-m3`, `4.27 GiB` / `4.59 GB` total including `pytorch_model.bin` `2165.93 MB`, `sparse_linear.pt` `3,516 B`, `colbert_linear.pt` `2 MB`, plus optional unused `onnx/model.onnx_data` `2.13 GiB`), `XLMRobertaModel`, `1024`-d FP16 `halfvec(1024)` + `lexical_weights JSONB`, `8,192` tokens (`max_position_embeddings=8194`).
   - **Online Cross-Encoder Reranking (`[Q4]`):** `bge-reranker-v2-m3` (`BAAI/bge-reranker-v2-m3`, `model.safetensors`, `2.14 GiB` / `2.29 GB`, `XLMRobertaForSequenceClassification`, `8,192` tokens).
   - **Online 2-Pass LLM Inference (`[Q1]`, `[Q5]`, `[Q6+]`):** `gemma-4-e2b` (`google/gemma-4-E2B-it-qat-mobile-transformers`, `model.safetensors`, `2.32 GiB` / `2.49 GB`, `Gemma4Config`, `131,072` context, QAT Mobile `wNa8o8`).

2. **Primary & Alternative Gemma 4 E2B Runtimes:**
   - **Primary runtime (`LLM_ENGINE_MODE=transformers`):** `TransformersGemmaClient` running on **Python 3.11+** with **`transformers>=5.22.0`** and **`huggingface-hub>=2.0.0`** using native `GemmaQuantizer` (`dtype="auto"`, `local_files_only=True`). Note that passing multimodal image/audio inputs via `AutoProcessor` requires optional `Pillow` / `torchvision`, while text-only RAG uses `AutoTokenizer`.
   - **Alternative runtime (`LLM_ENGINE_MODE=ollama`):** `OllamaGemmaClient` calling local Ollama (`gemma4:e2b`) via HTTP when dedicated Ollama container serving is preferred.

3. **2-Pass Pre-RAG Architecture (`[Q1]–[Q6+]`) & Removal of `rag.semantic_query_cache`:**
   - **`[Q1]` Pass 1 Query Preparation:** `gemma-4-e2b` rewrites/expands the raw user question using `DEFAULT_QUERY_SYSTEM_PROMPT` and applies a **Query Drift Guard** (`_merge_preserved_keywords`) so critical keywords from the original query are never dropped.
   - **`[Q2]` Hybrid 3-Stream Retrieval:** `bge-m3` embeds the prepared query into `halfvec(1024)` and queries `rag.hybrid_search_chunks(...)` (`Dense HNSW` + `PostgreSQL GIN TSVECTOR` + `pg_trgm Fuzzy` via RRF).
   - **`[Q3]` 3-Way Context Expansion:** Fetches `PREVIOUS` / `CURRENT` / `NEXT` chunks using doubly-linked pointers (`prev_chunk_id`, `next_chunk_id`).
   - **`[Q4]` Precision Cross-Encoder Reranking:** `bge-reranker-v2-m3` rescores candidate expanded passages (`topK` final citations).
   - **`[Q5]` Pass 2 Grounded Answer Generation + `[Q6+]` Extensible Prompt Stages:** `gemma-4-e2b` generates grounded output with `[MM:SS]` citations, optionally chaining extra `LLMStageConfig` stages (e.g., `cornell_notes`, `flashcards`, `quiz_gen`).
   - **Persistence:** `rag.semantic_query_cache` is removed (`DROP TABLE IF EXISTS rag.semantic_query_cache` in `05_rag_telemetry_cache.sql`); execution telemetry and retrieved chunk citations are persisted strictly to **`rag.rag_audit_logs`**.

4. **Sequential VRAM Offloading & Observable Seams:**
   - All 4 active models share `GLOBAL_GPU_SEMAPHORE = asyncio.Semaphore(1)` under `LOW_VRAM_MODE=true`. Every heavy step invokes `.unload()` afterward (`PhoWhisperEngine` before `BgeM3Embedder`, and `BgeM3Embedder` / `BgeRerankerV2M3` / `TransformersGemmaClient` between `[Q1]–[Q5]`).
   - Introspection and runtime execution tracing flow through clean protocol seams: `ModelRegistryProtocol` (`LocalModelRegistry`) and `PipelineObserverProtocol`.

## Consequences
- **Positive:**
  - Total weight footprint drops to `11.58 GiB` (`12.43 GB` excl. `.cache/`), keeping every stage well within the `16 GB RAM / 4 GB VRAM` edge envelope.
  - Vietnamese lecture ASR accuracy improves significantly with `PhoWhisper-medium`, while QAT Mobile `Gemma 4 E2B` brings 128K context and fast grounded synthesis without external Ollama dependency by default.
  - All 4 local models in `backend/models/` are actively wired (`ACTIVE`) and observable via `/internal/v1/ai/health` and the `TEST/` workbench.
- **Negative / Trade-offs:**
  - Upgraded base runtime floor to **Python 3.11+** and **`transformers>=5.22.0`** (incompatible with legacy Python 3.10 + transformers 4.x environments for `model_type="gemma4"`).
  - Removing `rag.semantic_query_cache` eliminates zero-latency exact/semantic cache hits on repeated queries, trading minor latency (~100–500 ms saved on repeats) for guaranteed freshness across prompt profiles and drift-guarded retrieval.
- **Supersedes / Updates:** Partially supersedes model selection items #1 and #5 in [ADR 0001](./0001-privacy-first-local-ai-architecture.md) and PhoWhisper sizing references in [ADR 0004](./0004-recursive-chunking-and-bge-m3-halfvec-indexing.md).

## References
- Model weights inventory: `backend/models/` (`phowhisper-medium`, `bge-m3`, `bge-reranker-v2-m3`, `gemma-4-e2b`)
- Backend modules: `backend/ai_service/core/model_registry.py`, `asr.py`, `embedder.py`, `reranker.py`, `llm_client.py`, `prompt_builder.py`, `pipeline/rag_pipeline.py`
- Migration & schema: `backend/db/init/05_rag_telemetry_cache.sql`
