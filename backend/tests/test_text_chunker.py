"""
Tests for [I5] Recursive Chunking Deep Module (text_chunker.py).
Tests public seams: TokenizerProtocol adapters and TextChunkerProtocol.chunk_transcript.
"""
from pathlib import Path
from uuid import uuid4

import pytest

from ai_service.core.schemas import (
    TranscriptAudioMeta,
    TranscriptGeneratedMeta,
    TranscriptSchema,
    TranscriptSegment,
)
from ai_service.core.text_chunker import (
    BgeM3TokenizerAdapter,
    ChunkDraft,
    RecursiveTokenChunker,
    TextChunkerProtocol,
    TokenizerProtocol,
    WhitespaceApproxTokenizer,
)


def _make_transcript(segments: list[TranscriptSegment]) -> TranscriptSchema:
    full_text = " ".join(seg.text for seg in segments if seg.text.strip())
    duration = segments[-1].end_time_seconds if segments else 0.0
    return TranscriptSchema(
        job_id=uuid4(),
        lecture_id=uuid4(),
        generated=TranscriptGeneratedMeta(model="phowhisper-base", language="vi", device="cpu"),
        audio=TranscriptAudioMeta(duration_seconds=max(0.0, duration), sample_rate_hz=16000),
        full_text=full_text,
        segments=segments,
    )


def test_whitespace_approx_tokenizer_is_deterministic_and_reversible():
    tok: TokenizerProtocol = WhitespaceApproxTokenizer()
    text = "Hôm nay chúng ta học Đại số tuyến tính"

    ids_first = tok.encode(text)
    ids_second = tok.encode(text)

    assert ids_first == ids_second
    assert len(ids_first) == 9
    assert tok.count_tokens(text) == 9
    assert tok.decode(ids_first) == text
    assert tok.encode("") == []
    assert tok.count_tokens("   ") == 0
    assert tok.decode([]) == ""


def test_chunk_transcript_empty_segments_returns_empty_list():
    chunker: TextChunkerProtocol = RecursiveTokenChunker(tokenizer=WhitespaceApproxTokenizer())
    transcript = _make_transcript([])

    chunks = chunker.chunk_transcript(transcript)

    assert chunks == []


def test_chunk_transcript_single_short_segment_produces_single_chunk_draft():
    tok = WhitespaceApproxTokenizer()
    chunker = RecursiveTokenChunker(tokenizer=tok, max_tokens=512, overlap_tokens=64, reserve_special_tokens=2)
    seg = TranscriptSegment(
        id=0,
        start_time_seconds=5.25,
        end_time_seconds=65.5,
        timestamp_label="00:05",
        text="Không gian vector là khái niệm nền tảng của đại số tuyến tính.",
    )
    transcript = _make_transcript([seg])

    chunks = chunker.chunk_transcript(transcript)

    assert len(chunks) == 1
    chunk = chunks[0]
    assert isinstance(chunk, ChunkDraft)
    assert chunk.lecture_id == transcript.lecture_id
    assert chunk.chunk_index == 0
    assert chunk.start_time_seconds == pytest.approx(5.25)
    assert chunk.end_time_seconds == pytest.approx(65.5)
    assert chunk.start_timestamp_display == "00:05"
    assert chunk.end_timestamp_display == "01:05"
    assert chunk.speaker_label == "LECTURER"
    assert chunk.content == seg.text
    assert chunk.token_count == 13
    assert chunk.prev_chunk_id is None
    assert chunk.next_chunk_id is None
    assert chunk.metadata["segment_ids"] == [0]


def _word_block(prefix: str, count: int) -> str:
    return " ".join(f"{prefix}{i}" for i in range(count))


