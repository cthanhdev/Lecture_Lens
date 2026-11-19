"""
RAG Telemetry Deep Module (Audit Logs only; Semantic Query Cache removed).
Targets `rag.rag_audit_logs` defined in `backend/db/init/05_rag_telemetry_cache.sql`,
with an InMemory fallback adapter.
"""
from collections.abc import Callable
from contextlib import contextmanager
from datetime import datetime, timezone
import logging
from typing import Any, Protocol, runtime_checkable
from uuid import UUID, uuid4

from ai_service.core.chunk_store import _to_uuid

logger = logging.getLogger("ai_service.telemetry_store")


@runtime_checkable
class TelemetryStoreProtocol(Protocol):
    """Seam for RAG latency & retrieval audit logging (`rag.rag_audit_logs`)."""

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

    def list_audit_logs(self, lecture_id: UUID | None = None, limit: int = 50) -> list[dict]: ...


class InMemoryTelemetryStore:
    """In-memory adapter mirroring `rag.rag_audit_logs`."""

    def __init__(self) -> None:
        self._audits: list[dict] = []

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
    """PostgreSQL adapter targeting `rag.rag_audit_logs` (`05_rag_telemetry_cache.sql`)."""

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

    def list_audit_logs(self, lecture_id: UUID | None = None, limit: int = 50) -> list[dict]:
        if self._pg_ready():
            try:
                assert self.postgres_store is not None
                return self.postgres_store.list_audit_logs(lecture_id=lecture_id, limit=limit)
            except Exception as exc:
                logger.warning("Falling back to InMemoryTelemetryStore for list_audit_logs: %s", exc)
        return self.memory_store.list_audit_logs(lecture_id=lecture_id, limit=limit)
