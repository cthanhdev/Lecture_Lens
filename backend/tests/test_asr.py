"""
Tests for AsrEngine Deep Module.
Verifies timestamp formatting [MM:SS], monotonicity invariants, and FakeAsrEngine simulation.
"""
from pathlib import Path
import pytest
from ai_service.core.asr import FakeAsrEngine, format_timestamp_label


def test_format_timestamp_label():
    assert format_timestamp_label(0.0) == "00:00"
    assert format_timestamp_label(7.42) == "00:07"
    assert format_timestamp_label(59.9) == "00:59"
    assert format_timestamp_label(60.0) == "01:00"
    assert format_timestamp_label(125.0) == "02:05"
    assert format_timestamp_label(3665.0) == "01:01:05"


def test_fake_asr_engine_monotonicity_and_contract(tmp_path: Path):
    dummy_wav = tmp_path / "test.wav"
    dummy_wav.write_bytes(b"dummy_wav_bytes")

    progress_reports = []

    def on_progress(p: int):
        progress_reports.append(p)

    asr = FakeAsrEngine()
    segments = asr.transcribe(dummy_wav, on_progress=on_progress)

    assert len(segments) == 3
    assert len(progress_reports) > 0
    assert progress_reports[-1] == 100

    # Invariant: Monotonic timestamps and no negative times
    for i in range(len(segments)):
        seg = segments[i]
        assert seg.start_time_seconds >= 0.0
        assert seg.end_time_seconds > seg.start_time_seconds
        assert len(seg.timestamp_label) >= 5
        assert len(seg.text) > 0

        if i > 0:
            prev_seg = segments[i - 1]
            assert seg.start_time_seconds >= prev_seg.end_time_seconds
