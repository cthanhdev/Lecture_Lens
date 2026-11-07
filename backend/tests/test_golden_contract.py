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
