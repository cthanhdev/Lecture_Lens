# ADR 0004: Recursive Token Chunking, BGE-M3 Dual Embedding (`halfvec(1024)` + Lexical Weights), and Sequential VRAM Offloading

## Status
Accepted

## Context
Stage 1 of the LectureLens Audio Ingest Pipeline produces an immutable `transcript.json` artifact via PhoWhisper ASR (ADR 0002). Stage 2 must turn that transcript into searchable semantic units inside PostgreSQL 16 + `pgvector` 0.7+ (`rag.lecture_chunks`) while obeying strict constraints:

1. **Citation Precision & Context Continuity:** Lecture Q&A requires accurate `[MM:SS]` audio citations. Although `BGE-M3` accepts up to 8,192 tokens, indexing entire lectures or large multi-minute blocks dilutes embedding specificity and breaks timestamp precision. Conversely, indexing individual short ASR sentences loses cross-sentence reasoning.
2. **Vietnamese Lexical + Semantic Retrieval:** Academic Vietnamese queries frequently mix unaccented search text, abbreviations, and specialized terminology where dense cosine similarity alone can miss exact terms.
3. **Host Resource Constraints (4 GB VRAM / 16 GB RAM):** Development and institutional edge nodes (e.g., 16 vCPU, 16 GB RAM, NVIDIA RTX 3050 4 GB VRAM) cannot hold `PhoWhisper` (~1.2 GB FP16) and `BGE-M3` (~2.2 GB FP16) concurrently in GPU VRAM alongside CUDA activation buffers.
4. **Runtime Dependency Footprint:** The `FlagEmbedding` Python wrapper introduces heavy transitive dependencies and version conflicts with modern `torch` / `transformers` stacks inside lean Docker images.

## Decision

1. **Recursive Token Chunking (`[I5]` — `<=512` tokens, `64` overlap, Doubly-Linked Chunks):**
   - Segment `transcript.json` using the `BGE-M3` tokenizer (`add_special_tokens=False`) with `max_tokens = 512`, `reserve_special_tokens = 2` (effective payload budget `510` tokens so `<s>` + payload + `</s>` never exceeds 512), and `overlap_tokens = 64`.
   - When a single ASR segment exceeds the payload budget, split recursively along Vietnamese punctuation/clause boundaries (`[". ", "? ", "! ", "; ", "\n", ", ", " "]`) and finally by token window, linearly interpolating monotonic `start_time_seconds` / `end_time_seconds` and regenerating `[MM:SS]` labels.
   - Assign deterministic UUIDs and doubly-linked pointers (`prev_chunk_id`, `next_chunk_id`) across consecutive chunks of a lecture so `rag.get_expanded_context` retrieves the surrounding `PREVIOUS` / `CURRENT` / `NEXT` window in one query without re-chunking.

2. **BGE-M3 Dual Embedding via Direct `transformers` + `sparse_linear.pt` (`[I6]`):**
   - Load `backend/models/bge-m3` directly with `transformers.AutoTokenizer`, `transformers.AutoModel`, and `sparse_linear.pt` (`nn.Linear(1024, 1)`) via `torch.load(..., weights_only=True)` instead of installing `FlagEmbedding`.
   - Extract L2-normalized `[CLS]` dense embeddings quantized to FP16 precision (`halfvec(1024)`), halving HNSW graph RAM/storage (`2,048` vs `4,096` bytes/vector) and accelerating HNSW scans (~1.8x) while maintaining >99.2% recall.
   - Compute learned positive token weights (`ReLU(sparse_linear(last_hidden_state))`) excluding special tokens, retaining the top lexical entries in `lexical_weights` (`JSONB`) rather than adding a 250k-dimension `sparsevec` HNSW/GIN index alongside the existing PostgreSQL `tsvector` and `pg_trgm` `unaccent` RRF streams.

3. **Immutable `chunks.json` Artifact & Idempotent PgVector Sync:**
   - Persist `volumes/rag_data/chunks/{jobId}/chunks.json` atomically (`os.replace` on the shared mount point per ADR 0002) and update `manifest.json` (`chunking` metadata) before syncing chunks into `rag.lecture_chunks` (idempotent per `lecture_id` via replace-in-transaction).
   - Provide a `ChunkStoreProtocol` seam with `PostgresPgVectorChunkStore`, `InMemoryChunkStore`, and `CompositeChunkStore` so tests and offline local execution succeed cleanly even when PostgreSQL is unavailable.
   - Define `GENERATED ALWAYS AS (...) STORED` columns in `rag.lecture_chunks` strictly via `IMMUTABLE` SQL wrappers (`rag.format_timestamp_display(numeric)` for `[MM:SS]`/`[HH:MM:SS]` and `rag.immutable_unaccent(text)`), and quote `"position" VARCHAR` in `rag.get_expanded_context` for full PostgreSQL 16 compatibility.

4. **Sequential VRAM Offloading (`LOW_VRAM_MODE=true`):**
   - Enable `LOW_VRAM_MODE` by default under the global `asyncio.Semaphore(1)` GPU lock: after Stage 1 ASR writes `transcript.json`, invoke `unload()` on the ASR engine (`del` model/processor + `gc.collect()` + `torch.cuda.empty_cache()`) before loading `BGE-M3` for Stage 2. Expose `unload()` on the embedder as well so 4 GB VRAM GPUs never hit CUDA OOM between stages.

## Consequences
- **Positive:** Tight `[MM:SS]` citation boundaries, cross-boundary continuity via 64-token overlap + doubly-linked chunks, 50% HNSW RAM reduction via `halfvec(1024)`, zero `FlagEmbedding` dependency bloat, and safe execution on 4 GB VRAM / 16 GB RAM hosts.
- **Negative:** Changing `max_tokens`, `overlap_tokens`, or embedding normalization later requires re-running Stage 2 (`POST /internal/v1/ai/chunk-and-embed`) across stored `transcript.json` artifacts to rebuild `rag.lecture_chunks`. Sequential unloading adds cold-load latency between Stage 1 and Stage 2 on low-VRAM machines unless `LOW_VRAM_MODE=false` is set on >=12 GB VRAM GPUs.
- **Requirement:** `backend/models/bge-m3` must include `sparse_linear.pt` alongside `config.json`, tokenizer files, and model weights; Spring Boot and FastAPI share the expanded job states `CHUNKING` and `EMBEDDING` between `STT_COMPLETED` and `READY` (`backend/db/init/06_app_jobs_status_migration.sql`).
