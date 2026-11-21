"""
ModelRegistry Deep Module: Local on-premise AI model catalog inspection.
Reads directory presence, weight artifacts, real disk sizes (excluding .cache),
and architecture/quantization metadata from config.json without loading tensors.
"""
from dataclasses import dataclass
import importlib.metadata
import json
import logging
from pathlib import Path
import re
import sys
from typing import Literal, Protocol, runtime_checkable

from pydantic import BaseModel, Field

from ai_service.config import Settings

logger = logging.getLogger("ai_service.model_registry")

_WEIGHT_FILENAMES = ("pytorch_model.bin", "model.safetensors")


class ModelSpecReport(BaseModel):
    """Structured inspection report for one local model directory."""

    key: str
    display_name: str
    repo_id: str
    stage: str
    stage_code: str
    role: str
    wiring_status: Literal["ACTIVE", "STAGED"]
    local_path: str
    exists_on_disk: bool
    weights_ready: bool
    disk_size_mb: float
    disk_size_gb: float
    primary_weight_file: str | None = None
    architecture: str | None = None
    model_type: str | None = None
    quantization: str | None = None
    max_context: str | None = None
    modalities: list[str] = Field(default_factory=list)
    required_transformers: str | None = None
    runtime_compatible: bool = True
    extra_artifacts: dict[str, bool] = Field(default_factory=dict)
    notes: list[str] = Field(default_factory=list)


class ModelCatalogSnapshot(BaseModel):
    """Aggregate inventory of all configured LectureLens on-premise AI models."""

    models: list[ModelSpecReport]
    total_disk_mb: float
    total_disk_gb: float
    active_count: int
    staged_count: int
    ready_on_disk_count: int
    transformers_version: str | None = None
    python_version: str


@runtime_checkable
class ModelRegistryProtocol(Protocol):
    """Seam for inspecting local on-premise model weights and compatibility."""

    def inspect_all(self) -> ModelCatalogSnapshot: ...

    def inspect_model(self, key: str) -> ModelSpecReport: ...


@dataclass(frozen=True)
class _ModelDefinition:
    key: str
    display_name: str
    repo_id: str
    stage: str
    stage_code: str
    role: str
    wiring_status: Literal["ACTIVE", "STAGED"]
    settings_attr: str
    default_modalities: tuple[str, ...]
    min_transformers: tuple[int, int] | None = None


_MODEL_CATALOG: tuple[_ModelDefinition, ...] = (
    _ModelDefinition(
        key="phowhisper-medium",
        display_name="PhoWhisper-medium",
        repo_id="vinai/PhoWhisper-medium",
        stage="Stage 1 (Ingest)",
        stage_code="I4",
        role="Vietnamese Academic ASR ([MM:SS])",
        wiring_status="ACTIVE",
        settings_attr="MODEL_PATH_PHOWHISPER",
        default_modalities=("audio",),
    ),
    _ModelDefinition(
        key="bge-m3",
        display_name="BGE-M3",
        repo_id="BAAI/bge-m3",
        stage="Stage 2 & Online RAG",
        stage_code="I6 / Q2",
        role="Dual Dense halfvec(1024) + Sparse Lexical Embedder",
        wiring_status="ACTIVE",
        settings_attr="MODEL_PATH_BGE_M3",
        default_modalities=("text",),
    ),
    _ModelDefinition(
        key="bge-reranker-v2-m3",
        display_name="BGE-Reranker-v2-m3",
        repo_id="BAAI/bge-reranker-v2-m3",
        stage="Online RAG",
        stage_code="Q4",
        role="Cross-Encoder Precision Reranker",
        wiring_status="ACTIVE",
        settings_attr="MODEL_PATH_RERANKER",
        default_modalities=("text",),
    ),
    _ModelDefinition(
        key="gemma-4-e2b",
        display_name="Gemma 4 E2B IT QAT",
        repo_id="google/gemma-4-E2B-it-qat-mobile-transformers",
        stage="Online 2-Pass Pre-RAG",
        stage_code="Q1 / Q5 / Q6+",
        role="Query Prep & Grounded Multimodal Synthesis LLM",
        wiring_status="ACTIVE",
        settings_attr="MODEL_PATH_GEMMA",
        default_modalities=("text",),
        min_transformers=(5, 22),
    ),
)


