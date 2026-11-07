"""
VAD & Silence-Based Chunking Deep Module.
Splits continuous lecture audio into natural speech windows bounded by silence gaps,
preventing speech truncation and word boundary clobbering.
"""
from dataclasses import dataclass
import logging
from typing import Protocol
import numpy as np

logger = logging.getLogger("ai_service.vad_chunker")


@dataclass
class AudioWindow:
    """Represents a discrete speech window for Whisper inference."""
    chunk_index: int
    start_seconds: float
    end_seconds: float
    data: np.ndarray


class VadChunkerProtocol(Protocol):
    """Seam for voice activity and silence window slicing."""
    def split_into_speech_windows(
        self,
        audio_array: np.ndarray,
        sample_rate: int = 16000,
        target_max_seconds: float = 28.0,
        min_window_seconds: float = 10.0,
        silence_threshold_db: float = -38.0
    ) -> list[AudioWindow]: ...


class EnergyVadChunker:
    """
    Production Adapter: High-performance NumPy RMS energy scanner.
    Detects natural sentence completion gaps (>= 300ms silence) in the 18s-28s window zone.
    """

    def split_into_speech_windows(
        self,
        audio_array: np.ndarray,
        sample_rate: int = 16000,
        target_max_seconds: float = 28.0,
        min_window_seconds: float = 10.0,
        silence_threshold_db: float = -38.0
    ) -> list[AudioWindow]:
        total_samples = len(audio_array)
        total_seconds = total_samples / sample_rate

        if total_seconds <= target_max_seconds:
            return [
                AudioWindow(
                    chunk_index=0,
                    start_seconds=0.0,
                    end_seconds=round(total_seconds, 3),
                    data=audio_array
                )
            ]

        # 50ms frame analysis
        frame_size = int(0.050 * sample_rate)  # 800 samples per 50ms
        num_frames = total_samples // frame_size

        if num_frames == 0:
            return [AudioWindow(0, 0.0, round(total_seconds, 3), audio_array)]

        # Vectorized RMS energy calculation per frame
        frames = audio_array[:num_frames * frame_size].reshape(num_frames, frame_size)
        rms = np.sqrt(np.mean(frames ** 2, axis=1) + 1e-9)
        db = 20 * np.log10(rms)

        is_silent = db < silence_threshold_db

        windows: list[AudioWindow] = []
        curr_sample = 0
        chunk_idx = 0

        target_max_samples = int(target_max_seconds * sample_rate)
        min_window_samples = int(min_window_seconds * sample_rate)

        while curr_sample < total_samples:
            remaining_samples = total_samples - curr_sample
            if remaining_samples <= target_max_samples:
                # Last remaining slice fits in one window
                windows.append(
                    AudioWindow(
                        chunk_index=chunk_idx,
                        start_seconds=round(curr_sample / sample_rate, 3),
                        end_seconds=round(total_seconds, 3),
                        data=audio_array[curr_sample:]
                    )
                )
                break

            # Search range for optimal split point: from min_window_samples to target_max_samples
            search_start_sample = curr_sample + min_window_samples
            search_end_sample = curr_sample + target_max_samples

            start_frame = search_start_sample // frame_size
            end_frame = min(num_frames, search_end_sample // frame_size)

            best_split_sample = None
            longest_silence_count = 0
            best_silence_start_frame = None

            # Find longest contiguous silence run within the search zone
            current_silence_len = 0
            for f in range(start_frame, end_frame):
                if is_silent[f]:
                    current_silence_len += 1
                    if current_silence_len > longest_silence_count:
                        longest_silence_count = current_silence_len
                        best_silence_start_frame = f - current_silence_len + 1
                else:
                    current_silence_len = 0

            # If a silence >= 300ms (6 frames of 50ms) is found, split in the middle of silence
            if longest_silence_count >= 6 and best_silence_start_frame is not None:
                split_frame = best_silence_start_frame + (longest_silence_count // 2)
                best_split_sample = split_frame * frame_size
            elif longest_silence_count >= 3 and best_silence_start_frame is not None:
                # Fallback to shorter pause (>= 150ms)
                split_frame = best_silence_start_frame + (longest_silence_count // 2)
                best_split_sample = split_frame * frame_size
            else:
                # No natural silence gap found (continuous speech): split at target_max_samples
                best_split_sample = search_end_sample

            chunk_data = audio_array[curr_sample:best_split_sample]
            start_sec = round(curr_sample / sample_rate, 3)
            end_sec = round(best_split_sample / sample_rate, 3)

            windows.append(
                AudioWindow(
                    chunk_index=chunk_idx,
                    start_seconds=start_sec,
                    end_seconds=end_sec,
                    data=chunk_data
                )
            )

            curr_sample = best_split_sample
            chunk_idx += 1

        logger.info("VAD Chunker partitioned %.1fs audio into %d natural speech windows.", total_seconds, len(windows))
        return windows
