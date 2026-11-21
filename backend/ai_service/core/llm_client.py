"""
Gemma 4 E4B LLM Client Deep Module ([Q5], [Q6], [Q7+]).
Provides a unified LLMClientProtocol seam with:
- OllamaGemmaClient (calls local Ollama /api/chat)
- TransformersGemmaClient (direct local inference on backend/models/gemma-4-e4b)
- FakeLLMClient (deterministic fast adapter for automated tests and UI mock mode)
- CompositeLLMClient (auto/ollama/transformers/mock routing + sequential VRAM unload)
"""
import gc
import inspect
import json
import logging
from pathlib import Path
import re
import time
from typing import Literal, Protocol, runtime_checkable

import httpx
from pydantic import BaseModel

from ai_service.core.prompt_builder import BuiltPrompt

logger = logging.getLogger("ai_service.llm_client")

EngineMode = Literal["auto", "ollama", "transformers", "mock"]

_THOUGHT_BLOCK_RE = re.compile(r"<\|channel>thought\s*.*?<channel\|>", flags=re.DOTALL)


class LLMGenerationResult(BaseModel):
    """Structured output returned by a single Gemma 4 inference pass."""

    text: str
    model: str
    engine: str
    latency_ms: float = 0.0
    prompt_tokens: int | None = None
    completion_tokens: int | None = None


@runtime_checkable
class LLMClientProtocol(Protocol):
    """Seam for local Gemma 4 E4B generation and VRAM offloading."""

    def generate(
        self,
        built_prompt: BuiltPrompt,
        *,
        query: str = "",
        contexts: list[dict] | None = None,
        temperature: float = 0.2,
        max_new_tokens: int = 512,
    ) -> LLMGenerationResult: ...

    def unload(self) -> None: ...


def _strip_thinking_channel(text: str) -> str:
    cleaned = _THOUGHT_BLOCK_RE.sub("", text)
    return cleaned.strip()


