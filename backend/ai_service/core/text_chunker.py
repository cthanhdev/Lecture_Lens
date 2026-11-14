"""
Recursive Token Chunking Deep Module ([I5]).
Splits and merges timestamped Vietnamese TranscriptSchema segments into token-bounded
ChunkDraft nodes with sliding-window overlap, interpolated timestamps, and doubly-linked IDs.
"""
from dataclasses import dataclass
import hashlib
from pathlib import Path
from typing import Any, Protocol
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from ai_service.core.asr import format_timestamp_label
from ai_service.core.schemas import TranscriptSchema, TranscriptSegment


class TokenizerProtocol(Protocol):
    """Seam for token counting, encoding, and decoding."""

    def count_tokens(self, text: str) -> int: ...

    def encode(self, text: str) -> list[int]: ...

    def decode(self, token_ids: list[int]) -> str: ...


class BgeM3TokenizerAdapter:
    """
    Production Adapter wrapping local BGE-M3 HuggingFace fast tokenizer.
    Lazy-loads weights on first call and excludes special tokens so payload counts
    stay strictly bounded beneath max_tokens - reserve_special_tokens.
    """

    def __init__(self, model_path: Path | str = Path("backend/models/bge-m3")) -> None:
        self.model_path = Path(model_path).resolve()
        self._tokenizer: Any = None

    def _ensure_loaded(self) -> None:
        if self._tokenizer is not None:
            return
        if not self.model_path.exists():
            raise FileNotFoundError(f"BGE-M3 tokenizer directory not found: {self.model_path}")
        from transformers import AutoTokenizer

        self._tokenizer = AutoTokenizer.from_pretrained(
            str(self.model_path),
            use_fast=True,
            local_files_only=True,
        )

    def encode(self, text: str) -> list[int]:
        if not text:
            return []
        self._ensure_loaded()
        return list(self._tokenizer.encode(text, add_special_tokens=False))

    def count_tokens(self, text: str) -> int:
        return len(self.encode(text))

    def decode(self, token_ids: list[int]) -> str:
        if not token_ids:
            return ""
        self._ensure_loaded()
        return str(self._tokenizer.decode(token_ids, skip_special_tokens=True)).strip()


class WhitespaceApproxTokenizer:
    """
    Lightweight zero-dependency test/fallback adapter splitting on whitespace
    with deterministic cross-run token IDs.
    """

    def __init__(self) -> None:
        self._token_to_id: dict[str, int] = {}
        self._id_to_token: dict[int, str] = {}

    def _get_or_register_id(self, token: str) -> int:
        existing = self._token_to_id.get(token)
        if existing is not None:
            return existing
        candidate = int.from_bytes(hashlib.sha256(token.encode("utf-8")).digest()[:7], "big") + 1
        while candidate in self._id_to_token and self._id_to_token[candidate] != token:
            candidate += 1
        self._token_to_id[token] = candidate
        self._id_to_token[candidate] = token
        return candidate

    def encode(self, text: str) -> list[int]:
        tokens = text.split()
        return [self._get_or_register_id(tok) for tok in tokens]

    def count_tokens(self, text: str) -> int:
        return len(text.split())

    def decode(self, token_ids: list[int]) -> str:
        words = [self._id_to_token[tid] for tid in token_ids if tid in self._id_to_token]
        return " ".join(words)


class ChunkDraft(BaseModel):
    """
    In-memory chunk contract matching rag.lecture_chunks before vector embedding.
    """

    id: UUID = Field(default_factory=uuid4)
    lecture_id: UUID
    chunk_index: int
    start_time_seconds: float
    end_time_seconds: float
    start_timestamp_display: str
    end_timestamp_display: str
    speaker_label: str = "LECTURER"
    content: str
    token_count: int
    prev_chunk_id: UUID | None = None
    next_chunk_id: UUID | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class TextChunkerProtocol(Protocol):
    """Seam for transcript-to-chunk segmentation."""

    def chunk_transcript(self, transcript: TranscriptSchema) -> list[ChunkDraft]: ...


@dataclass(frozen=True)
class _SubSegment:
    segment_id: int
    text: str
    start_time_seconds: float
    end_time_seconds: float
    token_count: int


