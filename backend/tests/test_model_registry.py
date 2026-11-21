"""
Tests for LocalModelRegistry Deep Module (model_registry.py).
Verifies disk inspection, config.json metadata extraction, runtime version checks,
missing-weight resilience, and real backend/models alignment through ModelRegistryProtocol.
"""
import json
from pathlib import Path

import pytest

from ai_service.config import Settings
from ai_service.core.model_registry import (
    LocalModelRegistry,
    ModelCatalogSnapshot,
    ModelRegistryProtocol,
    ModelSpecReport,
)


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def _write_dummy_models(base_dir: Path, include_sparse: bool = True) -> dict[str, Path]:
    paths = {
        "phowhisper-medium": base_dir / "phowhisper-medium",
        "bge-m3": base_dir / "bge-m3",
        "bge-reranker-v2-m3": base_dir / "bge-reranker-v2-m3",
        "gemma-4-e2b": base_dir / "gemma-4-e2b",
    }

    _write_json(
        paths["phowhisper-medium"] / "config.json",
        {
            "architectures": ["WhisperForConditionalGeneration"],
            "model_type": "whisper",
            "d_model": 1024,
            "encoder_layers": 24,
            "decoder_layers": 24,
            "max_source_positions": 1500,
            "vocab_size": 51865,
            "transformers_version": "4.31.0",
        },
    )
    (paths["phowhisper-medium"] / "pytorch_model.bin").write_bytes(b"w" * 2048)

    _write_json(
        paths["bge-m3"] / "config.json",
        {
            "architectures": ["XLMRobertaModel"],
            "model_type": "xlm-roberta",
            "hidden_size": 1024,
            "num_hidden_layers": 24,
            "max_position_embeddings": 8194,
            "vocab_size": 250002,
            "transformers_version": "4.33.0",
        },
    )
    (paths["bge-m3"] / "pytorch_model.bin").write_bytes(b"b" * 2048)
    if include_sparse:
        (paths["bge-m3"] / "sparse_linear.pt").write_bytes(b"s" * 64)
    (paths["bge-m3"] / "colbert_linear.pt").write_bytes(b"c" * 64)
    onnx_dir = paths["bge-m3"] / "onnx"
    onnx_dir.mkdir(parents=True, exist_ok=True)
    (onnx_dir / "model.onnx_data").write_bytes(b"o" * 1024)
    # .cache must be excluded from size totals
    cache_dir = paths["bge-m3"] / ".cache" / "huggingface"
    cache_dir.mkdir(parents=True, exist_ok=True)
    (cache_dir / "temp.bin").write_bytes(b"x" * 1048576)

    _write_json(
        paths["bge-reranker-v2-m3"] / "config.json",
        {
            "architectures": ["XLMRobertaForSequenceClassification"],
            "model_type": "xlm-roberta",
            "hidden_size": 1024,
            "num_hidden_layers": 24,
            "max_position_embeddings": 8194,
            "transformers_version": "4.38.1",
        },
    )
    (paths["bge-reranker-v2-m3"] / "model.safetensors").write_bytes(b"r" * 2048)

    _write_json(
        paths["gemma-4-e2b"] / "config.json",
        {
            "model_type": "gemma4",
            "transformers_version": "5.10.0.dev0",
            "quantization_config": {
                "quant_method": "gemma",
                "num_bits": 4,
                "module_quant_configs": {
                    "^lm_head$": {"num_bits": 2},
                    "language_model\\.layers\\.\\d+\\.self_attn\\.": {"num_bits": 4},
                    "vision_tower": {"num_bits": 8},
                },
            },
            "text_config": {
                "hidden_size": 1536,
                "num_hidden_layers": 35,
                "max_position_embeddings": 131072,
                "vocab_size": 262144,
            },
            "vision_config": {"num_hidden_layers": 16},
            "audio_config": {"num_hidden_layers": 12},
        },
    )
    (paths["gemma-4-e2b"] / "model.safetensors").write_bytes(b"g" * 4096)

    return paths


