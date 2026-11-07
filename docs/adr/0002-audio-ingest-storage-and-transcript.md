# ADR 0002: Shared Volume Audio Ingestion & Transcript Artifact Handshake

## Status
Accepted

## Context
LectureLens processes university lecture recordings that often range from 50MB to over 1GB in size (MP3, WAV, M4A). In our distributed on-premise topology:
1. The **Spring Boot Gateway** acts as the public-facing ingress receiving client file uploads.
2. The **FastAPI AI Service** runs offline ASR and feature vectorization workloads inside an isolated Docker subnet.

Transmitting large audio binaries across HTTP multipart endpoints between internal microservices introduces substantial overhead: duplicate RAM buffering, elevated network I/O, increased risk of socket timeouts, and serialization delays. Furthermore, Phase 1 (Speech-to-Text via PhoWhisper) and Phase 2 (Chunking & Embedding via BGE-M3) have distinct resource profiles (sequential audio window decoding vs. batch matrix vectorization).

We need an efficient, decoupled mechanism for Spring Boot to hand off audio files to FastAPI, as well as a standardized, immutable data contract for transcription output before chunking begins.

## Decision
We mandate **Option C (Shared Storage Volume + Unified `jobId` Handshake)**:

1. **Shared Volume Mounting:**
   - A shared local directory or container volume (`volumes/rag_data`) is mounted into both `spring` and `ai` containers.
   - Spring Boot writes the incoming uploaded audio into `{STORAGE_ROOT}/ingest/incoming/` using an atomic pattern: writing to `{jobId}.tmp`, flushing to disk, and renaming to `{jobId}.{ext}`.
   - FastAPI only reads from the incoming directory; it never mutates or deletes files inside `ingest/incoming/`.

2. **Unified Identifier Handshake (`jobId`):**
   - The UUID v4 `jobId` issued by Spring Boot is the single canonical identifier throughout the entire pipeline.
   - FastAPI roots all internal artifacts under this identifier:
     - `audio/{jobId}/manifest.json` (Per-job manifest & metadata)
     - `audio/{jobId}/normalized.wav` (Normalized 16kHz mono PCM)
     - `transcripts/{jobId}/transcript.json` (Stage 1 output artifact)
   - Global index files (such as `audio_index.json`) are prohibited to eliminate concurrent write contention and race conditions. All lookup operations are $O(1)$ directly addressed via `audio/{jobId}/manifest.json`.

3. **Narrow Internal REST Interface:**
   - Spring Boot triggers ingestion via `POST /internal/v1/ai/ingest` passing only `{ jobId, lectureId, fileExtension }`.
   - Arbitrary path inputs (`audioFilePath`) are strictly disallowed to prevent Path Traversal vulnerabilities and decouple Spring Boot from FastAPI's internal storage hierarchy.

4. **Transcript Contract (`transcript.json`):**
   - Stage 1 terminates upon persisting `transcripts/{jobId}/transcript.json` and reporting status `STT_COMPLETED` back to Spring Boot.
   - The transcript artifact adheres to a strict JSON Schema: continuous non-overlapping segment intervals ($\text{segment}[i].\text{end\_time} \le \text{segment}[i+1].\text{start\_time}$), explicit `[MM:SS]` timestamp labels, and aggregated `full_text`.

5. **Atomic Filesystem Writes on Volume:**
   - All manifest and transcript writes must create temporary files within the target parent directory on the volume mount before executing an atomic `os.replace`. This prevents cross-mount `EXDEV: Invalid cross-device link` errors on Linux containers.

## Consequences
- **Positive:** Zero dual-buffering network overhead for large audio files; instant $O(1)$ lookup by `jobId`; complete protection against Path Traversal; elimination of cross-worker file locking contention.
- **Positive:** Clear, decoupled seam between ASR (Stage 1) and Vectorization (Stage 2).
- **Negative:** Requires shared filesystem/PVC availability across containers in multi-node clusters.
- **Requirement:** Spring Boot must implement the `{jobId}.tmp` atomic rename upload discipline and add `STT_COMPLETED` to its `JobStatus` enum and database constraint.
