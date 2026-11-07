"""
Unit tests for EnergyVadChunker deep module.
Tests silence interval detection, speech boundary protection, and window continuity.
"""
import numpy as np
import pytest
from ai_service.core.vad_chunker import EnergyVadChunker, AudioWindow


def test_vad_chunker_short_audio_returns_single_window():
    chunker = EnergyVadChunker()
    sample_rate = 16000
    # 5 seconds of silence/speech
    audio = np.zeros(5 * sample_rate, dtype=np.float32)

    windows = chunker.split_into_speech_windows(
        audio,
        sample_rate=sample_rate,
        target_max_seconds=28.0
    )

    assert len(windows) == 1
    assert windows[0].chunk_index == 0
    assert windows[0].start_seconds == 0.0
    assert windows[0].end_seconds == 5.0
    assert len(windows[0].data) == len(audio)


def test_vad_chunker_splits_at_natural_silence_gaps():
    chunker = EnergyVadChunker()
    sample_rate = 16000

    # Build 45 seconds of audio:
    # 0s - 20s: Speech (sine wave)
    # 20s - 22s: Silence (zeros) -> 2.0s silence gap in the target zone
    # 22s - 45s: Speech (sine wave)
    t1 = np.linspace(0, 20, 20 * sample_rate, endpoint=False)
    speech1 = 0.5 * np.sin(2 * np.pi * 440 * t1).astype(np.float32)

    silence = np.zeros(2 * sample_rate, dtype=np.float32)

    t2 = np.linspace(0, 23, 23 * sample_rate, endpoint=False)
    speech2 = 0.5 * np.sin(2 * np.pi * 440 * t2).astype(np.float32)

    audio = np.concatenate([speech1, silence, speech2])
    total_duration = len(audio) / sample_rate
    assert pytest.approx(total_duration, 0.01) == 45.0

    windows = chunker.split_into_speech_windows(
        audio,
        sample_rate=sample_rate,
        target_max_seconds=28.0,
        min_window_seconds=10.0
    )

    # Should split into 2 windows cleanly
    assert len(windows) == 2
    # The split point should land inside the silence gap (between 20.0s and 22.0s)
    first_window = windows[0]
    second_window = windows[1]

    assert 20.0 <= first_window.end_seconds <= 22.0
    assert first_window.end_seconds == second_window.start_seconds
    assert second_window.end_seconds == 45.0

    # Total samples reconstructed must exactly equal original samples
    reconstructed_length = len(first_window.data) + len(second_window.data)
    assert reconstructed_length == len(audio)


def test_vad_chunker_continuous_speech_fallback():
    """When speaker does not pause at all, chunker gracefully splits at target_max_seconds."""
    chunker = EnergyVadChunker()
    sample_rate = 16000

    # 40 seconds of continuous tone (no silence anywhere)
    t = np.linspace(0, 40, 40 * sample_rate, endpoint=False)
    constant_speech = 0.5 * np.sin(2 * np.pi * 440 * t).astype(np.float32)

    windows = chunker.split_into_speech_windows(
        constant_speech,
        sample_rate=sample_rate,
        target_max_seconds=25.0,
        min_window_seconds=10.0
    )

    assert len(windows) == 2
    assert windows[0].start_seconds == 0.0
    assert windows[0].end_seconds == 25.0
    assert windows[1].start_seconds == 25.0
    assert windows[1].end_seconds == 40.0