def test_multi_segment_merging_under_512_tokens():
    tok = WhitespaceApproxTokenizer()
    chunker = RecursiveTokenChunker(tokenizer=tok, max_tokens=512, overlap_tokens=64, reserve_special_tokens=2)

    segments = [
        TranscriptSegment(
            id=0,
            start_time_seconds=0.0,
            end_time_seconds=12.0,
            timestamp_label="00:00",
            text=_word_block("seg0_", 150),
        ),
        TranscriptSegment(
            id=1,
            start_time_seconds=12.0,
            end_time_seconds=25.0,
            timestamp_label="00:12",
            text=_word_block("seg1_", 150),
        ),
        TranscriptSegment(
            id=2,
            start_time_seconds=25.0,
            end_time_seconds=40.0,
            timestamp_label="00:25",
            text=_word_block("seg2_", 180),
        ),
    ]
    transcript = _make_transcript(segments)

    chunks = chunker.chunk_transcript(transcript)

    assert len(chunks) == 1
    assert chunks[0].token_count == 480
    assert chunks[0].token_count <= 510
    assert chunks[0].start_time_seconds == pytest.approx(0.0)
    assert chunks[0].end_time_seconds == pytest.approx(40.0)
    assert chunks[0].metadata["segment_ids"] == [0, 1, 2]
    assert chunks[0].prev_chunk_id is None
    assert chunks[0].next_chunk_id is None


def test_sliding_window_retains_trailing_subsegments_within_64_token_overlap():
    tok = WhitespaceApproxTokenizer()
    chunker = RecursiveTokenChunker(tokenizer=tok, max_tokens=512, overlap_tokens=64, reserve_special_tokens=2)

    # Seg 0 (450 tokens) + Seg 1 (50 tokens) -> Chunk 0 = 500 tokens (<= 510)
    # Seg 2 (200 tokens) triggers new Chunk 1 seeded with trailing Seg 1 (50 tokens <= 64)
    segments = [
        TranscriptSegment(
            id=0,
            start_time_seconds=0.0,
            end_time_seconds=90.0,
            timestamp_label="00:00",
            text=_word_block("a", 450),
        ),
        TranscriptSegment(
            id=1,
            start_time_seconds=90.0,
            end_time_seconds=100.0,
            timestamp_label="01:30",
            text=_word_block("b", 50),
        ),
        TranscriptSegment(
            id=2,
            start_time_seconds=100.0,
            end_time_seconds=140.0,
            timestamp_label="01:40",
            text=_word_block("c", 200),
        ),
    ]
    transcript = _make_transcript(segments)

    chunks = chunker.chunk_transcript(transcript)

    assert len(chunks) == 2
    assert chunks[0].token_count == 500
    assert chunks[0].metadata["segment_ids"] == [0, 1]

    # Chunk 1 must carry Seg 1 (50 tokens) as overlap + Seg 2 (200 tokens) = 250 tokens
    assert chunks[1].token_count == 250
    assert chunks[1].content.startswith(_word_block("b", 50))
    assert chunks[1].content.endswith(_word_block("c", 200))
    assert chunks[1].start_time_seconds == pytest.approx(90.0)
    assert chunks[1].end_time_seconds == pytest.approx(140.0)
    assert chunks[1].metadata["segment_ids"] == [1, 2]

    # Doubly-linked list integrity
    assert chunks[0].chunk_index == 0
    assert chunks[1].chunk_index == 1
    assert chunks[0].prev_chunk_id is None
    assert chunks[0].next_chunk_id == chunks[1].id
    assert chunks[1].prev_chunk_id == chunks[0].id
    assert chunks[1].next_chunk_id is None


def test_sliding_window_trims_large_trailing_segment_to_64_token_overlap():
    tok = WhitespaceApproxTokenizer()
    chunker = RecursiveTokenChunker(tokenizer=tok, max_tokens=512, overlap_tokens=64, reserve_special_tokens=2)

    # Single large Seg 0 (400 tokens) and Seg 1 (300 tokens): 400 + 300 > 510
    # Chunk 0 = Seg 0 (400). Overlap from Seg 0 (>64) keeps trailing 64 tokens ("a336 ... a399").
    # Chunk 1 = trailing 64 tokens of Seg 0 + Seg 1 (300) = 364 tokens.
    segments = [
        TranscriptSegment(
            id=0,
            start_time_seconds=0.0,
            end_time_seconds=100.0,
            timestamp_label="00:00",
            text=_word_block("a", 400),
        ),
        TranscriptSegment(
            id=1,
            start_time_seconds=100.0,
            end_time_seconds=160.0,
            timestamp_label="01:40",
            text=_word_block("b", 300),
        ),
    ]
    transcript = _make_transcript(segments)

    chunks = chunker.chunk_transcript(transcript)

    assert len(chunks) == 2
    assert chunks[0].token_count == 400
    assert chunks[1].token_count == 364

    expected_overlap = " ".join(f"a{i}" for i in range(336, 400))
    assert chunks[1].content.startswith(expected_overlap)
    assert chunks[1].content.endswith(_word_block("b", 300))
    assert 0.0 < chunks[1].start_time_seconds < 100.0
    assert chunks[1].end_time_seconds == pytest.approx(160.0)


