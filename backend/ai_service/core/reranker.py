"""
Cross-Encoder Reranker Deep Module ([Q4]).
Scores [Query, Chunk] pairs using local BGE-Reranker-v2-m3 weights without FlagEmbedding
and supports sequential VRAM offloading (`LOW_VRAM_MODE`) alongside a deterministic FakeReranker.
"""
import gc
import logging
import math
from pathlib import Path
from typing import Protocol, runtime_checkable

from ai_service.core.chunk_store import unaccent_vietnamese

logger = logging.getLogger("ai_service.reranker")


@runtime_checkable
class RerankerProtocol(Protocol):
    """Seam for [Q4] Cross-Encoder candidate reranking."""

    def rerank(
        self,
        query: str,
        candidates: list[dict],
        top_n: int = 5,
    ) -> list[dict]: ...

    def unload(self) -> None: ...


class FakeReranker:
    """
    Deterministic Test & Mock Adapter: Scores candidates using unaccented Vietnamese
    lexical overlap + phrase proximity + existing RRF/dense scores in <2ms.
    """

    def __init__(self) -> None:
        self.unload_calls: int = 0

    def rerank(
        self,
        query: str,
        candidates: list[dict],
        top_n: int = 5,
    ) -> list[dict]:
        if not candidates or top_n <= 0:
            return []

        norm_query = unaccent_vietnamese(query).lower().strip()
        query_tokens = [tok for tok in norm_query.split() if tok]
        query_token_set = set(query_tokens)

        scored: list[dict] = []
        for idx, cand in enumerate(candidates):
            content = str(cand.get("content", ""))
            norm_content = unaccent_vietnamese(content).lower()
            content_tokens = set(norm_content.split())

            if query_token_set:
                overlap_ratio = len(query_token_set & content_tokens) / len(query_token_set)
            else:
                overlap_ratio = 0.0

            phrase_bonus = 1.5 if (norm_query and norm_query in norm_content) else 0.0
            rrf_score = float(cand.get("rrf_total_score", 0.0) or 0.0)
            dense_score = float(cand.get("dense_score", 0.0) or 0.0)

            logit = round(
                (overlap_ratio * 4.0) + phrase_bonus + (rrf_score * 20.0) + (dense_score * 1.5) - 1.2,
                6,
            )
            prob = round(1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, logit)))), 6)

            enriched = dict(cand)
            enriched["rerank_logit"] = logit
            enriched["rerank_score"] = prob
            scored.append((logit, rrf_score, -idx, enriched))

        scored.sort(key=lambda item: (-item[0], -item[1], -item[2]))
        return [item[3] for item in scored[:top_n]]

    def unload(self) -> None:
        self.unload_calls += 1


class BgeRerankerV2M3:
    """
    Production Adapter ([Q4]): Offline BGE-Reranker-v2-m3 Cross-Encoder.
    Lazy-loads AutoTokenizer + AutoModelForSequenceClassification from local weights
    (`local_files_only=True`) and frees RAM/VRAM via `unload()`.
    """

    def __init__(
        self,
        model_path: Path,
        device: str = "cuda",
        max_length: int = 1024,
        batch_size: int = 8,
    ) -> None:
        if max_length < 1:
            raise ValueError("max_length must be >= 1")
        if batch_size < 1:
            raise ValueError("batch_size must be >= 1")

        self.model_path = Path(model_path).resolve()
        self.device = device
        self.max_length = max_length
        self.batch_size = batch_size
        self._tokenizer = None
        self._model = None

    @property
    def model_name(self) -> str:
        return self.model_path.name

    @property
    def is_loaded(self) -> bool:
        return self._model is not None and self._tokenizer is not None

    def _ensure_loaded(self) -> None:
        if self._model is not None and self._tokenizer is not None:
            return

        if not self.model_path.is_dir():
            raise FileNotFoundError(
                f"BGE-Reranker-v2-m3 model directory not found: {self.model_path}"
            )

        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        actual_device = self.device
        if actual_device == "auto":
            actual_device = "cuda" if torch.cuda.is_available() else "cpu"
        elif actual_device == "cuda" and not torch.cuda.is_available():
            logger.warning(
                "CUDA requested but not available. Falling back to CPU for BGE-Reranker-v2-m3."
            )
            actual_device = "cpu"

        torch_dtype = torch.float16 if actual_device == "cuda" else torch.float32

        logger.info(
            "Loading BGE-Reranker-v2-m3 from %s onto %s (dtype=%s)...",
            self.model_path,
            actual_device,
            torch_dtype,
        )
        tokenizer = AutoTokenizer.from_pretrained(
            str(self.model_path),
            local_files_only=True,
        )
        model = AutoModelForSequenceClassification.from_pretrained(
            str(self.model_path),
            dtype=torch_dtype,
            low_cpu_mem_usage=True,
            local_files_only=True,
        ).to(actual_device)
        model.eval()

        self._tokenizer = tokenizer
        self._model = model
        self.device = actual_device
        logger.info("BGE-Reranker-v2-m3 successfully loaded into VRAM/RAM.")

    @staticmethod
    def _candidate_text(cand: dict) -> str:
        expanded = cand.get("expanded_context") or []
        if expanded:
            parts = []
            for item in expanded:
                pos = item.get("position", "")
                text = str(item.get("content", "")).strip()
                if text:
                    parts.append(f"[{pos}] {text}" if pos else text)
            if parts:
                return "\n".join(parts)
        return str(cand.get("content", ""))

    def rerank(
        self,
        query: str,
        candidates: list[dict],
        top_n: int = 5,
    ) -> list[dict]:
        if not candidates or top_n <= 0:
            return []

        import torch

        self._ensure_loaded()

        pairs = [[query, self._candidate_text(cand)] for cand in candidates]
        logits_all: list[float] = []

        for start in range(0, len(pairs), self.batch_size):
            batch_pairs = pairs[start : start + self.batch_size]
            encoded = self._tokenizer(
                batch_pairs,
                padding=True,
                truncation=True,
                max_length=self.max_length,
                return_tensors="pt",
            )
            encoded_on_device = {k: v.to(self.device) for k, v in encoded.items()}

            with torch.no_grad():
                outputs = self._model(**encoded_on_device)
                logits = outputs.logits.view(-1).float().cpu().tolist()
                logits_all.extend(float(x) for x in logits)

            if self.device == "cuda" and torch.cuda.is_available():
                torch.cuda.empty_cache()

        ranked: list[tuple[float, float, int, dict]] = []
        for idx, (cand, logit) in enumerate(zip(candidates, logits_all)):
            prob = 1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, logit))))
            enriched = dict(cand)
            enriched["rerank_logit"] = round(float(logit), 6)
            enriched["rerank_score"] = round(float(prob), 6)
            rrf_score = float(cand.get("rrf_total_score", 0.0) or 0.0)
            ranked.append((float(logit), rrf_score, -idx, enriched))

        ranked.sort(key=lambda item: (-item[0], -item[1], -item[2]))
        return [item[3] for item in ranked[:top_n]]

    def unload(self) -> None:
        """Release Cross-Encoder model and tokenizer from RAM/VRAM."""
        model = self._model
        tokenizer = self._tokenizer
        self._model = None
        self._tokenizer = None
        del model, tokenizer
        gc.collect()

        try:
            import torch

            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except ImportError:
            pass
