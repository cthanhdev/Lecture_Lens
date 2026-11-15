"""
RAG Telemetry & Semantic Query Cache Deep Module ([Q1] + Audit Logs).
Targets `rag.semantic_query_cache` and `rag.rag_audit_logs` defined in
`backend/db/init/05_rag_telemetry_cache.sql`, with an InMemory fallback adapter.
"""
from collections.abc import Callable
from contextlib import contextmanager
from datetime import datetime, timezone
import json
import logging
from typing import Any, Protocol, runtime_checkable
from uuid import UUID, uuid4

from ai_service.core.chunk_store import _cosine_similarity, _format_halfvec, _to_dict, _to_uuid

logger = logging.getLogger("ai_service.telemetry_store")


@runtime_checkable
class TelemetryStoreProtocol(Protocol):
    """Seam for [Q1] Semantic Query Cache and RAG audit logging."""

    def lookup_semantic_cache(
        self,
        lecture_ids: list[UUID],
        query_embedding: list[float],
        prompt_hash: str,
        similarity_threshold: float = 0.95,
    ) -> dict | None: ...

    def save_semantic_cache(
        self,
        lecture_ids: list[UUID],
        query_text: str,
        query_embedding: list[float],
        prompt_hash: str,
        answer: str,
        draft_answer: str,
        stage_outputs: list[dict],
        citations: list[dict],
    ) -> UUID: ...

    def log_rag_audit(
        self,
        lecture_id: UUID,
        query_text: str,
        top_chunk_ids: list[UUID],
        rerank_scores: list[float],
        latency_retrieval_ms: int,
        latency_rerank_ms: int,
        latency_llm_ms: int,
    ) -> UUID: ...

    def list_cache_entries(self, lecture_id: UUID | None = None, limit: int = 50) -> list[dict]: ...

    def clear_cache(self, lecture_id: UUID | None = None) -> int: ...

    def list_audit_logs(self, lecture_id: UUID | None = None, limit: int = 50) -> list[dict]: ...


def _sorted_lecture_strs(lecture_ids: list[UUID]) -> list[str]:
    return sorted({str(lid) for lid in lecture_ids})


def _pack_cache_metadata(
    *,
    prompt_hash: str,
    lecture_ids: list[UUID],
    draft_answer: str,
    stage_outputs: list[dict],
    citations: list[dict],
) -> dict:
    return {
        "prompt_hash": prompt_hash,
        "lecture_ids": _sorted_lecture_strs(lecture_ids),
        "draft_answer": draft_answer,
        "stage_outputs": stage_outputs,
        "citations": citations,
    }