def test_overlap_exceeding_chunk_size_still_guarantees_forward_progress():
    tok = WhitespaceApproxTokenizer()
    # overlap_tokens (120) >= effective_max (98)
    chunker = RecursiveTokenChunker(tokenizer=tok, max_tokens=100, overlap_tokens=120, reserve_special_tokens=2)

    segments = [
        TranscriptSegment(
            id=i,
            start_time_seconds=float(i * 10),
            end_time_seconds=float((i + 1) * 10),
            timestamp_label=f"00:{i*10:02d}",
            text=_word_block(f"s{i}_", 40),
        )
        for i in range(4)
    ]
    transcript = _make_transcript(segments)

    chunks = chunker.chunk_transcript(transcript)

    assert len(chunks) >= 2
    for idx, chunk in enumerate(chunks):
        assert chunk.chunk_index == idx
        assert chunk.token_count <= 98
        assert chunk.end_time_seconds > chunk.start_time_seconds
    assert all("s3_39" in c.content for c in chunks[-1:])
    assert chunks[0].prev_chunk_id is None
    assert chunks[-1].next_chunk_id is None
    for i in range(len(chunks) - 1):
        assert chunks[i].next_chunk_id == chunks[i + 1].id
        assert chunks[i + 1].prev_chunk_id == chunks[i].id


def test_giant_single_segment_over_800_tokens_splits_with_interpolated_timestamps():
    tok = WhitespaceApproxTokenizer()
    # First test with overlap=0 to verify strict non-overlapping timestamp interpolation across split sub-segments
    no_overlap_chunker = RecursiveTokenChunker(
        tokenizer=tok, max_tokens=512, overlap_tokens=0, reserve_special_tokens=2
    )
    sentences = [
        f"Câu {i}: Không gian vector và ánh xạ tuyến tính là kiến thức cốt lõi của đại số tuyến tính ứng dụng."
        for i in range(45)
    ]  # 45 * 21 = 945 tokens
    giant_text = " ".join(sentences)
    assert tok.count_tokens(giant_text) > 800

    seg = TranscriptSegment(
        id=7,
        start_time_seconds=100.0,
        end_time_seconds=400.0,
        timestamp_label="01:40",
        text=giant_text,
    )
    transcript = _make_transcript([seg])

    non_overlapping_chunks = no_overlap_chunker.chunk_transcript(transcript)

    assert len(non_overlapping_chunks) == 2
    assert non_overlapping_chunks[0].start_time_seconds == pytest.approx(100.0)
    assert non_overlapping_chunks[-1].end_time_seconds == pytest.approx(400.0)
    for i, c in enumerate(non_overlapping_chunks):
        assert c.chunk_index == i
        assert c.token_count <= 510
        assert c.end_time_seconds > c.start_time_seconds
        assert c.metadata["segment_ids"] == [7]
        if i > 0:
            assert c.start_time_seconds == pytest.approx(non_overlapping_chunks[i - 1].end_time_seconds, abs=0.01)

    # Now with 64-token overlap: must also respect <=510 token cap, monotonic start/end, and overlap continuity
    overlap_chunker = RecursiveTokenChunker(
        tokenizer=tok, max_tokens=512, overlap_tokens=64, reserve_special_tokens=2
    )
    overlap_chunks = overlap_chunker.chunk_transcript(transcript)

    assert len(overlap_chunks) >= 2
    assert overlap_chunks[0].start_time_seconds == pytest.approx(100.0)
    assert overlap_chunks[-1].end_time_seconds == pytest.approx(400.0)
    for i, c in enumerate(overlap_chunks):
        assert c.token_count <= 510
        assert c.end_time_seconds > c.start_time_seconds
        assert c.metadata["segment_ids"] == [7]
        if i > 0:
            assert c.start_time_seconds > overlap_chunks[i - 1].start_time_seconds
            assert c.start_time_seconds < overlap_chunks[i - 1].end_time_seconds
            assert c.end_time_seconds > overlap_chunks[i - 1].end_time_seconds
            assert c.prev_chunk_id == overlap_chunks[i - 1].id
            assert overlap_chunks[i - 1].next_chunk_id == c.id

    # Last sentence must appear in the final chunk
    assert "Câu 44:" in overlap_chunks[-1].content


