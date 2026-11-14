"""
BGE-M3 Dual Embedder Deep Module ([I6]).
Generates 1024-d L2-normalized FP16 dense vectors (`halfvec(1024)`) and learned
sparse lexical weights (`JSONB`) using local BGE-M3 weights without FlagEmbedding.
"""
from collections import Counter
import gc
import hashlib
import logging
from pathlib import Path
import re
from typing import Protocol, runtime_checkable
import unicodedata

import numpy as np
from pydantic import BaseModel, Field

logger = logging.getLogger("ai_service.embedder")

_WORD_TOKEN_RE = re.compile(r"\w+", flags=re.UNICODE)


def _top_k_rounded_weights(
    weights: dict[str, float],
    top_k: int,
) -> dict[str, float]:
    """Sort descending by weight (tie-broken lexicographically), keep top_k, round to 4 decimals."""
    ranked = sorted(
        weights.items(),
        key=lambda item: (-item[1], item[0]),
    )[:top_k]
    result: dict[str, float] = {}
    for token, weight in ranked:
        rounded = round(weight, 4)
        if rounded > 0.0:
            result[token] = rounded
    return result


class EmbeddingResult(BaseModel):
    """Dual dense (FP16 halfvec) and sparse lexical embedding output for one text."""

    dense_halfvec: list[float] = Field(
        ...,
        description="L2-normalized 1024-d dense vector quantized to FP16 precision for PostgreSQL halfvec(1024).",
    )
    lexical_weights: dict[str, float] = Field(
        default_factory=dict,
        description="JSONB-ready mapping of clean token strings to positive lexical weights rounded to 4 decimals.",
    )
    token_count: int = Field(
        ...,
        ge=0,
        description="Number of non-special payload tokens processed for this embedding.",
    )


@runtime_checkable
class EmbedderProtocol(Protocol):
    """Seam for dual dense + lexical text embedding providers."""

    def encode_passages(
        self,
        texts: list[str],
        batch_size: int = 8,
    ) -> list[EmbeddingResult]: ...

    def encode_query(self, text: str) -> EmbeddingResult: ...

    def unload(self) -> None: ...


class FakeEmbedder:
    """
    Deterministic Test Adapter: Generates exact 1024-d L2-normalized vectors via
    SHA-256 hash seeding and normalized term-frequency lexical weights in <5ms.
    """

    def __init__(
        self,
        dim: int = 1024,
        top_k_lexical: int = 64,
        max_length: int = 512,
    ) -> None:
        if dim < 1:
            raise ValueError("dim must be >= 1")
        if top_k_lexical < 1:
            raise ValueError("top_k_lexical must be >= 1")
        if max_length < 1:
            raise ValueError("max_length must be >= 1")
        self.dim = dim
        self.top_k_lexical = top_k_lexical
        self.max_length = max_length

    def encode_passages(
        self,
        texts: list[str],
        batch_size: int = 8,
    ) -> list[EmbeddingResult]:
        if batch_size < 1:
            raise ValueError("batch_size must be >= 1")
        if not texts:
            return []
        return [self.encode_query(text) for text in texts]

    def encode_query(self, text: str) -> EmbeddingResult:
        normalized_text = unicodedata.normalize("NFC", text)
        digest = hashlib.sha256(normalized_text.encode("utf-8")).digest()
        seed = int.from_bytes(digest, "big")
        rng = np.random.default_rng(seed)
        vec = rng.standard_normal(self.dim, dtype=np.float64)
        norm = float(np.linalg.norm(vec))
        if norm == 0.0:
            vec[0] = 1.0
        else:
            vec = vec / norm

        tokens = _WORD_TOKEN_RE.findall(normalized_text.lower())[: self.max_length]
        token_count = len(tokens)
        lexical_weights: dict[str, float] = {}
        if token_count > 0:
            counts = Counter(tokens)
            raw_weights = {
                token: count / token_count for token, count in counts.items()
            }
            lexical_weights = _top_k_rounded_weights(raw_weights, self.top_k_lexical)

        return EmbeddingResult(
            dense_halfvec=vec.tolist(),
            lexical_weights=lexical_weights,
            token_count=token_count,
        )

    def unload(self) -> None:
        """No-op for in-memory deterministic adapter."""
        return None


