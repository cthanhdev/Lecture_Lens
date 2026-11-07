"""
AudioPreprocessor Deep Module: Audio conversion, downmixing and normalization to 16kHz Mono PCM.
"""
import logging
from pathlib import Path
import shutil
import subprocess
from typing import Protocol
import wave
from pydantic import BaseModel

logger = logging.getLogger("ai_service.preprocessing")


class AudioMetadata(BaseModel):
    sample_rate_hz: int = 16000
    channels: int = 1
    duration_seconds: float = 0.0
    bits_per_sample: int = 16


class PreprocessingError(Exception):
    """Base error for audio preprocessing failure."""
    pass


class AudioCorruptedError(PreprocessingError):
    """Raised when the input audio file is corrupt or unreadable."""
    pass


class AudioPreprocessorProtocol(Protocol):
    """
    Seam for Audio preprocessing and normalization.
    """
    def process(self, source_audio: Path, output_wav: Path) -> AudioMetadata: ...


class FFmpegAudioPreprocessor:
    """
    Production Adapter: Executes FFmpeg subprocess to convert any input format
    into 16kHz Mono 16-bit PCM WAV as required by PhoWhisper.
    """

    def __init__(self, ffmpeg_bin: str = "ffmpeg"):
        self.ffmpeg_bin = ffmpeg_bin

    def process(self, source_audio: Path, output_wav: Path) -> AudioMetadata:
        source_audio = Path(source_audio).resolve()
        output_wav = Path(output_wav).resolve()

        if not source_audio.exists():
            raise FileNotFoundError(f"Source audio file not found: {source_audio}")

        output_wav.parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            self.ffmpeg_bin,
            "-y",
            "-i", str(source_audio),
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            str(output_wav)
        ]

        logger.info("Executing FFmpeg normalization: %s", " ".join(cmd))
        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False
            )
        except FileNotFoundError:
            raise PreprocessingError(
                f"FFmpeg binary '{self.ffmpeg_bin}' not found in system PATH. Please install FFmpeg."
            )

        if result.returncode != 0:
            err_msg = result.stderr.decode("utf-8", errors="replace")
            logger.error("FFmpeg execution failed (code %d): %s", result.returncode, err_msg)
            raise AudioCorruptedError(f"FFmpeg failed to decode audio: {err_msg[:300]}")

        # Probe the resulting WAV file using standard library wave module
        try:
            with wave.open(str(output_wav), "rb") as wf:
                frames = wf.getnframes()
                rate = wf.getframerate()
                channels = wf.getnchannels()
                sample_width = wf.getsampwidth()
                duration = frames / float(rate) if rate > 0 else 0.0

                if duration <= 0.01:
                    raise AudioCorruptedError("Generated audio contains no valid audio frames (0 duration).")

                return AudioMetadata(
                    sample_rate_hz=rate,
                    channels=channels,
                    duration_seconds=round(duration, 3),
                    bits_per_sample=sample_width * 8
                )
        except wave.Error as e:
            raise AudioCorruptedError(f"Normalized WAV file header is invalid: {e}")


class FakeAudioPreprocessor:
    """
    Test Adapter: Rapidly generates a synthetic 16kHz mono WAV file in memory
    without requiring external FFmpeg binaries.
    """

    def __init__(self, synthetic_duration_seconds: float = 5.0):
        self.synthetic_duration_seconds = synthetic_duration_seconds

    def process(self, source_audio: Path, output_wav: Path) -> AudioMetadata:
        source_audio = Path(source_audio).resolve()
        output_wav = Path(output_wav).resolve()

        if not source_audio.exists():
            raise FileNotFoundError(f"Source audio file not found: {source_audio}")

        # If source is 0-byte or corrupted trigger
        if source_audio.stat().st_size == 0 or b"CORRUPT" in source_audio.read_bytes()[:20]:
            raise AudioCorruptedError("Simulated corrupt audio detected.")

        output_wav.parent.mkdir(parents=True, exist_ok=True)

        sample_rate = 16000
        num_frames = int(sample_rate * self.synthetic_duration_seconds)

        # Write genuine silent 16kHz 16-bit mono PCM WAV
        with wave.open(str(output_wav), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            # Write zeros (silence)
            wf.writeframes(b"\x00\x00" * num_frames)

        return AudioMetadata(
            sample_rate_hz=sample_rate,
            channels=1,
            duration_seconds=self.synthetic_duration_seconds,
            bits_per_sample=16
        )