class RecursiveTokenChunker:
    """
    Deep Module converting timestamped TranscriptSchema segments into token-bounded
    doubly-linked ChunkDraft sequences with configurable overlap and recursive splitting.
    """

    _SEPARATORS: tuple[str, ...] = (". ", "? ", "! ", "; ", "\n", ", ", " ")

    def __init__(
        self,
        tokenizer: TokenizerProtocol,
        max_tokens: int = 512,
        overlap_tokens: int = 64,
        reserve_special_tokens: int = 2,
    ) -> None:
        if reserve_special_tokens < 0:
            raise ValueError("reserve_special_tokens must be non-negative")
        if max_tokens <= reserve_special_tokens:
            raise ValueError("max_tokens must be greater than reserve_special_tokens")
        if overlap_tokens < 0:
            raise ValueError("overlap_tokens must be non-negative")

        self.tokenizer = tokenizer
        self.max_tokens = max_tokens
        self.overlap_tokens = overlap_tokens
        self.reserve_special_tokens = reserve_special_tokens
        self.effective_max = max_tokens - reserve_special_tokens

    def chunk_transcript(self, transcript: TranscriptSchema) -> list[ChunkDraft]:
        if not transcript.segments:
            return []

        sub_segments = self._normalize_segments(transcript.segments)
        if not sub_segments:
            return []

        groups = self._accumulate_chunks(sub_segments)
        return self._finalize_chunks(transcript.lecture_id, groups)

    def _normalize_segments(self, segments: list[TranscriptSegment]) -> list[_SubSegment]:
        sub_segments: list[_SubSegment] = []
        for seg in segments:
            text = seg.text.strip()
            if not text:
                continue
            token_count = self.tokenizer.count_tokens(text)
            if token_count <= self.effective_max:
                sub_segments.append(
                    _SubSegment(
                        segment_id=seg.id,
                        text=text,
                        start_time_seconds=seg.start_time_seconds,
                        end_time_seconds=seg.end_time_seconds,
                        token_count=token_count,
                    )
                )
            else:
                sub_segments.extend(self._split_oversized_segment(seg, text))
        return sub_segments

    def _split_oversized_segment(self, seg: TranscriptSegment, text: str) -> list[_SubSegment]:
        pieces = self._split_text_recursively(text, separator_idx=0)
        if not pieces:
            return []

        total_weight = sum(max(1, len(p)) for p in pieces)
        duration = max(0.0, seg.end_time_seconds - seg.start_time_seconds)
        cum_weight = 0
        sub_segments: list[_SubSegment] = []
        prev_end = seg.start_time_seconds

        for idx, piece in enumerate(pieces):
            cum_weight += max(1, len(piece))
            if idx == len(pieces) - 1:
                end_sec = seg.end_time_seconds
            else:
                raw_end = seg.start_time_seconds + duration * (cum_weight / total_weight)
                rounded_end = round(raw_end, 3)
                end_sec = rounded_end if rounded_end > prev_end else raw_end

            start_sec = prev_end
            sub_segments.append(
                _SubSegment(
                    segment_id=seg.id,
                    text=piece,
                    start_time_seconds=start_sec,
                    end_time_seconds=end_sec,
                    token_count=self.tokenizer.count_tokens(piece),
                )
            )
            prev_end = end_sec

        return sub_segments

    def _split_text_recursively(self, text: str, separator_idx: int) -> list[str]:
        if not text:
            return []
        if self.tokenizer.count_tokens(text) <= self.effective_max:
            return [text]
        if separator_idx >= len(self._SEPARATORS):
            return self._slice_by_token_windows(text)

        sep = self._SEPARATORS[separator_idx]
        parts = self._split_preserving_punctuation(text, sep)
        if len(parts) <= 1:
            return self._split_text_recursively(text, separator_idx + 1)

        if sep == " ":
            return self._pack_word_parts(parts)

        result: list[str] = []
        for part in parts:
            if self.tokenizer.count_tokens(part) <= self.effective_max:
                result.append(part)
            else:
                result.extend(self._split_text_recursively(part, separator_idx + 1))
        return result

    @staticmethod
    def _split_preserving_punctuation(text: str, sep: str) -> list[str]:
        raw_parts = text.split(sep)
        if len(raw_parts) <= 1:
            return [text.strip()] if text.strip() else []

        punct = sep[:-1] if sep.endswith(" ") and len(sep) > 1 else ""
        cleaned: list[str] = []
        last_idx = len(raw_parts) - 1
        for idx, part in enumerate(raw_parts):
            stripped = part.strip()
            if not stripped:
                continue
            if punct and idx < last_idx and not stripped.endswith(punct):
                stripped = f"{stripped}{punct}"
            cleaned.append(stripped)
        return cleaned

    def _pack_word_parts(self, words: list[str]) -> list[str]:
        leaf_budget = (
            min(self.effective_max, max(1, self.overlap_tokens // 2))
            if self.overlap_tokens > 0
            else self.effective_max
        )
        packed: list[str] = []
        current_words: list[str] = []
        current_est_tokens = 0

        def flush_group() -> None:
            nonlocal current_words, current_est_tokens
            while current_words:
                candidate = " ".join(current_words)
                if self.tokenizer.count_tokens(candidate) <= self.effective_max:
                    packed.append(candidate)
                    current_words = []
                    current_est_tokens = 0
                    return
                # Guard against rare subword expansion across spaces
                popped = current_words.pop()
                packed.extend(self._flush_fit_prefix(current_words))
                current_words = [popped]
                current_est_tokens = self.tokenizer.count_tokens(popped)

        for word in words:
            w_tokens = self.tokenizer.count_tokens(word)
            if w_tokens > self.effective_max:
                flush_group()
                packed.extend(self._slice_by_token_windows(word))
                continue

            if current_words and current_est_tokens + w_tokens > leaf_budget:
                flush_group()

            current_words.append(word)
            current_est_tokens += w_tokens

        flush_group()
        return packed

    def _flush_fit_prefix(self, words: list[str]) -> list[str]:
        if not words:
            return []
        out: list[str] = []
        buf: list[str] = []
        for word in words:
            candidate = " ".join((*buf, word))
            if buf and self.tokenizer.count_tokens(candidate) > self.effective_max:
                out.append(" ".join(buf))
                buf = [word]
            else:
                buf.append(word)
        if buf:
            out.append(" ".join(buf))
        return out

    def _slice_by_token_windows(self, text: str) -> list[str]:
        token_ids = self.tokenizer.encode(text)
        if not token_ids:
            return []
        pieces: list[str] = []
        idx = 0
        total = len(token_ids)
        while idx < total:
            end = min(total, idx + self.effective_max)
            piece = self.tokenizer.decode(token_ids[idx:end]).strip()
            while piece and self.tokenizer.count_tokens(piece) > self.effective_max and end > idx + 1:
                end -= 1
                piece = self.tokenizer.decode(token_ids[idx:end]).strip()
            if piece:
                pieces.append(piece)
            idx = end
        return pieces

    def _accumulate_chunks(self, sub_segments: list[_SubSegment]) -> list[list[_SubSegment]]:
        groups: list[list[_SubSegment]] = []
        buffer: list[_SubSegment] = []
        has_new_content = False

        for sub in sub_segments:
            if not buffer:
                buffer = [sub]
                has_new_content = True
                continue

            candidate_text = " ".join(item.text for item in (*buffer, sub))
            if self.tokenizer.count_tokens(candidate_text) <= self.effective_max:
                buffer.append(sub)
                has_new_content = True
                continue

            if has_new_content:
                groups.append(buffer)
                seed = self._build_overlap_seed(buffer)
                buffer = seed
                has_new_content = False

                if not buffer:
                    buffer = [sub]
                    has_new_content = True
                    continue

                candidate_with_seed = " ".join(item.text for item in (*buffer, sub))
                if self.tokenizer.count_tokens(candidate_with_seed) <= self.effective_max:
                    buffer.append(sub)
                    has_new_content = True
                    continue

            # Buffer holds only overlap seed (has_new_content is False) and sub doesn't fit with full seed.
            # Trim overlap from the left so sub always makes forward progress.
            trimmed_seed = self._fit_seed_with_next(buffer, sub)
            buffer = [*trimmed_seed, sub]
            has_new_content = True

        if buffer and has_new_content:
            groups.append(buffer)

        return groups

    def _build_overlap_seed(self, closed_items: list[_SubSegment]) -> list[_SubSegment]:
        effective_overlap = min(self.overlap_tokens, max(0, self.effective_max - 1))
        if effective_overlap <= 0 or not closed_items:
            return []

        last = closed_items[-1]
        if last.token_count > effective_overlap:
            tail = self._take_trailing_tokens(last, effective_overlap)
            return [tail] if tail is not None else []

        seed: list[_SubSegment] = []
        for item in reversed(closed_items):
            candidate = [item, *seed]
            candidate_text = " ".join(x.text for x in candidate)
            if self.tokenizer.count_tokens(candidate_text) <= effective_overlap:
                seed = candidate
            else:
                break
        return seed

    def _fit_seed_with_next(
        self,
        seed: list[_SubSegment],
        next_item: _SubSegment,
    ) -> list[_SubSegment]:
        remaining = list(seed)
        while len(remaining) > 1:
            candidate_text = " ".join(x.text for x in (*remaining, next_item))
            if self.tokenizer.count_tokens(candidate_text) <= self.effective_max:
                return remaining
            remaining.pop(0)

        if not remaining:
            return []

        single = remaining[0]
        if self.tokenizer.count_tokens(f"{single.text} {next_item.text}") <= self.effective_max:
            return [single]

        # Binary search largest suffix of `single` that fits with `next_item`.
        token_ids = self.tokenizer.encode(single.text)
        lo, hi = 1, len(token_ids)
        best_tail: _SubSegment | None = None
        while lo <= hi:
            mid = (lo + hi) // 2
            candidate_tail = self._slice_tail_by_ids(single, token_ids[-mid:])
            if candidate_tail is not None and (
                self.tokenizer.count_tokens(f"{candidate_tail.text} {next_item.text}")
                <= self.effective_max
            ):
                best_tail = candidate_tail
                lo = mid + 1
            else:
                hi = mid - 1

        return [best_tail] if best_tail is not None else []

    def _take_trailing_tokens(self, item: _SubSegment, max_tail_tokens: int) -> _SubSegment | None:
        if max_tail_tokens <= 0:
            return None
        token_ids = self.tokenizer.encode(item.text)
        if not token_ids:
            return None
        k = min(len(token_ids), max_tail_tokens)
        while k > 0:
            tail_sub = self._slice_tail_by_ids(item, token_ids[-k:])
            if tail_sub is not None and tail_sub.token_count <= max_tail_tokens:
                return tail_sub
            k -= 1
        return None

    def _slice_tail_by_ids(self, item: _SubSegment, tail_ids: list[int]) -> _SubSegment | None:
        if not tail_ids:
            return None
        tail_text = self.tokenizer.decode(tail_ids).strip()
        if not tail_text:
            return None
        ratio = min(1.0, len(tail_text) / max(1, len(item.text)))
        duration = max(0.0, item.end_time_seconds - item.start_time_seconds)
        raw_start = item.end_time_seconds - duration * ratio
        start_sec, end_sec = self._round_span(raw_start, item.end_time_seconds)
        return _SubSegment(
            segment_id=item.segment_id,
            text=tail_text,
            start_time_seconds=start_sec,
            end_time_seconds=end_sec,
            token_count=self.tokenizer.count_tokens(tail_text),
        )

    @staticmethod
    def _round_span(start: float, end: float) -> tuple[float, float]:
        rs = round(start, 3)
        re_ = round(end, 3)
        if end > start and re_ <= rs:
            return start, end
        return rs, re_

    def _finalize_chunks(
        self,
        lecture_id: UUID,
        groups: list[list[_SubSegment]],
    ) -> list[ChunkDraft]:
        chunk_ids = [uuid4() for _ in groups]
        drafts: list[ChunkDraft] = []
        for idx, items in enumerate(groups):
            content = " ".join(item.text for item in items)
            start_sec, end_sec = self._round_span(
                items[0].start_time_seconds,
                items[-1].end_time_seconds,
            )
            drafts.append(
                ChunkDraft(
                    id=chunk_ids[idx],
                    lecture_id=lecture_id,
                    chunk_index=idx,
                    start_time_seconds=start_sec,
                    end_time_seconds=end_sec,
                    start_timestamp_display=format_timestamp_label(start_sec),
                    end_timestamp_display=format_timestamp_label(end_sec),
                    speaker_label="LECTURER",
                    content=content,
                    token_count=self.tokenizer.count_tokens(content),
                    prev_chunk_id=chunk_ids[idx - 1] if idx > 0 else None,
                    next_chunk_id=chunk_ids[idx + 1] if idx + 1 < len(chunk_ids) else None,
                    metadata={"segment_ids": list(dict.fromkeys(item.segment_id for item in items))},
                )
            )
        return drafts
