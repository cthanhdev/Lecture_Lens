"""
Gemma 4 E4B LLM Client Deep Module ([Q5], [Q6], [Q7+]).
Provides a unified LLMClientProtocol seam with:
- OllamaGemmaClient (calls local Ollama /api/chat)
- TransformersGemmaClient (direct local inference on backend/models/gemma-4-e4b)
- FakeLLMClient (deterministic fast adapter for automated tests and UI mock mode)
- CompositeLLMClient (auto/ollama/transformers/mock routing + sequential VRAM unload)
"""
import gc
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
    Deterministic Test & Mock Adapter: Simulates Multi-Pass Gemma 4 E4B execution
    without loading the 15.88 GB model weights.
    """

    def __init__(self, model_name: str = "gemma-4-e4b-mock") -> None:
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
        if built_prompt.response_format == "json":
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
        elif built_prompt.stage_id == "q5_rag_draft":
            if not snippets:
                text = "Bài giảng không đề cập đến nội dung này."
            else:
                bullets = [f"- {txt} [{ts}]" for ts, txt in snippets[:3]]
                text = (
                    f"Dựa trên ngữ cảnh bài giảng cho câu hỏi \"{query.strip()}\":\n"
                    + "\n".join(bullets)
                )
        elif built_prompt.profile == "cornell_notes":
            bullets = "\n".join(f"- {txt} [{ts}]" for ts, txt in snippets[:3]) or "- Bài giảng không đề cập đến nội dung này."
            text = (
                f"## Summary\nTổng hợp câu trả lời chuẩn hóa cho \"{query.strip()}\" từ bài giảng.\n\n"
                f"## Cues\n- {query.strip() or 'Khái niệm trọng tâm'}\n\n"
                f"## Notes\n{bullets}"
            )
        elif built_prompt.stage_id == "q6_custom_refine":
            if not snippets:
                text = "Bài giảng không đề cập đến nội dung này."
            else:
                joined = " ".join(f"{txt} [{ts}]" for ts, txt in snippets[:2])
                prompt_hint = built_prompt.system_prompt.splitlines()[0][:80]
                text = f"{joined}\n\n(Đã biên tập theo System Prompt: {prompt_hint})"
        else:
            # Extensible [Q7+] stage simulation
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
    Production Adapter: Calls local Ollama HTTP API (`/api/chat`) serving Gemma 4 E4B.
    """

    def __init__(
        self,
        base_url: str = "http://llm:11434",
        model: str = "gemma-4-e4b",
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
    ) -> LLMGenerationResult:
        t0 = time.perf_counter()
        payload: dict = {
            "model": self.model,
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
            model=self.model,
            engine="ollama",
            latency_ms=round((time.perf_counter() - t0) * 1000, 2),
            prompt_tokens=data.get("prompt_eval_count"),
            completion_tokens=data.get("eval_count"),
        )

    def unload(self) -> None:
        return None


class TransformersGemmaClient:
    """
    Production Local Adapter: Directly loads `backend/models/gemma-4-e4b` via
    HuggingFace `transformers` (`Gemma4ForConditionalGeneration` / `AutoModelForCausalLM`),
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
                f"Gemma 4 E4B model directory not found: {self.model_path}"
            )

        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        actual_device = self.device
        if actual_device == "auto":
            actual_device = "cuda" if torch.cuda.is_available() else "cpu"
        elif actual_device == "cuda" and not torch.cuda.is_available():
            logger.warning(
                "CUDA requested but not available. Falling back to CPU for Gemma 4 E4B."
            )
            actual_device = "cpu"

        # Gemma 4 E4B weights are natively bfloat16 (~15.88 GB); casting to float32 on CPU
        # would double RAM footprint to ~32 GB and OOM 16 GB dev hosts.
        torch_dtype = torch.bfloat16

        logger.info(
            "Loading Gemma 4 E4B from %s onto %s (dtype=%s)...",
            self.model_path,
            actual_device,
            torch_dtype,
        )
        tokenizer = AutoTokenizer.from_pretrained(
            str(self.model_path),
            local_files_only=True,
        )
        model = AutoModelForCausalLM.from_pretrained(
            str(self.model_path),
            dtype=torch_dtype,
            low_cpu_mem_usage=True,
            local_files_only=True,
        ).to(actual_device)
        model.eval()

        self._tokenizer = tokenizer
        self._model = model
        self.device = actual_device
        logger.info("Gemma 4 E4B successfully loaded into VRAM/RAM.")

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

        if self.device == "cuda" and torch.cuda.is_available():
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
