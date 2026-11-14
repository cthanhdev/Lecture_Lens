"""
Tests for Embedder Deep Module (`ai_service.core.embedder`).
Covers EmbedderProtocol contract, FakeEmbedder deterministic fast adapter,
and BgeM3Embedder integration with local BGE-M3 + sparse_linear.pt weights.
"""
import math
from pathlib import Path
import time

import numpy as np
import pytest
import torch

from ai_service.core.embedder import (
    BgeM3Embedder,
    EmbedderProtocol,
    EmbeddingResult,
    FakeEmbedder,
)

MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "bge-m3"


def _l2_norm(vec: list[float]) -> float:
    return math.sqrt(sum(x * x for x in vec))


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    va = np.asarray(a, dtype=np.float64)
    vb = np.asarray(b, dtype=np.float64)
    return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb)))


def test_fake_embedder_satisfies_protocol_and_produces_unit_1024_vectors():
    embedder: EmbedderProtocol = FakeEmbedder()

    start = time.perf_counter()
    results = embedder.encode_passages([
        "Không gian vector và ma trận chuyển cơ sở.",
        "Cấu hình máy chủ DNS trên Windows Server 2016.",
    ])
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    assert elapsed_ms < 50.0
    assert len(results) == 2
    for res in results:
        assert isinstance(res, EmbeddingResult)
        assert len(res.dense_halfvec) == 1024
        assert _l2_norm(res.dense_halfvec) == pytest.approx(1.0, abs=1e-6)
        assert all(math.isfinite(x) for x in res.dense_halfvec)
        assert res.token_count > 0


def test_fake_embedder_is_deterministic_across_calls_and_instances():
    text = "Thuật toán khử Gauss-Jordan giải hệ phương trình tuyến tính."
    other_text = "Giao thức định tuyến OSPF trong mạng máy tính."

    first = FakeEmbedder().encode_query(text)
    second = FakeEmbedder().encode_query(text)
    other = FakeEmbedder().encode_query(other_text)

    assert first.dense_halfvec == second.dense_halfvec
    assert first.lexical_weights == second.lexical_weights
    assert first.token_count == second.token_count
    assert first.dense_halfvec != other.dense_halfvec


def test_fake_embedder_handles_empty_list_and_empty_text():
    embedder = FakeEmbedder()

    assert embedder.encode_passages([]) == []

    empty_res = embedder.encode_query("   ")
    assert len(empty_res.dense_halfvec) == 1024
    assert _l2_norm(empty_res.dense_halfvec) == pytest.approx(1.0, abs=1e-6)
    assert empty_res.lexical_weights == {}
    assert empty_res.token_count == 0


def test_fake_embedder_lexical_weights_are_normalized_and_sorted():
    embedder = FakeEmbedder()
    # "vector" appears twice out of 4 tokens -> 0.5; "không" and "gian" appear once -> 0.25
    res = embedder.encode_query("vector không gian vector!")

    assert res.token_count == 4
    assert res.lexical_weights == {
        "vector": 0.5,
        "gian": 0.25,
        "không": 0.25,
    }
    assert list(res.lexical_weights.values()) == sorted(
        res.lexical_weights.values(), reverse=True
    )


def test_fake_embedder_encode_query_and_unload_noop():
    embedder = FakeEmbedder()
    text = "Cơ sở trực chuẩn trong không gian Euclid."

    query_res = embedder.encode_query(text)
    passage_res = embedder.encode_passages([text])[0]

    assert query_res == passage_res
    embedder.unload()
    # Remains usable after unload no-op
    assert embedder.encode_query(text) == query_res


def test_fake_embedder_rejects_non_positive_batch_size():
    embedder = FakeEmbedder()
    with pytest.raises(ValueError, match="batch_size"):
        embedder.encode_passages(["hello"], batch_size=0)


# ---------------------------------------------------------------------------
# BgeM3Embedder Contract & Real Local Weights Integration Tests
# ---------------------------------------------------------------------------


def test_bge_m3_lazy_loads_and_skips_loading_on_empty_passages():
    embedder: EmbedderProtocol = BgeM3Embedder(
        model_path=MODEL_PATH,
        device="cuda",
        max_length=512,
        top_k_lexical=64,
        min_lexical_weight=0.01,
    )

    assert isinstance(embedder, EmbedderProtocol)
    assert isinstance(FakeEmbedder(), EmbedderProtocol)
    assert embedder._model is None
    assert embedder._tokenizer is None
    assert embedder._sparse_linear is None
    assert embedder.encode_passages([]) == []
    assert embedder._model is None

    with pytest.raises(ValueError, match="batch_size"):
        embedder.encode_passages(["hello"], batch_size=0)


def test_bge_m3_missing_model_path_raises_file_not_found(tmp_path: Path):
    embedder = BgeM3Embedder(model_path=tmp_path / "does-not-exist", device="cpu")
    with pytest.raises(FileNotFoundError):
        embedder.encode_query("Kiểm thử đường dẫn thiếu.")


def test_bge_m3_missing_sparse_linear_raises_file_not_found(tmp_path: Path):
    model_dir = tmp_path / "partial-bge-m3"
    model_dir.mkdir()
    embedder = BgeM3Embedder(model_path=model_dir, device="cpu")
    with pytest.raises(FileNotFoundError, match="sparse_linear.pt"):
        embedder.encode_query("Thiếu sparse_linear.pt")