def test_giant_segment_without_sentence_punctuation_splits_by_space_and_token_windows():
    # 1) Space-only run-on segment (>850 tokens)
    tok = WhitespaceApproxTokenizer()
    chunker = RecursiveTokenChunker(tokenizer=tok, max_tokens=512, overlap_tokens=64, reserve_special_tokens=2)
    run_on_text = _word_block("tu", 860)
    seg = TranscriptSegment(
        id=0,
        start_time_seconds=0.0,
        end_time_seconds=200.0,
        timestamp_label="00:00",
        text=run_on_text,
    )

    chunks = chunker.chunk_transcript(_make_transcript([seg]))

    assert len(chunks) >= 2
    for c in chunks:
        assert c.token_count <= 510
        assert c.end_time_seconds > c.start_time_seconds
    assert "tu859" in chunks[-1].content

    # 2) Unbroken character sequence (no separators at all) with a character-level TokenizerProtocol
    class CharTokenizer:
        def encode(self, text: str) -> list[int]:
            return [ord(ch) for ch in text]

        def count_tokens(self, text: str) -> int:
            return len(text)

        def decode(self, token_ids: list[int]) -> str:
            return "".join(chr(tid) for tid in token_ids)

    char_chunker = RecursiveTokenChunker(
        tokenizer=CharTokenizer(), max_tokens=100, overlap_tokens=16, reserve_special_tokens=2
    )
    unbroken_seg = TranscriptSegment(
        id=0,
        start_time_seconds=0.0,
        end_time_seconds=50.0,
        timestamp_label="00:00",
        text="A" * 250,
    )
    char_chunks = char_chunker.chunk_transcript(_make_transcript([unbroken_seg]))

    assert len(char_chunks) >= 3
    for i, c in enumerate(char_chunks):
        assert c.token_count <= 98
        assert c.end_time_seconds > c.start_time_seconds
        if i > 0:
            assert c.start_time_seconds >= char_chunks[i - 1].start_time_seconds
            assert c.prev_chunk_id == char_chunks[i - 1].id


def test_constructor_validation_and_edge_cases():
    tok = WhitespaceApproxTokenizer()
    with pytest.raises(ValueError):
        RecursiveTokenChunker(tokenizer=tok, max_tokens=2, reserve_special_tokens=2)
    with pytest.raises(ValueError):
        RecursiveTokenChunker(tokenizer=tok, max_tokens=512, overlap_tokens=-1)

    # Whitespace-only segments are skipped; multi-hour timestamp uses HH:MM:SS
    chunker = RecursiveTokenChunker(tokenizer=tok, max_tokens=512, overlap_tokens=64, reserve_special_tokens=2)
    segments = [
        TranscriptSegment(id=0, start_time_seconds=0.0, end_time_seconds=5.0, timestamp_label="00:00", text="   \n  "),
        TranscriptSegment(
            id=1,
            start_time_seconds=3665.0,
            end_time_seconds=3725.0,
            timestamp_label="01:01:05",
            text="Phần cuối bài giảng về giá trị riêng và vector riêng.",
        ),
    ]
    chunks = chunker.chunk_transcript(_make_transcript(segments))
    assert len(chunks) == 1
    assert chunks[0].start_timestamp_display == "01:01:05"
    assert chunks[0].end_timestamp_display == "01:02:05"
    assert chunks[0].metadata["segment_ids"] == [1]

    # Large overlap seed shrinks gracefully to fit a large subsequent segment
    shrink_chunker = RecursiveTokenChunker(tokenizer=tok, max_tokens=512, overlap_tokens=64, reserve_special_tokens=2)
    tight_segments = [
        TranscriptSegment(id=0, start_time_seconds=0.0, end_time_seconds=50.0, timestamp_label="00:00", text=_word_block("p", 470)),
        TranscriptSegment(id=1, start_time_seconds=50.0, end_time_seconds=100.0, timestamp_label="00:50", text=_word_block("q", 490)),
    ]
    tight_chunks = shrink_chunker.chunk_transcript(_make_transcript(tight_segments))
    assert len(tight_chunks) == 2
    assert tight_chunks[0].token_count == 470
    assert tight_chunks[1].token_count <= 510
    assert "q489" in tight_chunks[1].content
    assert "p469" in tight_chunks[1].content