class FakeLLMClient:
    """
    Deterministic Test & Mock Adapter: Simulates 2-Pass Pre-RAG Gemma 4 execution
    without loading model weights.
    """

    def __init__(self, model_name: str = "gemma4:e2b-mock") -> None:
        self.model_name = model_name
        self.calls: list[dict] = []
        self.unload_calls: int = 0

    @staticmethod
    def _extract_snippets(contexts: list[dict] | None) -> list[tuple[str, str]]:
        if not contexts:
            return []
        items: list[tuple[str, str]] = []
        for ctx in contexts[:5]:
            ts = str(ctx.get("start_timestamp_display") or ctx.get("startTime") or "00:00")
            content = str(ctx.get("content") or ctx.get("text_snippet") or "").strip()
            if content:
                items.append((ts, content))
        return items

    def generate(
        self,
        built_prompt: BuiltPrompt,
        *,
        query: str = "",
        contexts: list[dict] | None = None,
        temperature: float = 0.2,
        max_new_tokens: int = 512,
    ) -> LLMGenerationResult:
        t0 = time.perf_counter()
        self.calls.append(
            {
                "stage_id": built_prompt.stage_id,
                "profile": built_prompt.profile,
                "system_prompt": built_prompt.system_prompt,
                "user_prompt": built_prompt.user_prompt,
                "response_format": built_prompt.response_format,
                "temperature": temperature,
                "max_new_tokens": max_new_tokens,
            }
        )

        snippets = self._extract_snippets(contexts)
        if built_prompt.stage_id == "q1_query_prep":
            cleaned_q = query.strip()
            text = f"Giải thích chi tiết về {cleaned_q}" if cleaned_q else ""
        elif built_prompt.response_format == "json":
            questions = []
            for idx, (ts, txt) in enumerate(snippets[:2], start=1):
                short_txt = txt[:140].rstrip(".")
                questions.append(
                    {
                        "question": f"Câu hỏi {idx}: Nội dung chính được giảng ở mốc [{ts}] về \"{query.strip()}\" là gì?",
                        "options": [
                            f"A. {short_txt}",
                            "B. Nội dung không liên quan đến bài giảng",
                            "C. Khái niệm ngoài phạm vi học phần",
                            "D. Cả B và C đều đúng",
                        ],
                        "answer": f"A. {short_txt}",
                        "timestamp": f"[{ts}]",
                        "explanation": f"Giảng viên trình bày trực tiếp nội dung này tại [{ts}].",
                    }
                )
            if not questions:
                questions.append(
                    {
                        "question": "Bài giảng có đề cập nội dung được hỏi không?",
                        "options": [
                            "A. Không đề cập trong ngữ cảnh đã trích xuất",
                            "B. Có đề cập chi tiết",
                        ],
                        "answer": "A. Không đề cập trong ngữ cảnh đã trích xuất",
                        "timestamp": "[00:00]",
                        "explanation": "Không tìm thấy ngữ cảnh phù hợp.",
                    }
                )
            text = json.dumps({"questions": questions}, ensure_ascii=False, indent=2)
        elif built_prompt.stage_id == "q5_rag_answer":
            if not snippets:
                text = "Bài giảng không đề cập đến nội dung này."
            elif built_prompt.profile == "cornell_notes":
                bullets = "\n".join(f"- {txt} [{ts}]" for ts, txt in snippets[:3])
                text = (
                    f"## Summary\nTổng hợp câu trả lời chuẩn hóa cho \"{query.strip()}\" từ bài giảng.\n\n"
                    f"## Cues\n- {query.strip() or 'Khái niệm trọng tâm'}\n\n"
                    f"## Notes\n{bullets}"
                )
            else:
                bullets = [f"- {txt} [{ts}]" for ts, txt in snippets[:3]]
                text = (
                    f"Dựa trên ngữ cảnh bài giảng cho câu hỏi \"{query.strip()}\":\n"
                    + "\n".join(bullets)
                )
        else:
            # Extensible [Q6+] stage simulation
            prior = built_prompt.user_prompt.split("[ĐẦU RA TỪ BƯỚC TRƯỚC]\n", 1)[-1].split("\n\n[NGỮ CẢNH", 1)[0].strip()
            text = f"[{built_prompt.stage_id}] {prior}"

        return LLMGenerationResult(
            text=text,
            model=self.model_name,
            engine="mock",
            latency_ms=round((time.perf_counter() - t0) * 1000, 2),
        )

    def unload(self) -> None:
        self.unload_calls += 1