@pytest.fixture(scope="module")
def real_bge_m3() -> BgeM3Embedder:
    if not MODEL_PATH.exists():
        pytest.skip(f"Local BGE-M3 model weights not found at {MODEL_PATH}")
    embedder = BgeM3Embedder(
        model_path=MODEL_PATH,
        device="cuda",  # Verifies clean fallback to CPU when CUDA is unavailable
        max_length=512,
        top_k_lexical=64,
        min_lexical_weight=0.01,
    )
    yield embedder
    embedder.unload()


def test_bge_m3_dense_halfvec_norm_and_fp16_precision(real_bge_m3: BgeM3Embedder):
    res = real_bge_m3.encode_query(
        "Không gian vector và phép biến đổi tuyến tính trong đại số đại học."
    )

    expected_device = "cuda" if torch.cuda.is_available() else "cpu"
    assert real_bge_m3.device == expected_device
    assert len(res.dense_halfvec) == 1024
    # FP16 quantization introduces ~1e-4 rounding error across 1024 dimensions
    assert _l2_norm(res.dense_halfvec) == pytest.approx(1.0, abs=5e-3)
    assert all(
        math.isfinite(x) and abs(x) <= 65504.0 and float(np.float16(x)) == x
        for x in res.dense_halfvec
    )
    assert 0 < res.token_count <= 512


def test_bge_m3_vietnamese_semantic_similarity(real_bge_m3: BgeM3Embedder):
    query = real_bge_m3.encode_query(
        "Thế nào là một hệ vector độc lập tuyến tính?"
    )
    passages = real_bge_m3.encode_passages(
        [
            "Một tập hợp các vector được gọi là độc lập tuyến tính nếu tổ hợp tuyến tính bằng không chỉ có nghiệm tầm thường.",
            "Hướng dẫn cấu hình máy chủ DNS và cấp phát địa chỉ IP động bằng DHCP trên Windows Server 2016.",
        ],
        batch_size=2,
    )

    assert len(passages) == 2
    sim_same_topic = _cosine_similarity(query.dense_halfvec, passages[0].dense_halfvec)
    sim_unrelated = _cosine_similarity(query.dense_halfvec, passages[1].dense_halfvec)
    assert sim_same_topic > sim_unrelated + 0.1


def test_bge_m3_vietnamese_lexical_weights_clean_and_bounded(real_bge_m3: BgeM3Embedder):
    text = (
        "Bài giảng về Active Directory, Domain Controller, và thuật toán "
        "khử Gauss-Jordan trong quản trị mạng và toán học."
    )
    res = real_bge_m3.encode_query(text)

    assert len(res.lexical_weights) > 0
    assert len(res.lexical_weights) <= 64
    for special in ("<s>", "</s>", "<pad>", "<unk>", "<mask>"):
        assert special not in res.lexical_weights

    # Meaningful Vietnamese and technical tokens should appear
    keys_lower = {k.lower() for k in res.lexical_weights}
    expected_present = {"active", "directory", "domain", "controller", "mạng", "toán"}
    assert len(expected_present & keys_lower) >= 3

    # All weights positive, >= min_lexical_weight, rounded to <= 4 decimals, sorted descending
    weights = list(res.lexical_weights.values())
    assert weights == sorted(weights, reverse=True)
    for token, weight in res.lexical_weights.items():
        assert token == token.strip()
        assert not token.startswith("\u2581")
        assert any(ch.isalnum() for ch in token)
        assert weight >= 0.01
        assert round(weight, 4) == weight


def test_bge_m3_batch_processing_and_truncation(real_bge_m3: BgeM3Embedder):
    long_text = " ".join(["Không gian vector và ma trận nghịch đảo."] * 140)
    short_text = "Giao thức TCP và UDP."

    batched = real_bge_m3.encode_passages([long_text, short_text, ""], batch_size=2)
    single_short = real_bge_m3.encode_query(short_text)

    assert len(batched) == 3
    # Long text (>1000 tokens) must be truncated to <= max_length (512 total incl. <s>/</s>)
    assert batched[0].token_count <= 510
    assert len(batched[0].dense_halfvec) == 1024

    # Mini-batching with padding should match unpadded single encoding closely
    assert _cosine_similarity(batched[1].dense_halfvec, single_short.dense_halfvec) > 0.999

    # Empty string has 0 non-special tokens and no lexical weights
    assert batched[2].token_count == 0
    assert batched[2].lexical_weights == {}
    assert len(batched[2].dense_halfvec) == 1024


def test_bge_m3_unload_releases_resources_and_reloads_lazily(real_bge_m3: BgeM3Embedder):
    # Ensure model is loaded first
    before = real_bge_m3.encode_query("Kiểm tra giải phóng bộ nhớ GPU VRAM.")
    assert real_bge_m3._model is not None

    real_bge_m3.unload()
    assert real_bge_m3._model is None
    assert real_bge_m3._tokenizer is None
    assert real_bge_m3._sparse_linear is None

    # Idempotent second unload must not fail
    real_bge_m3.unload()

    # Subsequent call lazily reloads and produces matching deterministic result
    after = real_bge_m3.encode_query("Kiểm tra giải phóng bộ nhớ GPU VRAM.")
    assert real_bge_m3._model is not None
    assert _cosine_similarity(before.dense_halfvec, after.dense_halfvec) > 0.9999

