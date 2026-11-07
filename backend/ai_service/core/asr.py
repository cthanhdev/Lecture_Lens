"""
AsrEngine Deep Module: Vietnamese Speech-to-Text inference with PhoWhisper-base.
Handles 30-second window batching, VRAM cache recycling, and monotonic timestamp alignment [MM:SS].
"""
from collections.abc import Callable
import logging
import math
from pathlib import Path
from typing import Protocol
import wave
from ai_service.core.schemas import TranscriptSegment

logger = logging.getLogger("ai_service.asr")


def format_timestamp_label(seconds: float) -> str:
    """
    Formats seconds into a human-readable timestamp label matching GLOSSARY standards:
    - [MM:SS] for durations < 1 hour (e.g., "00:00", "07:42")
    - [HH:MM:SS] for longer lectures (e.g., "01:23:45")
    """
    total_seconds = max(0, int(math.floor(seconds)))
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


class AsrEngineProtocol(Protocol):
    """
    Seam for Speech-to-Text inference engine.
    """
    def transcribe(
        self,
        wav_path: Path,
        on_progress: Callable[[int], None] | None = None
    ) -> list[TranscriptSegment]: ...


class PhoWhisperEngine:
    """
    Production Adapter: Performs offline Vietnamese speech recognition using local PhoWhisper weights.
    Recycles GPU VRAM between audio window batches to prevent Out-Of-Memory exceptions.
    """

    def __init__(self, model_path: Path, device: str = "cuda"):
        self.model_path = Path(model_path).resolve()
        self.device = device
        self._model = None
        self._processor = None

    def _ensure_loaded(self):
        if self._model is not None and self._processor is not None:
            return

        import torch
        from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor

        actual_device = self.device
        if actual_device == "cuda" and not torch.cuda.is_available():
            logger.warning("CUDA requested but not available. Falling back to CPU for PhoWhisper.")
            actual_device = "cpu"

        torch_dtype = torch.float16 if actual_device == "cuda" else torch.float32

        logger.info("Loading PhoWhisper from %s onto %s (dtype=%s)...", self.model_path, actual_device, torch_dtype)
        self._processor = AutoProcessor.from_pretrained(str(self.model_path))
        self._model = AutoModelForSpeechSeq2Seq.from_pretrained(
            str(self.model_path),
            torch_dtype=torch_dtype,
            low_cpu_mem_usage=True
        ).to(actual_device)
        self.device = actual_device
        logger.info("PhoWhisper successfully loaded into VRAM/RAM.")

    def transcribe(
        self,
        wav_path: Path,
        on_progress: Callable[[int], None] | None = None
    ) -> list[TranscriptSegment]:
        import torch

        self._ensure_loaded()
        wav_path = Path(wav_path).resolve()
        if not wav_path.exists():
            raise FileNotFoundError(f"Normalized WAV file not found: {wav_path}")

        # Read 16kHz mono audio samples
        with wave.open(str(wav_path), "rb") as wf:
            sample_rate = wf.getframerate()
            num_frames = wf.getnframes()
            audio_bytes = wf.readframes(num_frames)

        # Convert raw PCM 16-bit to float tensor (-1.0 to 1.0)
        import numpy as np
        audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0

        total_samples = len(audio_array)
        total_seconds = total_samples / sample_rate
        chunk_seconds = 30
        chunk_samples = chunk_seconds * sample_rate

        segments: list[TranscriptSegment] = []
        num_chunks = max(1, math.ceil(total_samples / chunk_samples))

        logger.info(
            "Transcribing %s (Duration: %.1fs, Chunks: %d)...",
            wav_path.name, total_seconds, num_chunks
        )

        curr_time = 0.0
        segment_id = 0

        for i in range(num_chunks):
            start_sample = i * chunk_samples
            end_sample = min(total_samples, start_sample + chunk_samples)
            chunk_data = audio_array[start_sample:end_sample]

            chunk_duration = len(chunk_data) / sample_rate
            chunk_start_sec = i * chunk_seconds
            chunk_end_sec = min(total_seconds, chunk_start_sec + chunk_duration)

            # Process with PhoWhisper
            inputs = self._processor(
                chunk_data,
                sampling_rate=sample_rate,
                return_tensors="pt"
            )
            input_features = inputs.input_features.to(
                self.device,
                dtype=torch.float16 if self.device == "cuda" else torch.float32
            )

            with torch.no_grad():
                generated_ids = self._model.generate(
                    input_features,
                    language="vi",
                    task="transcribe"
                )

            transcription = self._processor.batch_decode(
                generated_ids,
                skip_special_tokens=True
            )[0].strip()

            if transcription:
                seg = TranscriptSegment(
                    id=segment_id,
                    start_time_seconds=round(chunk_start_sec, 2),
                    end_time_seconds=round(chunk_end_sec, 2),
                    timestamp_label=format_timestamp_label(chunk_start_sec),
                    text=transcription
                )
                segments.append(seg)
                segment_id += 1

            # VRAM Garbage Collection after each batch
            if self.device == "cuda" and torch.cuda.is_available():
                torch.cuda.empty_cache()

            # Report progress
            if on_progress:
                pct = int(((i + 1) / num_chunks) * 100)
                on_progress(min(100, pct))

        logger.info("Transcribed %d segments successfully.", len(segments))
        return segments


class FakeAsrEngine:
    """
    Test Adapter: Instantaneously returns simulated Vietnamese spoken segments
    with monotonically increasing timestamps. Runs in <10ms for TDD test suites.
    """

    def __init__(self, synthetic_segments: list[str] | None = None):
        self.synthetic_segments = synthetic_segments or [
            "Chào các em sinh viên, hôm nay chúng ta bắt đầu bài giảng về Không Gian Vector.",
            "Một tập hợp các vector được gọi là độc lập tuyến tính nếu không có vector nào biểu diễn được qua các vector còn lại.",
            "Chúng ta sẽ xem xét ma trận chuyển cơ sở và thuật toán khử Gauss-Jordan."
        ]

    def transcribe(
        self,
        wav_path: Path,
        on_progress: Callable[[int], None] | None = None
    ) -> list[TranscriptSegment]:
        wav_path = Path(wav_path).resolve()
        if not wav_path.exists():
            raise FileNotFoundError(f"WAV audio file not found: {wav_path}")

        segments: list[TranscriptSegment] = []
        curr_time = 0.0
        step = 6.5

        if on_progress:
            on_progress(10)

        for idx, text in enumerate(self.synthetic_segments):
            start_t = round(curr_time, 2)
            end_t = round(curr_time + step, 2)
            segments.append(
                TranscriptSegment(
                    id=idx,
                    start_time_seconds=start_t,
                    end_time_seconds=end_t,
                    timestamp_label=format_timestamp_label(start_t),
                    text=text
                )
            )
            curr_time = end_t
            if on_progress:
                pct = int(((idx + 1) / len(self.synthetic_segments)) * 100)
                on_progress(pct)

        return segments