class OllamaGemmaClient:
    """
    Production Adapter: Calls local Ollama HTTP API (`/api/chat`) serving Gemma 4 (default gemma4:e2b).
    """

    def __init__(
        self,
        base_url: str = "http://llm:11434",
        model: str = "gemma4:e2b",
        timeout_seconds: float = 120.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = timeout_seconds

    def is_available(self, timeout_seconds: float = 1.5) -> bool:
        try:
            with httpx.Client(timeout=timeout_seconds) as client:
                resp = client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

    def generate(
        self,
        built_prompt: BuiltPrompt,
        *,
        query: str = "",
        contexts: list[dict] | None = None,
        temperature: float = 0.2,
        max_new_tokens: int = 512,
        model_override: str | None = None,
    ) -> LLMGenerationResult:
        t0 = time.perf_counter()
        effective_model = (model_override or self.model).strip() or self.model
        payload: dict = {
            "model": effective_model,
            "messages": [
                {"role": "system", "content": built_prompt.system_prompt},
                {"role": "user", "content": built_prompt.user_prompt},
            ],
            "stream": False,
            "options": {
                "temperature": float(temperature),
                "num_predict": int(max_new_tokens),
                "repeat_penalty": 1.15,
            },
        }
        if built_prompt.response_format == "json":
            payload["format"] = "json"

        with httpx.Client(timeout=self.timeout_seconds) as client:
            resp = client.post(f"{self.base_url}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()

        message = data.get("message") or {}
        raw_text = str(message.get("content") or data.get("response") or "")
        return LLMGenerationResult(
            text=_strip_thinking_channel(raw_text),
            model=effective_model,
            engine="ollama",
            latency_ms=round((time.perf_counter() - t0) * 1000, 2),
            prompt_tokens=data.get("prompt_eval_count"),
            completion_tokens=data.get("eval_count"),
        )

    def unload(self) -> None:
        return None


_GEMMA4_QAT_PATCHES_INSTALLED = False
_LM_HEAD_MIN_OUT_FEATURES = 65536
_LM_HEAD_CHUNK_ROWS = 32768
_MULTIMODAL_TOWER_ATTRS = ("vision_tower", "audio_tower", "embed_vision", "embed_audio")


def _empty_cuda_cache() -> None:
    """Safely release cached CUDA allocator blocks when CUDA is present."""
    try:
        import torch

        if hasattr(torch, "cuda") and callable(getattr(torch.cuda, "empty_cache", None)):
            torch.cuda.empty_cache()
    except Exception:
        pass


def _move_model_to_cpu(model):
    """Move a loaded model back to CPU, collect unreachable tensors, and clear CUDA cache."""
    moved = model.to("cpu")
    gc.collect()
    _empty_cuda_cache()
    return moved


def _unpack_gemma_int(packed, num_bits: int, width: int, unpack_int4_fn, unpack_int2_fn):
    """Unpack INT2/INT4 uint8 storage to signed int8, or return INT8 directly."""
    if num_bits == 4:
        return unpack_int4_fn(packed, width)
    if num_bits == 2:
        return unpack_int2_fn(packed, width)
    return packed


def _chunked_quantized_linear_forward(
    layer,
    x,
    *,
    apply_srq_fn,
    unpack_rows_fn,
    chunk_rows: int = _LM_HEAD_CHUNK_ROWS,
):
    """Dequantize and execute `F.linear` in row chunks to bound transient lm_head VRAM."""
    import torch
    import torch.nn.functional as F

    x_q = apply_srq_fn(x, layer.input_activation_scale)
    out_chunks: list[torch.Tensor] = []
    for start in range(0, layer.out_features, chunk_rows):
        end = min(start + chunk_rows, layer.out_features)
        int_chunk = unpack_rows_fn(layer.weight[start:end], layer.num_bits, layer.in_features)
        w_chunk = int_chunk.to(x_q.dtype) * layer.weight_scale[start:end].to(x_q.dtype)
        bias_chunk = layer.bias[start:end] if layer.bias is not None else None
        out_chunks.append(F.linear(x_q, w_chunk, bias_chunk))
        del int_chunk, w_chunk
    out = torch.cat(out_chunks, dim=-1)
    del out_chunks
    return apply_srq_fn(out, layer.output_activation_scale)


class _LazyWeightSlice:
    """Lazy proxy for `QuantizedEmbedding.weight` enabling single-row dequantization."""

    def __init__(self, qe) -> None:
        self._qe = qe

    @property
    def shape(self):
        import torch

        return torch.Size((self._qe.num_embeddings, self._qe.embedding_dim))

    @property
    def dtype(self):
        return self._qe.output_dtype

    @property
    def device(self):
        return self._qe.embedding_quantized.device

    @property
    def requires_grad(self) -> bool:
        return bool(getattr(self._qe.embedding_quantized, "requires_grad", False))

    def __getitem__(self, idx):
        row_idx: int | None = None
        rest: tuple = ()
        if isinstance(idx, int) and not isinstance(idx, bool):
            row_idx = idx
        elif (
            isinstance(idx, tuple)
            and len(idx) >= 1
            and isinstance(idx[0], int)
            and not isinstance(idx[0], bool)
        ):
            row_idx = idx[0]
            rest = idx[1:]

        if row_idx is not None:
            num_rows = int(self._qe.embedding_quantized.shape[0])
            norm_idx = row_idx + num_rows if row_idx < 0 else row_idx
            if norm_idx < 0 or norm_idx >= num_rows:
                raise IndexError(
                    f"index {row_idx} is out of bounds for dimension 0 with size {num_rows}"
                )
            q_row = self._qe.embedding_quantized[norm_idx : norm_idx + 1]
            s_row = self._qe.embedding_scale[norm_idx : norm_idx + 1]
            row = self._qe._dequantize_weights(q_row, s_row).squeeze(0)
            if not rest:
                return row
            return row[rest[0]] if len(rest) == 1 else row[rest]

        full = self._qe._dequantize_weights(
            self._qe.embedding_quantized, self._qe.embedding_scale
        )
        return full[idx]


def _install_gemma4_qat_patches() -> None:
    """Install idempotent Gemma 4 QAT compatibility and 4 GB VRAM patches into transformers."""
    global _GEMMA4_QAT_PATCHES_INSTALLED
    if _GEMMA4_QAT_PATCHES_INSTALLED:
        return

    try:
        import torch
        from transformers.integrations.gemma_quant import (
            QuantizedEmbedding,
            QuantizedLinear,
            _unpack_int2,
            _unpack_int4,
            apply_srq,
        )
        from transformers.quantizers.quantizer_gemma import GemmaQuantizer
    except (ImportError, AttributeError):
        return

    def _unpack_rows(packed: torch.Tensor, num_bits: int, width: int) -> torch.Tensor:
        return _unpack_gemma_int(packed, num_bits, width, _unpack_int4, _unpack_int2)

    if not getattr(GemmaQuantizer._process_model_before_weight_loading, "_lecturelens_patched", False):
        orig_process_model = GemmaQuantizer._process_model_before_weight_loading

        def _patched_process_model_before_weight_loading(self, model, **kwargs):
            result = orig_process_model(self, model, **kwargs)
            cfg = getattr(model, "config", None)
            text_cfg = (getattr(cfg, "text_config", None) or cfg) if cfg is not None else None
            num_layers = getattr(text_cfg, "num_hidden_layers", None) if text_cfg is not None else None
            if num_layers is not None and int(num_layers) > 1:
                target_layers = int(num_layers)
                for mod_name, mod in model.named_modules():
                    if not mod_name.endswith("embed_tokens_per_layer"):
                        continue
                    scale = getattr(mod, "embedding_scale", None)
                    if scale is None or len(getattr(scale, "shape", ())) == 0 or scale.shape[-1] != 1:
                        continue
                    num_embeddings = getattr(mod, "num_embeddings", scale.shape[0])
                    scale_device = getattr(scale, "device", None)
                    mod.embedding_scale = torch.nn.Parameter(
                        torch.ones(
                            num_embeddings,
                            target_layers,
                            dtype=torch.float32,
                            device=scale_device,
                        ),
                        requires_grad=False,
                    )
            return result

        _patched_process_model_before_weight_loading._lecturelens_patched = True  # type: ignore[attr-defined]
        GemmaQuantizer._process_model_before_weight_loading = _patched_process_model_before_weight_loading  # type: ignore[method-assign]

    if not getattr(QuantizedEmbedding._dequantize_weights, "_lecturelens_patched", False):
        orig_embed_dequant = QuantizedEmbedding._dequantize_weights

        def _patched_embed_dequant(self, quant_rows: torch.Tensor, scale_rows: torch.Tensor) -> torch.Tensor:
            if scale_rows.shape[-1] == 1:
                int_rows = _unpack_rows(quant_rows, self.num_bits, self.embedding_dim)
                return int_rows.to(self.output_dtype) * scale_rows.to(self.output_dtype)
            return orig_embed_dequant(self, quant_rows, scale_rows)

        _patched_embed_dequant._lecturelens_patched = True  # type: ignore[attr-defined]
        QuantizedEmbedding._dequantize_weights = _patched_embed_dequant  # type: ignore[method-assign]

    QuantizedEmbedding.weight = property(lambda self: _LazyWeightSlice(self))  # type: ignore[assignment]

    if not getattr(QuantizedLinear.forward, "_lecturelens_patched", False):
        orig_linear_forward = QuantizedLinear.forward

        def _patched_linear_forward(self, x: torch.Tensor) -> torch.Tensor:
            if self.out_features >= _LM_HEAD_MIN_OUT_FEATURES and x.is_cuda:
                return _chunked_quantized_linear_forward(
                    self,
                    x,
                    apply_srq_fn=apply_srq,
                    unpack_rows_fn=_unpack_rows,
                )
            return orig_linear_forward(self, x)

        _patched_linear_forward._lecturelens_patched = True  # type: ignore[attr-defined]
        QuantizedLinear.forward = _patched_linear_forward  # type: ignore[method-assign]

    _GEMMA4_QAT_PATCHES_INSTALLED = True


def _apply_low_vram_cuda_placement(model, target_device: str):
    """Prune unused multimodal towers and CPU-offload PLE embeddings before CUDA placement."""
    inner_model = getattr(model, "model", None)
    if inner_model is not None:
        for tower_attr in _MULTIMODAL_TOWER_ATTRS:
            if hasattr(inner_model, tower_attr) and getattr(inner_model, tower_attr) is not None:
                setattr(inner_model, tower_attr, None)

        language_model = getattr(inner_model, "language_model", None) or inner_model
        ple = getattr(language_model, "embed_tokens_per_layer", None)
        if (
            ple is not None
            and hasattr(ple, "embedding_quantized")
            and hasattr(ple, "embedding_scale")
        ):
            ple._cpu_quantized = ple.embedding_quantized.detach().to("cpu")
            ple._cpu_scale = ple.embedding_scale.detach().to("cpu")
            params = getattr(ple, "_parameters", None)
            if isinstance(params, dict):
                params.pop("embedding_quantized", None)
                params.pop("embedding_scale", None)

            def _cpu_sliced_ple_forward(input_ids):
                cpu_ids = input_ids.to("cpu")
                q_slice = ple._cpu_quantized[cpu_ids].to(input_ids.device, non_blocking=True)
                s_slice = ple._cpu_scale[cpu_ids].to(input_ids.device, non_blocking=True)
                result = ple._dequantize_weights(q_slice, s_slice)
                return (result * ple.scalar_embed_scale).to(ple.output_dtype)

            ple.forward = _cpu_sliced_ple_forward

    gc.collect()
    return model.to(target_device)


def _supports_logits_to_keep(model) -> bool:
    """Return True only when `model.forward` explicitly declares a `logits_to_keep` parameter."""
    forward_fn = getattr(model, "forward", None)
    if forward_fn is None:
        return False
    try:
        sig = inspect.signature(forward_fn)
    except (TypeError, ValueError):
        return False
    return "logits_to_keep" in sig.parameters


class TransformersGemmaClient:
    """
    Production Local Adapter: Directly loads `backend/models/gemma-4-e2b` (QAT Mobile INT2/4/8
    via native `GemmaQuantizer`, or standard BF16 weights) using HuggingFace `transformers`,
    applying Gemma 4's canonical `chat_template.jinja`.
    """

    def __init__(
        self,
        model_path: Path,
        device: str = "cuda",
    ) -> None:
        self.model_path = Path(model_path).resolve()
        self.device = device
        self._tokenizer = None
        self._model = None

    def is_model_present(self) -> bool:
        return (
            self.model_path.is_dir()
            and (self.model_path / "config.json").exists()
            and (
                (self.model_path / "model.safetensors").exists()
                or (self.model_path / "pytorch_model.bin").exists()
                or any(self.model_path.glob("model-*.safetensors"))
            )
        )

    def _ensure_loaded(self) -> None:
        if self._model is not None and self._tokenizer is not None:
            return

        if not self.model_path.is_dir():
            raise FileNotFoundError(
                f"Gemma 4 model directory not found: {self.model_path}"
            )

        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        actual_device = self.device
        if actual_device == "auto":
            actual_device = "cuda" if torch.cuda.is_available() else "cpu"
        elif actual_device == "cuda" and not torch.cuda.is_available():
            logger.warning(
                "CUDA requested but not available. Falling back to CPU for Gemma 4."
            )
            actual_device = "cpu"

        logger.info(
            "Loading Gemma 4 from %s onto %s (dtype=auto)...",
            self.model_path,
            actual_device,
        )
        _install_gemma4_qat_patches()
        tokenizer = AutoTokenizer.from_pretrained(
            str(self.model_path),
            local_files_only=True,
        )
        # dtype="auto" lets transformers activate GemmaQuantizer (INT2/4/8) for QAT Mobile
        # checkpoints automatically while preserving native bfloat16 for unquantized checkpoints.
        model = AutoModelForCausalLM.from_pretrained(
            str(self.model_path),
            dtype="auto",
            local_files_only=True,
        )
        if actual_device != "cpu":
            try:
                model = _apply_low_vram_cuda_placement(model, actual_device)
            except RuntimeError as exc:
                logger.warning(
                    "Gemma 4 CUDA placement failed (%s); falling back to CPU.",
                    exc,
                )
                model = _move_model_to_cpu(model)
                actual_device = "cpu"
        model.eval()

        self._tokenizer = tokenizer
        self._model = model
        self.device = actual_device
        logger.info(
            "Gemma 4 successfully loaded into VRAM/RAM (quantized=%s).",
            bool(getattr(model, "is_quantized", False)),
        )

    def generate(
        self,
        built_prompt: BuiltPrompt,
        *,
        query: str = "",
        contexts: list[dict] | None = None,
        temperature: float = 0.2,
        max_new_tokens: int = 512,
    ) -> LLMGenerationResult:
        import torch

        t0 = time.perf_counter()
        self._ensure_loaded()

        messages = [
            {"role": "system", "content": built_prompt.system_prompt},
            {"role": "user", "content": built_prompt.user_prompt},
        ]
        encoded = self._tokenizer.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt",
            return_dict=True,
        )
        encoded_on_device = {k: v.to(self.device) for k, v in encoded.items()}
        input_len = int(encoded_on_device["input_ids"].shape[-1])

        pad_token_id = self._tokenizer.pad_token_id
        if pad_token_id is None:
            pad_token_id = 0

        gen_kwargs: dict = {
            "max_new_tokens": int(max_new_tokens),
            "do_sample": float(temperature) > 0.0,
            "pad_token_id": int(pad_token_id),
            "repetition_penalty": 1.15,
        }
        if float(temperature) > 0.0:
            gen_kwargs["temperature"] = float(temperature)

        # Preserve model.generation_config.eos_token_id (Gemma 4 uses [1, 106, 50], including <turn|>=106)
        # instead of overwriting with single tokenizer.eos_token_id=1.
        eos_ids: list[int] = []
        gen_cfg_eos = getattr(getattr(self._model, "generation_config", None), "eos_token_id", None)
        if isinstance(gen_cfg_eos, (list, tuple)):
            eos_ids.extend(int(x) for x in gen_cfg_eos if x is not None)
        elif gen_cfg_eos is not None:
            eos_ids.append(int(gen_cfg_eos))
        if self._tokenizer.eos_token_id is not None:
            eos_ids.append(int(self._tokenizer.eos_token_id))
        turn_id = self._tokenizer.convert_tokens_to_ids("<turn|>")
        if isinstance(turn_id, int) and turn_id >= 0 and turn_id != getattr(self._tokenizer, "unk_token_id", None):
            eos_ids.append(int(turn_id))
        if eos_ids:
            deduped_eos = list(dict.fromkeys(eos_ids))
            gen_kwargs["eos_token_id"] = deduped_eos if len(deduped_eos) > 1 else deduped_eos[0]
        if _supports_logits_to_keep(self._model):
            gen_kwargs["logits_to_keep"] = 1

        try:
            with torch.no_grad():
                output_ids = self._model.generate(**encoded_on_device, **gen_kwargs)
        except RuntimeError as exc:
            if self.device == "cpu":
                raise
            logger.warning(
                "Gemma 4 CUDA generation failed (%s); falling back to CPU.",
                exc,
            )
            encoded_on_device = {k: v.to("cpu") for k, v in encoded_on_device.items()}
            self._model = _move_model_to_cpu(self._model)
            self.device = "cpu"
            with torch.no_grad():
                output_ids = self._model.generate(**encoded_on_device, **gen_kwargs)

        new_token_ids = output_ids[0][input_len:]
        completion_tokens = int(new_token_ids.shape[-1])
        # Decode with skip_special_tokens=False first so <|channel>thought...<channel|>
        # special tokens remain intact for _strip_thinking_channel(), then remove special tokens.
        raw_decoded = self._tokenizer.decode(new_token_ids, skip_special_tokens=False)
        cleaned = _strip_thinking_channel(raw_decoded)
        for special_tok in getattr(self._tokenizer, "all_special_tokens", []) or []:
            if special_tok:
                cleaned = cleaned.replace(special_tok, "")
        cleaned = cleaned.strip()

        if str(self.device).startswith("cuda") and torch.cuda.is_available():
            torch.cuda.empty_cache()

        return LLMGenerationResult(
            text=cleaned,
            model=self.model_path.name,
            engine="transformers",
            latency_ms=round((time.perf_counter() - t0) * 1000, 2),
            prompt_tokens=input_len,
            completion_tokens=completion_tokens,
        )

    def unload(self) -> None:
        """Release Gemma 4 E4B model and tokenizer from RAM/VRAM."""
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


class CompositeLLMClient:
    """
    Routing Adapter selecting between OllamaGemmaClient, local TransformersGemmaClient,
    and FakeLLMClient (`mode="auto" | "ollama" | "transformers" | "mock"`).
    """

    def __init__(
        self,
        *,
        mode: EngineMode = "auto",
        ollama_client: OllamaGemmaClient | None = None,
        transformers_client: TransformersGemmaClient | None = None,
        mock_client: FakeLLMClient | None = None,
    ) -> None:
        self.mode: EngineMode = mode
        self.ollama_client = ollama_client
        self.transformers_client = transformers_client
        self.mock_client = mock_client or FakeLLMClient()

    def resolve_active_engine(self, requested_mode: EngineMode | None = None) -> str:
        effective = requested_mode or self.mode
        if effective == "mock":
            return "mock"
        if effective == "ollama":
            if self.ollama_client is None:
                raise RuntimeError("Ollama client is not configured.")
            return "ollama"
        if effective == "transformers":
            if self.transformers_client is None:
                raise RuntimeError("Transformers Gemma 4 client is not configured.")
            return "transformers"

        # Auto: prefer running Ollama service, otherwise local Transformers Gemma 4 weights
        if self.ollama_client is not None and self.ollama_client.is_available():
            return "ollama"
        if self.transformers_client is not None and self.transformers_client.is_model_present():
            return "transformers"
        raise RuntimeError(
            "No Gemma 4 E4B runtime available: Ollama server is unreachable and local model weights were not found."
        )

    def generate(
        self,
        built_prompt: BuiltPrompt,
        *,
        query: str = "",
        contexts: list[dict] | None = None,
        temperature: float = 0.2,
        max_new_tokens: int = 512,
        engine_override: EngineMode | None = None,
        model_override: str | None = None,
    ) -> LLMGenerationResult:
        engine = self.resolve_active_engine(engine_override)
        if engine == "mock":
            return self.mock_client.generate(
                built_prompt,
                query=query,
                contexts=contexts,
                temperature=temperature,
                max_new_tokens=max_new_tokens,
            )
        if engine == "ollama":
            assert self.ollama_client is not None
            return self.ollama_client.generate(
                built_prompt,
                query=query,
                contexts=contexts,
                temperature=temperature,
                max_new_tokens=max_new_tokens,
                model_override=model_override,
            )
        assert self.transformers_client is not None
        return self.transformers_client.generate(
            built_prompt,
            query=query,
            contexts=contexts,
            temperature=temperature,
            max_new_tokens=max_new_tokens,
        )

    def unload(self) -> None:
        if self.transformers_client is not None:
            self.transformers_client.unload()
        if self.ollama_client is not None:
            self.ollama_client.unload()
        self.mock_client.unload()