class BgeM3Embedder:
    """
    Production Adapter: Offline BGE-M3 dual dense + sparse lexical embedder.
    Loads local `AutoTokenizer`, `AutoModel`, and `sparse_linear.pt` directly
    without requiring `FlagEmbedding`, and supports sequential VRAM offloading.
    """

    def __init__(
        self,
        model_path: Path,
        device: str = "cuda",
        max_length: int = 512,
        top_k_lexical: int = 64,
        min_lexical_weight: float = 0.01,
    ) -> None:
        if max_length < 1:
            raise ValueError("max_length must be >= 1")
        if top_k_lexical < 1:
            raise ValueError("top_k_lexical must be >= 1")
        if min_lexical_weight < 0.0:
            raise ValueError("min_lexical_weight must be >= 0.0")

        self.model_path = Path(model_path).resolve()
        self.device = device
        self.max_length = max_length
        self.top_k_lexical = top_k_lexical
        self.min_lexical_weight = min_lexical_weight
        self._tokenizer = None
        self._model = None
        self._sparse_linear = None
        self._special_ids: set[int] = {0, 1, 2, 3}

    def _ensure_loaded(self) -> None:
        if (
            self._model is not None
            and self._tokenizer is not None
            and self._sparse_linear is not None
        ):
            return

        if not self.model_path.is_dir():
            raise FileNotFoundError(
                f"BGE-M3 model directory not found: {self.model_path}"
            )

        sparse_weights_path = self.model_path / "sparse_linear.pt"
        if not sparse_weights_path.exists():
            raise FileNotFoundError(
                f"BGE-M3 sparse projection weights not found: {sparse_weights_path}"
            )

        import torch
        import torch.nn as nn
        from transformers import AutoModel, AutoTokenizer

        actual_device = self.device
        if actual_device == "cuda" and not torch.cuda.is_available():
            logger.warning(
                "CUDA requested but not available. Falling back to CPU for BGE-M3."
            )
            actual_device = "cpu"

        torch_dtype = torch.float16 if actual_device == "cuda" else torch.float32

        logger.info(
            "Loading BGE-M3 from %s onto %s (dtype=%s)...",
            self.model_path,
            actual_device,
            torch_dtype,
        )
        tokenizer = AutoTokenizer.from_pretrained(
            str(self.model_path),
            use_fast=True,
            local_files_only=True,
        )
        model = AutoModel.from_pretrained(
            str(self.model_path),
            dtype=torch_dtype,
            low_cpu_mem_usage=True,
            local_files_only=True,
        ).to(actual_device)
        model.eval()

        sparse_state = torch.load(
            str(sparse_weights_path),
            map_location="cpu",
            weights_only=True,
        )
        sparse_linear = nn.Linear(1024, 1)
        sparse_linear.load_state_dict({k: v.float() for k, v in sparse_state.items()})
        sparse_linear = sparse_linear.to(actual_device)
        sparse_linear.eval()

        self._tokenizer = tokenizer
        self._model = model
        self._sparse_linear = sparse_linear
        self.device = actual_device
        extra_special_ids = getattr(tokenizer, "all_special_ids", []) or []
        self._special_ids = {0, 1, 2, 3} | set(extra_special_ids)
        logger.info("BGE-M3 successfully loaded into VRAM/RAM.")

    def _extract_lexical_weights_and_count(
        self,
        token_ids: list[int],
        attention_mask: list[int],
        token_weights: list[float],
    ) -> tuple[dict[str, float], int]:
        token_id_max: dict[int, float] = {}
        payload_token_count = 0

        for token_id, mask, weight in zip(token_ids, attention_mask, token_weights):
            if mask != 1 or token_id in self._special_ids:
                continue
            payload_token_count += 1
            if weight > 0.0:
                prev = token_id_max.get(token_id, 0.0)
                if weight > prev:
                    token_id_max[token_id] = float(weight)

        clean_weights: dict[str, float] = {}
        for token_id, weight in token_id_max.items():
            if weight < self.min_lexical_weight:
                continue
            raw_token = self._tokenizer.convert_ids_to_tokens(token_id)
            if not raw_token:
                continue
            clean_token = raw_token.lstrip("\u2581").strip()
            if not clean_token or not any(ch.isalnum() for ch in clean_token):
                continue
            prev = clean_weights.get(clean_token, 0.0)
            if weight > prev:
                clean_weights[clean_token] = weight

        lexical_weights = _top_k_rounded_weights(clean_weights, self.top_k_lexical)
        return lexical_weights, payload_token_count

    def encode_passages(
        self,
        texts: list[str],
        batch_size: int = 8,
    ) -> list[EmbeddingResult]:
        if batch_size < 1:
            raise ValueError("batch_size must be >= 1")
        if not texts:
            return []

        import torch
        import torch.nn.functional as F

        self._ensure_loaded()
        results: list[EmbeddingResult] = []

        for start in range(0, len(texts), batch_size):
            batch_texts = texts[start : start + batch_size]
            encoded = self._tokenizer(
                batch_texts,
                padding=True,
                truncation=True,
                max_length=self.max_length,
                return_tensors="pt",
            )
            encoded_on_device = {k: v.to(self.device) for k, v in encoded.items()}

            with torch.no_grad():
                outputs = self._model(**encoded_on_device)
                last_hidden = outputs.last_hidden_state

                cls_emb = last_hidden[:, 0, :].float()
                dense_norm = F.normalize(cls_emb, p=2, dim=-1)
                dense_half_vectors = dense_norm.half().float().cpu().tolist()

                sparse_logits = self._sparse_linear(last_hidden.float()).squeeze(-1)
                attention_mask = encoded_on_device["attention_mask"]
                token_weights = torch.relu(sparse_logits) * attention_mask.float()

                input_ids_batch = encoded["input_ids"].tolist()
                attn_mask_batch = encoded["attention_mask"].tolist()
                weights_batch = token_weights.cpu().tolist()

            for dense_vec, token_ids, attn_mask, weights in zip(
                dense_half_vectors,
                input_ids_batch,
                attn_mask_batch,
                weights_batch,
            ):
                lexical_weights, token_count = self._extract_lexical_weights_and_count(
                    token_ids=token_ids,
                    attention_mask=attn_mask,
                    token_weights=weights,
                )
                results.append(
                    EmbeddingResult(
                        dense_halfvec=dense_vec,
                        lexical_weights=lexical_weights,
                        token_count=token_count,
                    )
                )

            if self.device == "cuda" and torch.cuda.is_available():
                torch.cuda.empty_cache()

        return results

    def encode_query(self, text: str) -> EmbeddingResult:
        return self.encode_passages([text], batch_size=1)[0]

    def unload(self) -> None:
        """Release model, tokenizer, and sparse head from RAM/VRAM."""
        model = self._model
        tokenizer = self._tokenizer
        sparse_linear = self._sparse_linear
        self._model = None
        self._tokenizer = None
        self._sparse_linear = None
        self._special_ids = {0, 1, 2, 3}
        del model, tokenizer, sparse_linear
        gc.collect()

        try:
            import torch

            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except ImportError:
            pass

