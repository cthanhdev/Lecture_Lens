"""
Golden Contract Test for Transcript Artifact (transcript.json).
Verifies that the generated transcript strictly satisfies all schema invariants
required by Phase 2 (BGE-M3 Chunking & Embedding).
"""
import json
import re
import uuid
from ai_service.core.schemas import (
    TranscriptAudioMeta,
    TranscriptGeneratedMeta,
    TranscriptSchema,
    TranscriptSegment,
)


def test_transcript_schema_golden_contract():
    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()

    transcript = TranscriptSchema(
        job_id=job_id,
        lecture_id=lecture_id,
        generated=TranscriptGeneratedMeta(
            model="phowhisper-base",
            language="vi",
            device="cuda:0",
            processing_seconds=45.2
        ),
        audio=TranscriptAudioMeta(
            duration_seconds=120.5,
            sample_rate_hz=16000
        ),
        full_text="Chào các em, hôm nay chúng ta học về không gian vector. Định nghĩa: một tập hợp các vector được gọi là cơ sở nếu...",
        segments=[
            TranscriptSegment(
                id=0,
                start_time_seconds=0.00,
                end_time_seconds=7.42,
                timestamp_label="00:00",
                text="Chào các em, hôm nay chúng ta học về không gian vector."
            ),
            TranscriptSegment(
                id=1,
                start_time_seconds=7.42,
                end_time_seconds=15.03,
                timestamp_label="00:07",
                text="Định nghĩa: một tập hợp các vector được gọi là cơ sở nếu..."
            )
        ]
    )

    # 1. Serialize to JSON string and parse back
    raw_json = transcript.model_dump_json(indent=2)
    data = json.loads(raw_json)

    # 2. Check top-level contract keys
    assert data["schema_version"] == 1
    assert data["job_id"] == str(job_id)
    assert data["lecture_id"] == str(lecture_id)
    assert "generated" in data
    assert "audio" in data
    assert "full_text" in data
    assert "segments" in data

    # 3. Check audio metadata
    assert data["audio"]["sample_rate_hz"] == 16000
    assert data["audio"]["duration_seconds"] > 0

    # 4. Check segments invariants
    segments = data["segments"]
    assert len(segments) == 2

    timestamp_regex = re.compile(r"^(\d{2}:)?\d{2}:\d{2}$")

    for i, seg in enumerate(segments):
        assert seg["id"] == i
        assert seg["start_time_seconds"] >= 0.0
        assert seg["end_time_seconds"] > seg["start_time_seconds"]
        assert timestamp_regex.match(seg["timestamp_label"])
        assert len(seg["text"].strip()) > 0

        # Monotonic continuity: No negative time or overlapping segments
        if i > 0:
            prev_seg = segments[i - 1]
            assert seg["start_time_seconds"] >= prev_seg["end_time_seconds"]

    # 5. Check full_text coverage
    combined_segment_text = " ".join(s["text"] for s in segments)
    assert data["full_text"] == combined_segment_text


def test_chunks_artifact_and_lecture_chunk_golden_contract():
    from ai_service.core.schemas import (
        ChunksArtifactSchema,
        ChunkingMeta,
        LectureChunkSchema,
        ManifestSchema,
        OriginalAudioMeta,
    )

    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()
    chunk0_id = uuid.uuid4()
    chunk1_id = uuid.uuid4()

    chunk0 = LectureChunkSchema(
        id=chunk0_id,
        lecture_id=lecture_id,
        chunk_index=0,
        start_time_seconds=0.0,
        end_time_seconds=12.5,
        start_timestamp_display="00:00",
        end_timestamp_display="00:12",
        speaker_label="LECTURER",
        content="Không gian vector và tổ hợp tuyến tính.",
        token_count=9,
        embedding_half=[0.03125] * 1024,
        lexical_weights={"không": 0.41, "vector": 0.52},
        prev_chunk_id=None,
        next_chunk_id=chunk1_id,
        metadata={"segment_ids": [0, 1]},
    )
    chunk1 = LectureChunkSchema(
        id=chunk1_id,
        lecture_id=lecture_id,
        chunk_index=1,
        start_time_seconds=12.5,
        end_time_seconds=25.0,
        start_timestamp_display="00:12",
        end_timestamp_display="00:25",
        speaker_label="LECTURER",
        content="Độc lập tuyến tính và cơ sở của không gian.",
        token_count=10,
        embedding_half=[0.03125] * 1024,
        lexical_weights={"độc": 0.35, "tuyến": 0.44},
        prev_chunk_id=chunk0_id,
        next_chunk_id=None,
        metadata={"segment_ids": [2]},
    )

    artifact = ChunksArtifactSchema(
        job_id=job_id,
        lecture_id=lecture_id,
        model="bge-m3",
        max_tokens=512,
        overlap_tokens=64,
        total_chunks=2,
        processing_seconds=1.25,
        created_at="2026-11-14T12:00:00+00:00",
        chunks=[chunk0, chunk1],
    )

    data = json.loads(artifact.model_dump_json(indent=2))
    assert data["schema_version"] == 1
    assert data["job_id"] == str(job_id)
    assert data["lecture_id"] == str(lecture_id)
    assert data["model"] == "bge-m3"
    assert data["max_tokens"] == 512
    assert data["overlap_tokens"] == 64
    assert data["total_chunks"] == 2
    assert len(data["chunks"]) == 2

    c0, c1 = data["chunks"]
    assert len(c0["embedding_half"]) == 1024
    assert c0["token_count"] <= 512
    assert c0["prev_chunk_id"] is None
    assert c0["next_chunk_id"] == str(chunk1_id)
    assert c1["prev_chunk_id"] == str(chunk0_id)
    assert c1["next_chunk_id"] is None

    # Backward compatibility: Manifest without chunking field gets default ChunkingMeta
    legacy_manifest_dict = {
        "schema_version": 1,
        "job_id": str(job_id),
        "lecture_id": str(lecture_id),
        "original": OriginalAudioMeta(
            filename=f"{job_id}.mp3",
            extension="mp3",
            size_bytes=1024,
            sha256="a" * 64,
        ).model_dump(mode="json"),
    }
    manifest = ManifestSchema.model_validate(legacy_manifest_dict)
    assert isinstance(manifest.chunking, ChunkingMeta)
    assert manifest.chunking.status == "PENDING"
    assert manifest.chunking.model == "bge-m3"
    assert manifest.chunking.chunk_count == 0
    assert manifest.chunking.db_synced is False

