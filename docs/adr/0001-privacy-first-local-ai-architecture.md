# ADR 0001: Privacy-First On-Premise AI Architecture

## Status
Accepted

## Context
LectureLens processes university lecture recordings and student course materials. Lecture contents often involve proprietary academic research, intellectual property, or sensitive internal discussions. Transmitting lecture audio or transcripts to third-party public cloud AI APIs (e.g., OpenAI, Anthropic, Google Cloud Speech) presents privacy risks and potential compliance violations.

## Decision
We mandate an end-to-end **Privacy-First & On-Premise AI** architecture:
1. **ASR (Speech-to-Text)**: Run locally via `PhoWhisper-base` fine-tuned for Vietnamese speech.
2. **Embeddings**: Generate locally via `BGE-M3` (1024-dimensional vectors).
3. **Vector Database**: Store and query embeddings locally in PostgreSQL with `pgvector` and HNSW indexing.
4. **Reranker**: Run locally via `BGE-Reranker-v2-m3` cross-encoder.
5. **LLM Inference**: Run on-premise using Ollama with the `Gemma 4 E4B` model.

No user audio, transcripts, or embeddings may be transmitted to external third-party cloud services.

## Consequences
- Requires capable host machine hardware (GPU recommended for batch ASR and LLM inference).
- Absolute privacy and confidentiality of user lecture recordings and study data.
- Zero per-token cloud API costs.
- Fully offline / local-network operational capability.