def test_local_model_registry_inspects_all_four_models(tmp_path: Path):
    paths = _write_dummy_models(tmp_path)
    settings = Settings(
        MODEL_PATH_PHOWHISPER=paths["phowhisper-medium"],
        MODEL_PATH_BGE_M3=paths["bge-m3"],
        MODEL_PATH_RERANKER=paths["bge-reranker-v2-m3"],
        MODEL_PATH_GEMMA=paths["gemma-4-e2b"],
    )
    registry: ModelRegistryProtocol = LocalModelRegistry(settings=settings)
    snapshot = registry.inspect_all()

    assert isinstance(snapshot, ModelCatalogSnapshot)
    assert len(snapshot.models) == 4
    assert snapshot.active_count == 4
    assert snapshot.staged_count == 0
    assert snapshot.ready_on_disk_count == 4
    # .cache temp.bin (1 MB) must be excluded from total disk footprint
    assert snapshot.total_disk_mb < 0.1

    by_key = {m.key: m for m in snapshot.models}
    assert by_key["phowhisper-medium"].wiring_status == "ACTIVE"
    assert by_key["phowhisper-medium"].primary_weight_file == "pytorch_model.bin"
    assert by_key["phowhisper-medium"].architecture == "WhisperForConditionalGeneration"

    bge = by_key["bge-m3"]
    assert bge.wiring_status == "ACTIVE"
    assert bge.weights_ready is True
    assert bge.extra_artifacts["sparse_linear.pt"] is True
    assert bge.extra_artifacts["colbert_linear.pt"] is True
    assert bge.extra_artifacts["onnx"] is True

    reranker = by_key["bge-reranker-v2-m3"]
    assert reranker.wiring_status == "ACTIVE"
    assert reranker.stage_code == "Q4"
    assert reranker.primary_weight_file == "model.safetensors"
    assert reranker.architecture == "XLMRobertaForSequenceClassification"

    gemma = by_key["gemma-4-e2b"]
    assert gemma.wiring_status == "ACTIVE"
    assert gemma.stage_code == "Q1 / Q5 / Q6+"
    assert gemma.model_type == "gemma4"
    assert "QAT Mobile" in (gemma.quantization or "")
    assert "128K" in (gemma.max_context or "")
    assert set(gemma.modalities) == {"text", "image", "audio"}
    assert gemma.required_transformers == ">=5.22.0"


def test_local_model_registry_handles_missing_dirs_and_missing_sparse_linear(tmp_path: Path):
    paths = _write_dummy_models(tmp_path, include_sparse=False)
    settings = Settings(
        MODEL_PATH_PHOWHISPER=tmp_path / "missing-phowhisper",
        MODEL_PATH_BGE_M3=paths["bge-m3"],
        MODEL_PATH_RERANKER=tmp_path / "missing-reranker",
        MODEL_PATH_GEMMA=paths["gemma-4-e2b"],
    )
    registry = LocalModelRegistry(settings=settings)
    snapshot = registry.inspect_all()

    by_key = {m.key: m for m in snapshot.models}
    assert by_key["phowhisper-medium"].exists_on_disk is False
    assert by_key["phowhisper-medium"].weights_ready is False
    assert by_key["bge-m3"].exists_on_disk is True
    assert by_key["bge-m3"].weights_ready is False
    assert by_key["bge-m3"].extra_artifacts["sparse_linear.pt"] is False
    assert snapshot.ready_on_disk_count == 1  # only gemma-4-e2b is ready

    with pytest.raises(KeyError):
        registry.inspect_model("unknown-model")


def test_local_model_registry_matches_real_workspace_models():
    models_root = Path("backend/models")
    if not models_root.is_dir():
        pytest.skip("backend/models directory not present in environment")

    settings = Settings()
    registry = LocalModelRegistry(settings=settings)
    snapshot = registry.inspect_all()

    assert len(snapshot.models) == 4
    by_key = {m.key: m for m in snapshot.models}
    for expected_key in ("phowhisper-medium", "bge-m3", "bge-reranker-v2-m3", "gemma-4-e2b"):
        report: ModelSpecReport = by_key[expected_key]
        assert report.exists_on_disk is True
        assert report.weights_ready is True
        assert report.disk_size_gb > 1.0

    assert snapshot.total_disk_gb >= 10.0
    assert by_key["bge-m3"].extra_artifacts["sparse_linear.pt"] is True
    assert by_key["gemma-4-e2b"].runtime_compatible is True