def test_bge_m3_tokenizer_adapter_real_vietnamese_lecture():
    from transformers import AutoTokenizer

    model_path = Path(__file__).resolve().parents[1] / "models" / "bge-m3"
    assert model_path.exists(), f"Expected BGE-M3 weights at {model_path}"

    # Verify lazy loading: missing path fails only on actual tokenization call
    missing_adapter = BgeM3TokenizerAdapter(model_path=model_path.parent / "nonexistent-bge-m3")
    with pytest.raises(FileNotFoundError):
        missing_adapter.count_tokens("test")

    adapter = BgeM3TokenizerAdapter(model_path=model_path)
    sample = "Hôm nay chúng ta tìm hiểu Active Directory và thuật toán tìm kiếm lai Reciprocal Rank Fusion."
    ids = adapter.encode(sample)
    assert len(ids) > 0
    assert adapter.count_tokens(sample) == len(ids)
    assert "Active Directory" in adapter.decode(ids)

    # Confirm payload budget leaves room for <s> and </s> inside 512 total sequence length
    hf_tok = AutoTokenizer.from_pretrained(str(model_path), use_fast=True, local_files_only=True)
    assert len(hf_tok.encode(sample, add_special_tokens=True)) == len(ids) + 2

    chunker = RecursiveTokenChunker(
        tokenizer=adapter,
        max_tokens=512,
        overlap_tokens=64,
        reserve_special_tokens=2,
    )

    # Build >1100 BGE-M3 tokens: several normal Vietnamese segments + one oversized >800-token segment
    normal_segments = [
        TranscriptSegment(
            id=i,
            start_time_seconds=float(i * 15),
            end_time_seconds=float((i + 1) * 15),
            timestamp_label=f"00:{i * 15:02d}" if i * 15 < 60 else f"{(i * 15)//60:02d}:{(i * 15)%60:02d}",
            text=(
                f"Đoạn {i}: Trong hệ quản trị Windows Server 2016, Domain Controller quản lý xác thực Kerberos, "
                "cấp phát tài nguyên trong Organizational Unit và thiết lập Group Policy cho toàn bộ sinh viên."
            ),
        )
        for i in range(8)
    ]
    giant_vi_segment = TranscriptSegment(
        id=8,
        start_time_seconds=120.0,
        end_time_seconds=360.0,
        timestamp_label="02:00",
        text=" ".join(
            f"Bài toán {j}: Cho ma trận vuông khả nghịch cấp n trên trường số thực, hãy chứng minh rằng "
            "tập hợp các vector cột tạo thành một cơ sở trực chuẩn sau quá trình trực giao hóa Gram-Schmidt."
            for j in range(30)
        ),
    )
    assert adapter.count_tokens(giant_vi_segment.text) > 800

    transcript = _make_transcript([*normal_segments, giant_vi_segment])
    chunks = chunker.chunk_transcript(transcript)

    assert len(chunks) >= 3
    for i, chunk in enumerate(chunks):
        assert chunk.chunk_index == i
        assert 0 < chunk.token_count <= 510
        assert chunk.token_count == adapter.count_tokens(chunk.content)
        # Verify total length WITH special tokens (<s>, </s>) strictly <= 512
        total_with_special = len(hf_tok.encode(chunk.content, add_special_tokens=True))
        assert total_with_special <= 512
        assert chunk.end_time_seconds > chunk.start_time_seconds
        assert len(chunk.metadata["segment_ids"]) >= 1
        if i == 0:
            assert chunk.prev_chunk_id is None
        else:
            assert chunk.prev_chunk_id == chunks[i - 1].id
            assert chunks[i - 1].next_chunk_id == chunk.id
    assert chunks[-1].next_chunk_id is None
    assert 8 in chunks[-1].metadata["segment_ids"]



