"""
Tests for AudioPreprocessor Deep Module.
Verifies conversion to 16kHz mono PCM, metadata extraction, and error handling for corrupted inputs.
"""
from pathlib import Path
import wave
import pytest
from ai_service.core.preprocessing import (
    AudioCorruptedError,
    FakeAudioPreprocessor,
)


def test_fake_preprocessor_generates_valid_16k_mono_wav(tmp_path: Path):
    source_audio = tmp_path / "lecture.mp3"
    source_audio.write_bytes(b"mock_mp3_binary_data")

    output_wav = tmp_path / "normalized.wav"
    preprocessor = FakeAudioPreprocessor(synthetic_duration_seconds=3.5)

    meta = preprocessor.process(source_audio, output_wav)
    assert meta.sample_rate_hz == 16000
    assert meta.channels == 1
    assert meta.bits_per_sample == 16
    assert meta.duration_seconds == 3.5

    assert output_wav.exists()
    # Verify the created wav file with wave module
    with wave.open(str(output_wav), "rb") as wf:
        assert wf.getframerate() == 16000
        assert wf.getnchannels() == 1
        assert wf.getsampwidth() == 2
        assert wf.getnframes() == int(16000 * 3.5)


def test_preprocessor_source_not_found_raises_filenotfound(tmp_path: Path):
    non_existent = tmp_path / "missing.mp3"
    output_wav = tmp_path / "normalized.wav"
    preprocessor = FakeAudioPreprocessor()

    with pytest.raises(FileNotFoundError):
        preprocessor.process(non_existent, output_wav)


def test_preprocessor_corrupted_input_raises_audiocorrupted(tmp_path: Path):
    corrupt_file = tmp_path / "corrupt.mp3"
    corrupt_file.write_bytes(b"CORRUPT_HEADER_TRUNCATED")

    output_wav = tmp_path / "normalized.wav"
    preprocessor = FakeAudioPreprocessor()

    with pytest.raises(AudioCorruptedError, match="Simulated corrupt audio detected"):
        preprocessor.process(corrupt_file, output_wav)