def _installed_transformers_version() -> str | None:
    try:
        return importlib.metadata.version("transformers")
    except importlib.metadata.PackageNotFoundError:
        return None


def _parse_major_minor(version_str: str | None) -> tuple[int, int] | None:
    if not version_str:
        return None
    match = re.match(r"^\s*(\d+)\.(\d+)", version_str)
    if not match:
        return None
    return (int(match.group(1)), int(match.group(2)))


def _measure_disk_bytes(model_dir: Path) -> int:
    if not model_dir.is_dir():
        return 0
    total = 0
    for item in model_dir.rglob("*"):
        if item.is_file() and ".cache" not in item.parts:
            try:
                total += item.stat().st_size
            except OSError:
                continue
    return total


def _find_primary_weight_file(model_dir: Path) -> str | None:
    if not model_dir.is_dir():
        return None
    for candidate in _WEIGHT_FILENAMES:
        if (model_dir / candidate).is_file():
            return candidate
    for shard in sorted(model_dir.glob("*.safetensors")):
        if shard.is_file():
            return shard.name
    for shard in sorted(model_dir.glob("*.bin")):
        if shard.is_file():
            return shard.name
    return None


def _read_config_json(model_dir: Path) -> dict:
    cfg_path = model_dir / "config.json"
    if not cfg_path.is_file():
        return {}
    try:
        return json.loads(cfg_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Failed to parse config.json at %s: %s", cfg_path, exc)
        return {}


def _format_context_label(cfg: dict) -> str | None:
    text_cfg = cfg.get("text_config") if isinstance(cfg.get("text_config"), dict) else cfg
    max_pos = text_cfg.get("max_position_embeddings")
    if isinstance(max_pos, int) and max_pos > 0:
        if max_pos == 131072:
            return "131,072 tokens (128K)"
        if max_pos == 8194:
            return "8,192 tokens (XLMR)"
        return f"{max_pos:,} tokens"
    max_src = cfg.get("max_source_positions")
    if isinstance(max_src, int) and max_src > 0:
        return "30s audio window (1500 frames)"
    return None


def _extract_quantization_summary(cfg: dict) -> str | None:
    qcfg = cfg.get("quantization_config")
    if isinstance(qcfg, dict):
        method = qcfg.get("quant_method", "quantized")
        mod_cfgs = qcfg.get("module_quant_configs") or {}
        bits = sorted(
            {
                int(entry["num_bits"])
                for entry in mod_cfgs.values()
                if isinstance(entry, dict) and "num_bits" in entry
            }
        )
        if method == "gemma" and bits:
            bit_str = "/".join(str(b) for b in bits)
            return f"QAT Mobile wNa8o8 ({bit_str}-bit mixed, quant_method=gemma)"
        default_bits = qcfg.get("num_bits")
        if default_bits:
            return f"{method} ({default_bits}-bit)"
        return str(method)
    torch_dtype = cfg.get("torch_dtype")
    if isinstance(torch_dtype, str):
        return f"{torch_dtype} weights"
    return None


def _extract_modalities(defn: _ModelDefinition, cfg: dict) -> list[str]:
    if defn.key == "gemma-4-e2b" and cfg:
        mods = ["text"]
        if isinstance(cfg.get("vision_config"), dict):
            mods.append("image")
        if isinstance(cfg.get("audio_config"), dict):
            mods.append("audio")
        return mods
    return list(defn.default_modalities)


class LocalModelRegistry:
    """
    Concrete adapter of ModelRegistryProtocol backed by local filesystem inspection.
    Reads only metadata and file sizes; never initializes PyTorch tensors or downloads weights.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or Settings()

    def _inspect_definition(
        self,
        defn: _ModelDefinition,
        tf_version: str | None,
    ) -> ModelSpecReport:
        model_dir = Path(getattr(self._settings, defn.settings_attr))
        exists_on_disk = model_dir.is_dir()
        primary_weight = _find_primary_weight_file(model_dir)
        cfg = _read_config_json(model_dir) if exists_on_disk else {}
        disk_bytes = _measure_disk_bytes(model_dir) if exists_on_disk else 0

        extra_artifacts: dict[str, bool] = {}
        notes: list[str] = []

        if defn.key == "bge-m3":
            sparse_ok = (model_dir / "sparse_linear.pt").is_file()
            colbert_ok = (model_dir / "colbert_linear.pt").is_file()
            onnx_ok = (model_dir / "onnx").is_dir()
            extra_artifacts = {
                "sparse_linear.pt": sparse_ok,
                "colbert_linear.pt": colbert_ok,
                "onnx": onnx_ok,
            }
            weights_ready = bool(primary_weight and sparse_ok)
            if exists_on_disk and not sparse_ok:
                notes.append("Missing sparse_linear.pt required for [I6] lexical_weights.")
            if onnx_ok:
                notes.append("Includes optional onnx/ export (~2.13 GiB); PyTorch runtime uses pytorch_model.bin.")
        else:
            weights_ready = bool(primary_weight)

        architectures = cfg.get("architectures")
        architecture = (
            str(architectures[0])
            if isinstance(architectures, list) and architectures
            else ("Gemma4ForConditionalGeneration (E2B)" if cfg.get("model_type") == "gemma4" else None)
        )

        tf_tuple = _parse_major_minor(tf_version)
        required_tf: str | None = None
        runtime_compatible = True
        if defn.min_transformers is not None:
            req_major, req_minor = defn.min_transformers
            required_tf = f">={req_major}.{req_minor}.0"
            runtime_compatible = tf_tuple is not None and tf_tuple >= defn.min_transformers
            if not runtime_compatible:
                notes.append(f"Requires transformers {required_tf} (detected: {tf_version or 'not installed'}).")

        if defn.key == "gemma-4-e2b":
            notes.append("Supports TransformersGemmaClient (QAT INT2/4/8) and optional Ollama gemma4:e2b.")

        return ModelSpecReport(
            key=defn.key,
            display_name=defn.display_name,
            repo_id=defn.repo_id,
            stage=defn.stage,
            stage_code=defn.stage_code,
            role=defn.role,
            wiring_status=defn.wiring_status,
            local_path=str(model_dir),
            exists_on_disk=exists_on_disk,
            weights_ready=weights_ready,
            disk_size_mb=round(disk_bytes / (1024**2), 2),
            disk_size_gb=round(disk_bytes / (1024**3), 2),
            primary_weight_file=primary_weight,
            architecture=architecture,
            model_type=cfg.get("model_type"),
            quantization=_extract_quantization_summary(cfg),
            max_context=_format_context_label(cfg),
            modalities=_extract_modalities(defn, cfg),
            required_transformers=required_tf,
            runtime_compatible=runtime_compatible,
            extra_artifacts=extra_artifacts,
            notes=notes,
        )

    def inspect_model(self, key: str) -> ModelSpecReport:
        tf_version = _installed_transformers_version()
        for defn in _MODEL_CATALOG:
            if defn.key == key:
                return self._inspect_definition(defn, tf_version)
        raise KeyError(f"Unknown model key '{key}'.")

    def inspect_all(self) -> ModelCatalogSnapshot:
        tf_version = _installed_transformers_version()
        reports = [self._inspect_definition(defn, tf_version) for defn in _MODEL_CATALOG]
        total_mb = round(sum(r.disk_size_mb for r in reports), 2)
        total_gb = round(sum(r.disk_size_gb for r in reports), 2)
        py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"

        return ModelCatalogSnapshot(
            models=reports,
            total_disk_mb=total_mb,
            total_disk_gb=total_gb,
            active_count=sum(1 for r in reports if r.wiring_status == "ACTIVE"),
            staged_count=sum(1 for r in reports if r.wiring_status == "STAGED"),
            ready_on_disk_count=sum(1 for r in reports if r.weights_ready),
            transformers_version=tf_version,
            python_version=py_ver,
        )
