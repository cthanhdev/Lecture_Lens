"""
ChunkStore Deep Module: Persistent storage and 3-stream Vietnamese Hybrid RRF retrieval
for embedded lecture chunks across InMemory, PostgreSQL pgvector, and Composite adapters.
"""
from collections.abc import Callable, Iterator
from contextlib import contextmanager
import json
import logging
import math
import re
from typing import Any, Protocol
import unicodedata
from uuid import UUID

from ai_service.core.schemas import LectureChunkSchema

logger = logging.getLogger("ai_service.chunk_store")

_WORD_RE = re.compile(r"[a-z0-9]+")


def unaccent_vietnamese(text: str) -> str:
    """
    Mirrors PostgreSQL rag.immutable_unaccent(text): strips Vietnamese diacritics
    and normalizes đ/Đ to d/D before lowercasing.
    """
    replaced = text.replace("\u0111", "d").replace("\u0110", "D")
    decomposed = unicodedata.normalize("NFD", replaced)
    stripped = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return unicodedata.normalize("NFC", stripped)


def _tokenize_unaccented(text: str) -> list[str]:
    return _WORD_RE.findall(unaccent_vietnamese(text).lower())


def _word_trigrams(text: str) -> set[str]:
    trigrams: set[str] = set()
    for word in _tokenize_unaccented(text):
        padded = f"  {word} "
        for idx in range(len(padded) - 2):
            trigrams.add(padded[idx : idx + 3])
    return trigrams


def _trigram_similarity(trigrams_a: set[str], trigrams_b: set[str]) -> float:
    if not trigrams_a or not trigrams_b:
        return 0.0
    union_len = len(trigrams_a | trigrams_b)
    if union_len == 0:
        return 0.0
    return len(trigrams_a & trigrams_b) / union_len


def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


def _format_context_item(position: str, chunk: LectureChunkSchema) -> dict:
    return {
        "position": position,
        "chunk_id": chunk.id,
        "start_timestamp_display": chunk.start_timestamp_display,
        "end_timestamp_display": chunk.end_timestamp_display,
        "speaker_label": chunk.speaker_label,
        "content": chunk.content,
    }


def _format_halfvec(values: list[float]) -> str:
    return "[" + ",".join(str(float(x)) for x in values) + "]"


def _parse_halfvec(raw: Any) -> list[float]:
    if isinstance(raw, list):
        return [float(x) for x in raw]
    if isinstance(raw, str):
        stripped = raw.strip().strip("[]")
        if not stripped:
            return []
        return [float(part) for part in stripped.split(",")]
    return []


def _to_uuid(raw: Any) -> UUID | None:
    if raw is None:
        return None
    if isinstance(raw, UUID):
        return raw
    return UUID(str(raw))


def _to_dict(raw: Any) -> dict:
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return dict(raw)
    if isinstance(raw, str):
        return json.loads(raw)
    return dict(raw)


class ChunkStoreProtocol(Protocol):
    """Seam for lecture chunk persistence and 3-stream hybrid RRF search."""

    def save_lecture_chunks(self, lecture_id: UUID, chunks: list[LectureChunkSchema]) -> int: ...

    def get_lecture_chunks(self, lecture_id: UUID) -> list[LectureChunkSchema]: ...

    def search_hybrid_rrf(
        self,
        lecture_ids: list[UUID],
        query_embedding: list[float],
        query_text: str,
        top_k: int = 25,
        rrf_k: int = 60,
    ) -> list[dict]: ...

    def get_expanded_context(self, chunk_id: UUID) -> list[dict]: ...

    def is_postgres_connected(self) -> bool: ...