class InMemoryTelemetryStore:
    """In-memory adapter mirroring rag.semantic_query_cache and rag.rag_audit_logs."""

    def __init__(self) -> None:
        self._cache: list[dict] = []
        self._audits: list[dict] = []

    def lookup_semantic_cache(
        self,
        lecture_ids: list[UUID],
        query_embedding: list[float],
        prompt_hash: str,
        similarity_threshold: float = 0.95,
    ) -> dict | None:
        if not lecture_ids or not query_embedding:
            return None

        target_lectures = _sorted_lecture_strs(lecture_ids)
        best_entry: dict | None = None
        best_sim = -1.0

        for entry in self._cache:
            if entry["prompt_hash"] != prompt_hash:
                continue
            if entry["lecture_ids"] != target_lectures:
                continue
            sim = _cosine_similarity(entry["query_embedding"], query_embedding)
            if sim >= similarity_threshold and sim > best_sim:
                best_sim = sim
                best_entry = entry

        if best_entry is None:
            return None

        best_entry["hit_count"] += 1
        best_entry["last_hit_at"] = datetime.now(timezone.utc).isoformat()
        return {
            "cache_id": best_entry["id"],
            "query_text": best_entry["query_text"],
            "answer": best_entry["cached_answer"],
            "draft_answer": best_entry["draft_answer"],
            "stage_outputs": list(best_entry["stage_outputs"]),
            "citations": list(best_entry["citations"]),
            "similarity": round(float(best_sim), 6),
            "hit_count": best_entry["hit_count"],
        }

    def save_semantic_cache(
        self,
        lecture_ids: list[UUID],
        query_text: str,
        query_embedding: list[float],
        prompt_hash: str,
        answer: str,
        draft_answer: str,
        stage_outputs: list[dict],
        citations: list[dict],
    ) -> UUID:
        entry_id = uuid4()
        now_iso = datetime.now(timezone.utc).isoformat()
        self._cache.append(
            {
                "id": entry_id,
                "lecture_id": lecture_ids[0],
                "lecture_ids": _sorted_lecture_strs(lecture_ids),
                "prompt_hash": prompt_hash,
                "query_text": query_text,
                "query_embedding": list(query_embedding),
                "cached_answer": answer,
                "draft_answer": draft_answer,
                "stage_outputs": list(stage_outputs),
                "citations": list(citations),
                "hit_count": 1,
                "created_at": now_iso,
                "last_hit_at": now_iso,
            }
        )
        return entry_id

    def log_rag_audit(
        self,
        lecture_id: UUID,
        query_text: str,
        top_chunk_ids: list[UUID],
        rerank_scores: list[float],
        latency_retrieval_ms: int,
        latency_rerank_ms: int,
        latency_llm_ms: int,
    ) -> UUID:
        audit_id = uuid4()
        self._audits.append(
            {
                "id": audit_id,
                "lecture_id": lecture_id,
                "query_text": query_text,
                "top_chunks_retrieved": [str(cid) for cid in top_chunk_ids],
                "rerank_scores": [float(s) for s in rerank_scores],
                "latency_retrieval_ms": int(latency_retrieval_ms),
                "latency_rerank_ms": int(latency_rerank_ms),
                "latency_llm_ms": int(latency_llm_ms),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        return audit_id

    def list_cache_entries(self, lecture_id: UUID | None = None, limit: int = 50) -> list[dict]:
        rows = self._cache
        if lecture_id is not None:
            lid_str = str(lecture_id)
            rows = [r for r in rows if lid_str in r["lecture_ids"]]
        ordered = sorted(rows, key=lambda r: r["last_hit_at"], reverse=True)[:limit]
        return [
            {
                "id": str(r["id"]),
                "lecture_id": str(r["lecture_id"]),
                "query_text": r["query_text"],
                "prompt_hash": r["prompt_hash"],
                "cached_answer": r["cached_answer"],
                "hit_count": r["hit_count"],
                "created_at": r["created_at"],
                "last_hit_at": r["last_hit_at"],
            }
            for r in ordered
        ]

    def clear_cache(self, lecture_id: UUID | None = None) -> int:
        if lecture_id is None:
            removed = len(self._cache)
            self._cache.clear()
            return removed
        lid_str = str(lecture_id)
        before = len(self._cache)
        self._cache = [r for r in self._cache if lid_str not in r["lecture_ids"]]
        return before - len(self._cache)

    def list_audit_logs(self, lecture_id: UUID | None = None, limit: int = 50) -> list[dict]:
        rows = self._audits
        if lecture_id is not None:
            rows = [r for r in rows if r["lecture_id"] == lecture_id]
        ordered = sorted(rows, key=lambda r: r["created_at"], reverse=True)[:limit]
        return [
            {
                **r,
                "id": str(r["id"]),
                "lecture_id": str(r["lecture_id"]),
            }
            for r in ordered
        ]


class PostgresTelemetryStore:
    """
    PostgreSQL + pgvector adapter targeting `rag.semantic_query_cache` and `rag.rag_audit_logs`.
    Stores `prompt_hash`, `draft_answer`, and `stage_outputs` inside `cached_citations` JSONB
    for 100% compatibility with existing SQL DDL (`05_rag_telemetry_cache.sql`).
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
    ) -> None:
        self.host = host
        self.port = port
        self.dbname = dbname
        self.user = user
        self.password = password
        self.connect_timeout = connect_timeout
        self._connection_factory = connection_factory

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
    def _transaction(self):
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

    @staticmethod
    def _wrap_json(value: Any) -> Any:
        from psycopg2.extras import Json

        return Json(value)

    def lookup_semantic_cache(
        self,
        lecture_ids: list[UUID],
        query_embedding: list[float],
        prompt_hash: str,
        similarity_threshold: float = 0.95,
    ) -> dict | None:
        if not lecture_ids or not query_embedding:
            return None

        target_lectures = _sorted_lecture_strs(lecture_ids)
        primary_lecture_id = target_lectures[0]
        vec_lit = _format_halfvec(query_embedding)

        select_sql = (
            "SELECT id, query_text, cached_answer, cached_citations, hit_count, "
            "1 - (query_embedding_half <=> %s::halfvec(1024)) AS similarity "
            "FROM rag.semantic_query_cache "
            "WHERE lecture_id = %s::uuid "
            "AND (cached_citations->>'prompt_hash') = %s "
            "ORDER BY query_embedding_half <=> %s::halfvec(1024) ASC "
            "LIMIT 10"
        )
        with self._transaction() as (_, cur):
            cur.execute(select_sql, (vec_lit, primary_lecture_id, prompt_hash, vec_lit))
            rows = cur.fetchall()
            for row in rows:
                cache_id, q_text, cached_answer, raw_meta, hit_count, sim = row
                if sim is None or float(sim) < similarity_threshold:
                    continue
                meta = _to_dict(raw_meta)
                cached_lectures = sorted(str(x) for x in meta.get("lecture_ids", [primary_lecture_id]))
                if cached_lectures != target_lectures:
                    continue
                cur.execute(
                    "UPDATE rag.semantic_query_cache "
                    "SET hit_count = hit_count + 1, last_hit_at = CURRENT_TIMESTAMP "
                    "WHERE id = %s::uuid",
                    (str(cache_id),),
                )
                return {
                    "cache_id": _to_uuid(cache_id),
                    "query_text": str(q_text),
                    "answer": str(cached_answer),
                    "draft_answer": str(meta.get("draft_answer", "")),
                    "stage_outputs": list(meta.get("stage_outputs", [])),
                    "citations": list(meta.get("citations", [])),
                    "similarity": round(float(sim), 6),
                    "hit_count": int(hit_count or 1) + 1,
                }
        return None

    def save_semantic_cache(
        self,
        lecture_ids: list[UUID],
        query_text: str,
        query_embedding: list[float],
        prompt_hash: str,
        answer: str,
        draft_answer: str,
        stage_outputs: list[dict],
        citations: list[dict],
    ) -> UUID:
        target_lectures = _sorted_lecture_strs(lecture_ids)
        primary_lecture_id = target_lectures[0]
        packed_meta = _pack_cache_metadata(
            prompt_hash=prompt_hash,
            lecture_ids=lecture_ids,
            draft_answer=draft_answer,
            stage_outputs=stage_outputs,
            citations=citations,
        )
        insert_sql = (
            "INSERT INTO rag.semantic_query_cache "
            "(lecture_id, query_text, query_embedding_half, cached_answer, cached_citations) "
            "VALUES (%s::uuid, %s, %s::halfvec(1024), %s, %s::jsonb) "
            "RETURNING id"
        )
        with self._transaction() as (_, cur):
            cur.execute(
                insert_sql,
                (
                    primary_lecture_id,
                    query_text,
                    _format_halfvec(query_embedding),
                    answer,
                    json.dumps(packed_meta, ensure_ascii=False),
                ),
            )
            row = cur.fetchone()
            return _to_uuid(row[0]) or uuid4()

    def log_rag_audit(
        self,
        lecture_id: UUID,
        query_text: str,
        top_chunk_ids: list[UUID],
        rerank_scores: list[float],
        latency_retrieval_ms: int,
        latency_rerank_ms: int,
        latency_llm_ms: int,
    ) -> UUID:
        insert_sql = (
            "INSERT INTO rag.rag_audit_logs "
            "(lecture_id, query_text, top_chunks_retrieved, rerank_scores, "
            "latency_retrieval_ms, latency_rerank_ms, latency_llm_ms) "
            "VALUES (%s::uuid, %s, %s::uuid[], %s::float[], %s, %s, %s) "
            "RETURNING id"
        )
        with self._transaction() as (_, cur):
            cur.execute(
                insert_sql,
                (
                    str(lecture_id),
                    query_text,
                    [str(cid) for cid in top_chunk_ids],
                    [float(score) for score in rerank_scores],
                    int(latency_retrieval_ms),
                    int(latency_rerank_ms),
                    int(latency_llm_ms),
                ),
            )
            row = cur.fetchone()
            return _to_uuid(row[0]) or uuid4()

    def list_cache_entries(self, lecture_id: UUID | None = None, limit: int = 50) -> list[dict]:
        if lecture_id is not None:
            where = "WHERE (lecture_id = %s::uuid OR (cached_citations->'lecture_ids') @> %s::jsonb) "
            params: tuple = (str(lecture_id), json.dumps([str(lecture_id)]), limit)
        else:
            where = ""
            params = (limit,)
        sql = (
            "SELECT id, lecture_id, query_text, cached_answer, cached_citations, "
            "hit_count, created_at, last_hit_at "
            f"FROM rag.semantic_query_cache {where}"
            "ORDER BY last_hit_at DESC LIMIT %s"
        )
        with self._transaction() as (_, cur):
            cur.execute(sql, params)
            rows = cur.fetchall()
        entries = []
        for row in rows:
            meta = _to_dict(row[4])
            entries.append(
                {
                    "id": str(row[0]),
                    "lecture_id": str(row[1]),
                    "query_text": str(row[2]),
                    "prompt_hash": str(meta.get("prompt_hash", "")),
                    "cached_answer": str(row[3]),
                    "hit_count": int(row[5] or 1),
                    "created_at": row[6].isoformat() if hasattr(row[6], "isoformat") else str(row[6]),
                    "last_hit_at": row[7].isoformat() if hasattr(row[7], "isoformat") else str(row[7]),
                }
            )
        return entries

    def clear_cache(self, lecture_id: UUID | None = None) -> int:
        with self._transaction() as (_, cur):
            if lecture_id is not None:
                cur.execute(
                    "DELETE FROM rag.semantic_query_cache "
                    "WHERE lecture_id = %s::uuid OR (cached_citations->'lecture_ids') @> %s::jsonb",
                    (str(lecture_id), json.dumps([str(lecture_id)])),
                )
            else:
                cur.execute("DELETE FROM rag.semantic_query_cache")
            return int(cur.rowcount or 0)

    def list_audit_logs(self, lecture_id: UUID | None = None, limit: int = 50) -> list[dict]:
        where = "WHERE lecture_id = %s::uuid " if lecture_id is not None else ""
        sql = (
            "SELECT id, lecture_id, query_text, top_chunks_retrieved, rerank_scores, "
            "latency_retrieval_ms, latency_rerank_ms, latency_llm_ms, created_at "
            f"FROM rag.rag_audit_logs {where}"
            "ORDER BY created_at DESC LIMIT %s"
        )
        params: tuple = (str(lecture_id), limit) if lecture_id is not None else (limit,)
        with self._transaction() as (_, cur):
            cur.execute(sql, params)
            rows = cur.fetchall()
        return [
            {
                "id": str(row[0]),
                "lecture_id": str(row[1]),
                "query_text": str(row[2]),
                "top_chunks_retrieved": [str(x) for x in (row[3] or [])],
                "rerank_scores": [float(x) for x in (row[4] or [])],
                "latency_retrieval_ms": row[5],
                "latency_rerank_ms": row[6],
                "latency_llm_ms": row[7],
                "created_at": row[8].isoformat() if hasattr(row[8], "isoformat") else str(row[8]),
            }
            for row in rows
        ]


class CompositeTelemetryStore:
    """
    Uses PostgresTelemetryStore when PostgreSQL is reachable and falls back transparently
    to InMemoryTelemetryStore in offline / unit-test environments.
    """

    def __init__(
        self,
        memory_store: InMemoryTelemetryStore | None = None,
        postgres_store: PostgresTelemetryStore | None = None,
        enable_pgvector: bool = True,
    ) -> None:
        self.memory_store = memory_store or InMemoryTelemetryStore()
        self.postgres_store = postgres_store
        self.enable_pgvector = enable_pgvector

    def _pg_ready(self) -> bool:
        if not self.enable_pgvector or self.postgres_store is None:
            return False
        try:
            with self.postgres_store._transaction() as (_, cur):
                cur.execute("SELECT 1")
                row = cur.fetchone()
                return bool(row and row[0] == 1)
        except Exception:
            return False

    def lookup_semantic_cache(
        self,
        lecture_ids: list[UUID],
        query_embedding: list[float],
        prompt_hash: str,
        similarity_threshold: float = 0.95,
    ) -> dict | None:
        if self._pg_ready():
            try:
                assert self.postgres_store is not None
                hit = self.postgres_store.lookup_semantic_cache(
                    lecture_ids=lecture_ids,
                    query_embedding=query_embedding,
                    prompt_hash=prompt_hash,
                    similarity_threshold=similarity_threshold,
                )
                if hit is not None:
                    return hit
            except Exception as exc:
                logger.warning("Falling back to InMemoryTelemetryStore for cache lookup: %s", exc)
        return self.memory_store.lookup_semantic_cache(
            lecture_ids=lecture_ids,
            query_embedding=query_embedding,
            prompt_hash=prompt_hash,
            similarity_threshold=similarity_threshold,
        )

    def save_semantic_cache(
        self,
        lecture_ids: list[UUID],
        query_text: str,
        query_embedding: list[float],
        prompt_hash: str,
        answer: str,
        draft_answer: str,
        stage_outputs: list[dict],
        citations: list[dict],
    ) -> UUID:
        mem_id = self.memory_store.save_semantic_cache(
            lecture_ids=lecture_ids,
            query_text=query_text,
            query_embedding=query_embedding,
            prompt_hash=prompt_hash,
            answer=answer,
            draft_answer=draft_answer,
            stage_outputs=stage_outputs,
            citations=citations,
        )
        if self._pg_ready():
            try:
                assert self.postgres_store is not None
                return self.postgres_store.save_semantic_cache(
                    lecture_ids=lecture_ids,
                    query_text=query_text,
                    query_embedding=query_embedding,
                    prompt_hash=prompt_hash,
                    answer=answer,
                    draft_answer=draft_answer,
                    stage_outputs=stage_outputs,
                    citations=citations,
                )
            except Exception as exc:
                logger.warning("Postgres semantic cache save failed; kept in memory (%s)", exc)
        return mem_id

    def log_rag_audit(
        self,
        lecture_id: UUID,
        query_text: str,
        top_chunk_ids: list[UUID],
        rerank_scores: list[float],
        latency_retrieval_ms: int,
        latency_rerank_ms: int,
        latency_llm_ms: int,
    ) -> UUID:
        mem_id = self.memory_store.log_rag_audit(
            lecture_id=lecture_id,
            query_text=query_text,
            top_chunk_ids=top_chunk_ids,
            rerank_scores=rerank_scores,
            latency_retrieval_ms=latency_retrieval_ms,
            latency_rerank_ms=latency_rerank_ms,
            latency_llm_ms=latency_llm_ms,
        )
        if self._pg_ready():
            try:
                assert self.postgres_store is not None
                return self.postgres_store.log_rag_audit(
                    lecture_id=lecture_id,
                    query_text=query_text,
                    top_chunk_ids=top_chunk_ids,
                    rerank_scores=rerank_scores,
                    latency_retrieval_ms=latency_retrieval_ms,
                    latency_rerank_ms=latency_rerank_ms,
                    latency_llm_ms=latency_llm_ms,
                )
            except Exception as exc:
                logger.warning("Postgres rag_audit_logs insert failed; kept in memory (%s)", exc)
        return mem_id

    def list_cache_entries(self, lecture_id: UUID | None = None, limit: int = 50) -> list[dict]:
        if self._pg_ready():
            try:
                assert self.postgres_store is not None
                return self.postgres_store.list_cache_entries(lecture_id=lecture_id, limit=limit)
            except Exception as exc:
                logger.warning("Falling back to InMemoryTelemetryStore for list_cache_entries: %s", exc)
        return self.memory_store.list_cache_entries(lecture_id=lecture_id, limit=limit)

    def clear_cache(self, lecture_id: UUID | None = None) -> int:
        cleared = self.memory_store.clear_cache(lecture_id=lecture_id)
        if self._pg_ready():
            try:
                assert self.postgres_store is not None
                cleared = max(cleared, self.postgres_store.clear_cache(lecture_id=lecture_id))
            except Exception as exc:
                logger.warning("Postgres cache clear failed: %s", exc)
        return cleared

    def list_audit_logs(self, lecture_id: UUID | None = None, limit: int = 50) -> list[dict]:
        if self._pg_ready():
            try:
                assert self.postgres_store is not None
                return self.postgres_store.list_audit_logs(lecture_id=lecture_id, limit=limit)
            except Exception as exc:
                logger.warning("Falling back to InMemoryTelemetryStore for list_audit_logs: %s", exc)
        return self.memory_store.list_audit_logs(lecture_id=lecture_id, limit=limit)