class InMemoryChunkStore:
    """
    Zero-dependency in-memory adapter mirroring 04_rag_hybrid_search_rrf.sql semantics
    for offline local execution and unit testing.
    """

    def __init__(self) -> None:
        self._by_lecture: dict[UUID, list[LectureChunkSchema]] = {}
        self._by_id: dict[UUID, LectureChunkSchema] = {}

    def is_postgres_connected(self) -> bool:
        return False

    def save_lecture_chunks(self, lecture_id: UUID, chunks: list[LectureChunkSchema]) -> int:
        """Idempotently replaces all stored chunks for a lecture, ordered by chunk_index."""
        previous = self._by_lecture.pop(lecture_id, [])
        for old in previous:
            self._by_id.pop(old.id, None)

        ordered = sorted(chunks, key=lambda c: c.chunk_index)
        self._by_lecture[lecture_id] = ordered
        for chunk in ordered:
            self._by_id[chunk.id] = chunk
        return len(ordered)

    def get_lecture_chunks(self, lecture_id: UUID) -> list[LectureChunkSchema]:
        """Returns all chunks for lecture_id sorted by chunk_index."""
        return list(self._by_lecture.get(lecture_id, []))

    def search_hybrid_rrf(
        self,
        lecture_ids: list[UUID],
        query_embedding: list[float],
        query_text: str,
        top_k: int = 25,
        rrf_k: int = 60,
    ) -> list[dict]:
        """
        Executes 3-stream Vietnamese hybrid search (Dense Cosine + Unaccented Lexical
        + Trigram Fuzzy) fused via Reciprocal Rank Fusion (1 / (rrf_k + rank)).
        """
        if not lecture_ids or top_k <= 0:
            return []

        allowed_ids = set(lecture_ids)
        candidates = [
            chunk
            for lid in allowed_ids
            for chunk in self._by_lecture.get(lid, [])
        ]
        if not candidates:
            return []

        # Stream 1: Dense cosine similarity (top 50)
        dense_scored = [
            (chunk, _cosine_similarity(chunk.embedding_half, query_embedding))
            for chunk in candidates
        ]
        dense_scored.sort(key=lambda item: (-item[1], item[0].chunk_index, str(item[0].id)))
        dense_top = dense_scored[:50]
        dense_ranks: dict[UUID, int] = {chunk.id: idx + 1 for idx, (chunk, _) in enumerate(dense_top)}
        dense_scores: dict[UUID, float] = {chunk.id: score for chunk, score in dense_top}

        # Stream 2: Unaccented plainto_tsquery('simple', ...) AND-match (top 50)
        query_tokens = _tokenize_unaccented(query_text)
        query_token_set = set(query_tokens)
        lexical_ranks: dict[UUID, int] = {}
        if query_token_set:
            lexical_scored: list[tuple[LectureChunkSchema, float]] = []
            for chunk in candidates:
                chunk_tokens = _tokenize_unaccented(chunk.content)
                chunk_token_set = set(chunk_tokens)
                if query_token_set.issubset(chunk_token_set):
                    # Term-frequency coverage proxy matching ts_rank_cd ordering
                    tf_score = sum(chunk_tokens.count(tok) for tok in query_token_set) / max(1, len(chunk_tokens))
                    lexical_scored.append((chunk, tf_score))
            lexical_scored.sort(key=lambda item: (-item[1], item[0].chunk_index, str(item[0].id)))
            lexical_ranks = {chunk.id: idx + 1 for idx, (chunk, _) in enumerate(lexical_scored[:50])}

        # Stream 3: pg_trgm similarity > 0.15 on unaccented content (top 50)
        query_trigrams = _word_trigrams(query_text)
        fuzzy_ranks: dict[UUID, int] = {}
        if query_trigrams:
            fuzzy_scored: list[tuple[LectureChunkSchema, float]] = []
            for chunk in candidates:
                sim = _trigram_similarity(_word_trigrams(chunk.content), query_trigrams)
                if sim > 0.15:
                    fuzzy_scored.append((chunk, sim))
            fuzzy_scored.sort(key=lambda item: (-item[1], item[0].chunk_index, str(item[0].id)))
            fuzzy_ranks = {chunk.id: idx + 1 for idx, (chunk, _) in enumerate(fuzzy_scored[:50])}

        # Merge via RRF across all candidate IDs appearing in any stream
        merged_ids = set(dense_ranks) | set(lexical_ranks) | set(fuzzy_ranks)
        results: list[dict] = []
        for cid in merged_ids:
            chunk = self._by_id[cid]
            d_rank = dense_ranks.get(cid)
            l_rank = lexical_ranks.get(cid)
            f_rank = fuzzy_ranks.get(cid)
            rrf_total = (
                (1.0 / (rrf_k + d_rank) if d_rank is not None else 0.0)
                + (1.0 / (rrf_k + l_rank) if l_rank is not None else 0.0)
                + (1.0 / (rrf_k + f_rank) if f_rank is not None else 0.0)
            )
            results.append(
                {
                    "chunk_id": chunk.id,
                    "lecture_id": chunk.lecture_id,
                    "chunk_index": chunk.chunk_index,
                    "start_time_seconds": float(chunk.start_time_seconds),
                    "end_time_seconds": float(chunk.end_time_seconds),
                    "start_timestamp_display": chunk.start_timestamp_display,
                    "end_timestamp_display": chunk.end_timestamp_display,
                    "speaker_label": chunk.speaker_label,
                    "content": chunk.content,
                    "prev_chunk_id": chunk.prev_chunk_id,
                    "next_chunk_id": chunk.next_chunk_id,
                    "dense_score": float(dense_scores.get(cid, 0.0)),
                    "lexical_rank": l_rank,
                    "fuzzy_rank": f_rank,
                    "rrf_total_score": float(rrf_total),
                    "lexical_weights": dict(chunk.lexical_weights),
                }
            )

        results.sort(key=lambda row: (-row["rrf_total_score"], -row["dense_score"], row["chunk_index"]))
        return results[:top_k]

    def get_expanded_context(self, chunk_id: UUID) -> list[dict]:
        """Returns PREVIOUS, CURRENT, and NEXT linked chunks for context expansion."""
        current = self._by_id.get(chunk_id)
        if current is None:
            return []

        items: list[dict] = []
        if current.prev_chunk_id and current.prev_chunk_id in self._by_id:
            items.append(_format_context_item("PREVIOUS", self._by_id[current.prev_chunk_id]))
        items.append(_format_context_item("CURRENT", current))
        if current.next_chunk_id and current.next_chunk_id in self._by_id:
            items.append(_format_context_item("NEXT", self._by_id[current.next_chunk_id]))
        return items


class PostgresPgVectorChunkStore:
    """
    Production PostgreSQL + pgvector adapter targeting rag.lecture_chunks,
    rag.search_vietnamese_rag_rrf, and rag.get_expanded_context.
    Gracefully handles missing psycopg2 or unreachable DB when probed.
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 5432,
        dbname: str = "lecturelens_db",
        user: str = "ll_admin",
        password: str = "ll_secure_password_2026",
        connect_timeout: int = 3,
        connection_factory: Callable[[], Any] | None = None,
        json_adapter: Callable[[Any], Any] | None = None,
        values_executor: Callable[[Any, str, list[tuple], str | None], None] | None = None,
    ) -> None:
        self.host = host
        self.port = port
        self.dbname = dbname
        self.user = user
        self.password = password
        self.connect_timeout = connect_timeout
        self._connection_factory = connection_factory
        self._json_adapter = json_adapter
        self._values_executor = values_executor

    def _open_connection(self) -> Any:
        if self._connection_factory is not None:
            return self._connection_factory()
        import psycopg2

        return psycopg2.connect(
            host=self.host,
            port=self.port,
            dbname=self.dbname,
            user=self.user,
            password=self.password,
            connect_timeout=self.connect_timeout,
        )

    @contextmanager
    def _transaction(self) -> Iterator[tuple[Any, Any]]:
        conn = self._open_connection()
        cur = conn.cursor()
        try:
            yield conn, cur
            conn.commit()
        except Exception:
            try:
                conn.rollback()
            except Exception:
                pass
            raise
        finally:
            try:
                cur.close()
            finally:
                conn.close()

    def _wrap_json(self, value: dict) -> Any:
        if self._json_adapter is not None:
            return self._json_adapter(value)
        from psycopg2.extras import Json

        return Json(value)

    def _execute_values(self, cur: Any, sql: str, rows: list[tuple], template: str) -> None:
        if self._values_executor is not None:
            self._values_executor(cur, sql, rows, template)
            return
        from psycopg2.extras import execute_values

        execute_values(cur, sql, rows, template=template)

    def is_postgres_connected(self) -> bool:
        """Probes PostgreSQL connectivity without raising on missing driver or offline DB."""
        try:
            with self._transaction() as (_, cur):
                cur.execute("SELECT 1")
                row = cur.fetchone()
                return bool(row and row[0] == 1)
        except Exception:
            return False

    def save_lecture_chunks(self, lecture_id: UUID, chunks: list[LectureChunkSchema]) -> int:
        """
        Atomically replaces all chunks for lecture_id inside a single transaction
        using execute_values with ::halfvec(1024) and JSONB adapters.
        """
        ordered = sorted(chunks, key=lambda c: c.chunk_index)
        insert_sql = (
            "INSERT INTO rag.lecture_chunks ("
            "id, lecture_id, chunk_index, start_time_seconds, end_time_seconds, "
            "speaker_label, content, token_count, embedding_half, lexical_weights, "
            "prev_chunk_id, next_chunk_id, metadata"
            ") VALUES %s"
        )
        template = (
            "(%s::uuid, %s::uuid, %s, %s, %s, %s, %s, %s, "
            "%s::halfvec(1024), %s::jsonb, %s::uuid, %s::uuid, %s::jsonb)"
        )
        rows = [
            (
                str(chunk.id),
                str(lecture_id),
                chunk.chunk_index,
                chunk.start_time_seconds,
                chunk.end_time_seconds,
                chunk.speaker_label,
                chunk.content,
                chunk.token_count,
                _format_halfvec(chunk.embedding_half),
                self._wrap_json(chunk.lexical_weights),
                str(chunk.prev_chunk_id) if chunk.prev_chunk_id else None,
                str(chunk.next_chunk_id) if chunk.next_chunk_id else None,
                self._wrap_json(chunk.metadata),
            )
            for chunk in ordered
        ]

        with self._transaction() as (_, cur):
            cur.execute("DELETE FROM rag.lecture_chunks WHERE lecture_id = %s", (str(lecture_id),))
            if rows:
                self._execute_values(cur, insert_sql, rows, template)
        return len(ordered)

    def get_lecture_chunks(self, lecture_id: UUID) -> list[LectureChunkSchema]:
        """Fetches stored chunks for lecture_id ordered by chunk_index."""
        select_sql = (
            "SELECT id, lecture_id, chunk_index, start_time_seconds, end_time_seconds, "
            "start_timestamp_display, end_timestamp_display, speaker_label, content, "
            "token_count, embedding_half::text, lexical_weights, prev_chunk_id, next_chunk_id, metadata "
            "FROM rag.lecture_chunks WHERE lecture_id = %s ORDER BY chunk_index ASC"
        )
        with self._transaction() as (_, cur):
            cur.execute(select_sql, (str(lecture_id),))
            rows = cur.fetchall()

        return [
            LectureChunkSchema(
                id=_to_uuid(row[0]),  # type: ignore[arg-type]
                lecture_id=_to_uuid(row[1]),  # type: ignore[arg-type]
                chunk_index=int(row[2]),
                start_time_seconds=float(row[3]),
                end_time_seconds=float(row[4]),
                start_timestamp_display=str(row[5]),
                end_timestamp_display=str(row[6]),
                speaker_label=str(row[7] or "LECTURER"),
                content=str(row[8]),
                token_count=int(row[9]),
                embedding_half=_parse_halfvec(row[10]),
                lexical_weights={str(k): float(v) for k, v in _to_dict(row[11]).items()},
                prev_chunk_id=_to_uuid(row[12]),
                next_chunk_id=_to_uuid(row[13]),
                metadata=_to_dict(row[14]),
            )
            for row in rows
        ]

    def search_hybrid_rrf(
        self,
        lecture_ids: list[UUID],
        query_embedding: list[float],
        query_text: str,
        top_k: int = 25,
        rrf_k: int = 60,
    ) -> list[dict]:
        """Executes rag.search_vietnamese_rag_rrf on PostgreSQL pgvector."""
        if not lecture_ids or top_k <= 0:
            return []

        sql = (
            "SELECT r.chunk_id, r.lecture_id, r.chunk_index, r.start_time_seconds, r.end_time_seconds, "
            "r.start_timestamp_display, r.end_timestamp_display, r.speaker_label, r.content, "
            "r.prev_chunk_id, r.next_chunk_id, r.dense_score, r.lexical_rank, r.fuzzy_rank, "
            "r.rrf_total_score, c.lexical_weights "
            "FROM rag.search_vietnamese_rag_rrf(%s::uuid[], %s::halfvec(1024), %s, %s, %s) AS r "
            "JOIN rag.lecture_chunks c ON c.id = r.chunk_id "
            "ORDER BY r.rrf_total_score DESC, r.chunk_index ASC"
        )
        params = (
            [str(lid) for lid in lecture_ids],
            _format_halfvec(query_embedding),
            query_text,
            top_k,
            rrf_k,
        )
        with self._transaction() as (_, cur):
            cur.execute(sql, params)
            rows = cur.fetchall()

        return [
            {
                "chunk_id": _to_uuid(row[0]),
                "lecture_id": _to_uuid(row[1]),
                "chunk_index": int(row[2]),
                "start_time_seconds": float(row[3]),
                "end_time_seconds": float(row[4]),
                "start_timestamp_display": str(row[5]),
                "end_timestamp_display": str(row[6]),
                "speaker_label": str(row[7] or "LECTURER"),
                "content": str(row[8]),
                "prev_chunk_id": _to_uuid(row[9]),
                "next_chunk_id": _to_uuid(row[10]),
                "dense_score": float(row[11] or 0.0),
                "lexical_rank": int(row[12]) if row[12] is not None else None,
                "fuzzy_rank": int(row[13]) if row[13] is not None else None,
                "rrf_total_score": float(row[14] or 0.0),
                "lexical_weights": {str(k): float(v) for k, v in _to_dict(row[15]).items()},
            }
            for row in rows
        ]

    def get_expanded_context(self, chunk_id: UUID) -> list[dict]:
        """Executes rag.get_expanded_context(chunk_id) on PostgreSQL."""
        sql = (
            "SELECT position, chunk_id, start_timestamp_display, end_timestamp_display, "
            "speaker_label, content FROM rag.get_expanded_context(%s::uuid)"
        )
        with self._transaction() as (_, cur):
            cur.execute(sql, (str(chunk_id),))
            rows = cur.fetchall()

        return [
            {
                "position": str(row[0]),
                "chunk_id": _to_uuid(row[1]),
                "start_timestamp_display": str(row[2]),
                "end_timestamp_display": str(row[3]),
                "speaker_label": str(row[4] or "LECTURER"),
                "content": str(row[5]),
            }
            for row in rows
        ]


class CompositeChunkStore:
    """
    Composite store writing to InMemoryChunkStore always and syncing to
    PostgresPgVectorChunkStore when enabled and reachable.
    """

    def __init__(
        self,
        memory_store: InMemoryChunkStore | None = None,
        postgres_store: PostgresPgVectorChunkStore | None = None,
        enable_pgvector: bool = True,
        strict_db: bool = False,
    ) -> None:
        self.memory_store = memory_store or InMemoryChunkStore()
        self.postgres_store = postgres_store
        self.enable_pgvector = enable_pgvector
        self.strict_db = strict_db
        self.last_db_synced: bool = False
        self._lecture_db_synced: dict[UUID, bool] = {}

    def is_postgres_connected(self) -> bool:
        if not self.enable_pgvector or self.postgres_store is None:
            return False
        return self.postgres_store.is_postgres_connected()

    def is_lecture_synced(self, lecture_id: UUID) -> bool:
        return self._lecture_db_synced.get(lecture_id, False)

    def save_lecture_chunks(
        self,
        lecture_id: UUID,
        chunks: list[LectureChunkSchema],
        *,
        sync_to_db: bool = True,
    ) -> int:
        """
        Persists chunks into InMemoryChunkStore and attempts Postgres sync if enabled.
        Sets last_db_synced without crashing offline mode unless strict_db=True.
        """
        count = self.memory_store.save_lecture_chunks(lecture_id, chunks)
        synced = False

        if sync_to_db and self.enable_pgvector and self.postgres_store is not None:
            try:
                self.postgres_store.save_lecture_chunks(lecture_id, chunks)
                synced = True
            except Exception as exc:
                if self.strict_db:
                    raise
                logger.warning(
                    "PgVector sync unavailable for lecture %s; staying on in-memory store (%s)",
                    lecture_id,
                    exc,
                )

        self.last_db_synced = synced
        self._lecture_db_synced[lecture_id] = synced
        return count

    def get_lecture_chunks(self, lecture_id: UUID) -> list[LectureChunkSchema]:
        if self.enable_pgvector and self.postgres_store is not None and self.postgres_store.is_postgres_connected():
            try:
                pg_chunks = self.postgres_store.get_lecture_chunks(lecture_id)
                if pg_chunks or self._lecture_db_synced.get(lecture_id, False):
                    return pg_chunks
            except Exception as exc:
                if self.strict_db:
                    raise
                logger.warning("Falling back to InMemoryChunkStore for get_lecture_chunks: %s", exc)
        return self.memory_store.get_lecture_chunks(lecture_id)

    def search_hybrid_rrf(
        self,
        lecture_ids: list[UUID],
        query_embedding: list[float],
        query_text: str,
        top_k: int = 25,
        rrf_k: int = 60,
    ) -> list[dict]:
        if self.enable_pgvector and self.postgres_store is not None and self.postgres_store.is_postgres_connected():
            try:
                pg_results = self.postgres_store.search_hybrid_rrf(
                    lecture_ids=lecture_ids,
                    query_embedding=query_embedding,
                    query_text=query_text,
                    top_k=top_k,
                    rrf_k=rrf_k,
                )
                if pg_results or all(self._lecture_db_synced.get(lid, False) for lid in lecture_ids):
                    return pg_results
            except Exception as exc:
                if self.strict_db:
                    raise
                logger.warning("Falling back to InMemoryChunkStore for search_hybrid_rrf: %s", exc)
        return self.memory_store.search_hybrid_rrf(
            lecture_ids=lecture_ids,
            query_embedding=query_embedding,
            query_text=query_text,
            top_k=top_k,
            rrf_k=rrf_k,
        )

    def get_expanded_context(self, chunk_id: UUID) -> list[dict]:
        if self.enable_pgvector and self.postgres_store is not None and self.postgres_store.is_postgres_connected():
            try:
                pg_ctx = self.postgres_store.get_expanded_context(chunk_id)
                if pg_ctx:
                    return pg_ctx
            except Exception as exc:
                if self.strict_db:
                    raise
                logger.warning("Falling back to InMemoryChunkStore for get_expanded_context: %s", exc)
        return self.memory_store.get_expanded_context(chunk_id)
