"""
Tests for ChunkStore Deep Module (InMemory, Postgres pgvector, Composite adapters).
"""
from decimal import Decimal
import math
import uuid
import pytest

from ai_service.core.schemas import LectureChunkSchema


def _unit_vec(index: int, dim: int = 1024, extra: dict[int, float] | None = None) -> list[float]:
    vec = [0.0] * dim
    vec[index] = 1.0
    if extra:
        for k, v in extra.items():
            vec[k] = v
    norm = math.sqrt(sum(x * x for x in vec))
    return [x / norm for x in vec] if norm > 0 else vec


def _make_chunk(
    lecture_id: uuid.UUID,
    index: int,
    content: str,
    embedding: list[float],
    chunk_id: uuid.UUID | None = None,
    prev_id: uuid.UUID | None = None,
    next_id: uuid.UUID | None = None,
    lexical_weights: dict[str, float] | None = None,
) -> LectureChunkSchema:
    start_s = float(index * 10)
    end_s = float((index + 1) * 10)
    return LectureChunkSchema(
        id=chunk_id or uuid.uuid4(),
        lecture_id=lecture_id,
        chunk_index=index,
        start_time_seconds=start_s,
        end_time_seconds=end_s,
        start_timestamp_display=f"00:{int(start_s):02d}",
        end_timestamp_display=f"00:{int(end_s):02d}",
        speaker_label="LECTURER",
        content=content,
        token_count=len(content.split()),
        embedding_half=embedding,
        lexical_weights=lexical_weights or {"lecture": 0.5},
        prev_chunk_id=prev_id,
        next_chunk_id=next_id,
        metadata={"segment_ids": [index]},
    )


def test_in_memory_chunk_store_save_is_idempotent_and_ordered():
    from ai_service.core.chunk_store import InMemoryChunkStore

    store = InMemoryChunkStore()
    lecture_id = uuid.uuid4()
    other_lecture_id = uuid.uuid4()

    c1_id = uuid.uuid4()
    c0_id = uuid.uuid4()
    # Save out of order to verify ordering by chunk_index
    chunk1 = _make_chunk(lecture_id, 1, "Đoạn hai.", _unit_vec(1), chunk_id=c1_id, prev_id=c0_id)
    chunk0 = _make_chunk(lecture_id, 0, "Đoạn một.", _unit_vec(0), chunk_id=c0_id, next_id=c1_id)
    other = _make_chunk(other_lecture_id, 0, "Bài giảng khác.", _unit_vec(2))

    assert store.is_postgres_connected() is False
    assert store.save_lecture_chunks(lecture_id, [chunk1, chunk0]) == 2
    assert store.save_lecture_chunks(other_lecture_id, [other]) == 1

    retrieved = store.get_lecture_chunks(lecture_id)
    assert [c.chunk_index for c in retrieved] == [0, 1]
    assert [c.id for c in retrieved] == [c0_id, c1_id]

    # Re-saving replaces previous chunks for lecture_id without affecting other_lecture_id
    replacement = _make_chunk(lecture_id, 0, "Đoạn mới.", _unit_vec(3))
    assert store.save_lecture_chunks(lecture_id, [replacement]) == 1
    retrieved_after = store.get_lecture_chunks(lecture_id)
    assert len(retrieved_after) == 1
    assert retrieved_after[0].content == "Đoạn mới."
    assert len(store.get_lecture_chunks(other_lecture_id)) == 1


def test_in_memory_hybrid_rrf_search_vietnamese_unaccent_and_rrf_scoring():
    from ai_service.core.chunk_store import InMemoryChunkStore

    store = InMemoryChunkStore()
    lecture_a = uuid.uuid4()
    lecture_b = uuid.uuid4()

    c0 = _make_chunk(
        lecture_a,
        0,
        "Không gian vector và độc lập tuyến tính.",
        _unit_vec(0),
        lexical_weights={"không": 0.6, "vector": 0.8},
    )
    c1 = _make_chunk(
        lecture_a,
        1,
        "Thuật toán khử Gauss-Jordan giải hệ phương trình.",
        _unit_vec(1),
        lexical_weights={"gauss": 0.7},
    )
    c_other = _make_chunk(
        lecture_b,
        0,
        "Không gian vector và độc lập tuyến tính ở bài khác.",
        _unit_vec(0),
    )

    store.save_lecture_chunks(lecture_a, [c0, c1])
    store.save_lecture_chunks(lecture_b, [c_other])

    results = store.search_hybrid_rrf(
        lecture_ids=[lecture_a],
        query_embedding=_unit_vec(0),
        query_text="khong gian vector doc lap tuyen tinh",
        top_k=10,
        rrf_k=60,
    )

    assert len(results) == 2
    assert all(r["lecture_id"] == lecture_a for r in results)

    top = results[0]
    assert top["chunk_id"] == c0.id
    assert top["dense_score"] == pytest.approx(1.0, abs=1e-4)
    assert top["lexical_rank"] == 1
    assert top["fuzzy_rank"] == 1
    expected_rrf = 1.0 / 61.0 + 1.0 / 61.0 + 1.0 / 61.0
    assert top["rrf_total_score"] == pytest.approx(expected_rrf, abs=1e-6)
    assert top["lexical_weights"] == {"không": 0.6, "vector": 0.8}

    # Typo query should still be captured by trigram fuzzy stream even when lexical AND misses
    typo_results = store.search_hybrid_rrf(
        lecture_ids=[lecture_a],
        query_embedding=_unit_vec(5),  # orthogonal to both chunks
        query_text="khong gian vecto doc lap tuyen tin",
        top_k=10,
        rrf_k=60,
    )
    assert typo_results[0]["chunk_id"] == c0.id
    assert typo_results[0]["lexical_rank"] is None
    assert typo_results[0]["fuzzy_rank"] == 1

    assert store.search_hybrid_rrf([], _unit_vec(0), "vector") == []


def test_in_memory_get_expanded_context_prev_current_next():
    from ai_service.core.chunk_store import InMemoryChunkStore

    store = InMemoryChunkStore()
    lecture_id = uuid.uuid4()
    id0, id1, id2 = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()

    c0 = _make_chunk(lecture_id, 0, "Đoạn đầu.", _unit_vec(0), chunk_id=id0, prev_id=None, next_id=id1)
    c1 = _make_chunk(lecture_id, 1, "Đoạn giữa.", _unit_vec(1), chunk_id=id1, prev_id=id0, next_id=id2)
    c2 = _make_chunk(lecture_id, 2, "Đoạn cuối.", _unit_vec(2), chunk_id=id2, prev_id=id1, next_id=None)
    store.save_lecture_chunks(lecture_id, [c0, c1, c2])

    mid_ctx = store.get_expanded_context(id1)
    assert [item["position"] for item in mid_ctx] == ["PREVIOUS", "CURRENT", "NEXT"]
    assert [item["chunk_id"] for item in mid_ctx] == [id0, id1, id2]

    first_ctx = store.get_expanded_context(id0)
    assert [item["position"] for item in first_ctx] == ["CURRENT", "NEXT"]

    last_ctx = store.get_expanded_context(id2)
    assert [item["position"] for item in last_ctx] == ["PREVIOUS", "CURRENT"]

    assert store.get_expanded_context(uuid.uuid4()) == []


class _FakeCursor:
    def __init__(self, query_handler):
        self._query_handler = query_handler
        self._rows = []
        self.executed: list[tuple[str, object]] = []
        self.closed = False

    def execute(self, sql, params=None):
        self.executed.append((sql, params))
        self._rows = self._query_handler(sql, params) or []

    def fetchall(self):
        return list(self._rows)

    def fetchone(self):
        return self._rows[0] if self._rows else None

    def close(self):
        self.closed = True


class _FakeConnection:
    def __init__(self, query_handler):
        self.cursor_obj = _FakeCursor(query_handler)
        self.committed = False
        self.rolled_back = False
        self.closed = False

    def cursor(self):
        return self.cursor_obj

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        self.closed = True


def test_postgres_chunk_store_handles_unavailable_db_gracefully():
    from ai_service.core.chunk_store import PostgresPgVectorChunkStore

    def failing_factory():
        raise ConnectionError("Postgres connection refused")

    store = PostgresPgVectorChunkStore(connection_factory=failing_factory)
    assert store.is_postgres_connected() is False

    # Also verifies default factory without psycopg2/running DB does not crash
    default_store = PostgresPgVectorChunkStore(host="127.0.0.1", port=59999, connect_timeout=1)
    assert default_store.is_postgres_connected() is False


def test_postgres_chunk_store_save_get_search_and_context():
    from ai_service.core.chunk_store import PostgresPgVectorChunkStore

    lecture_id = uuid.uuid4()
    c0_id = uuid.uuid4()
    c1_id = uuid.uuid4()
    vec0 = _unit_vec(0)
    vec1 = _unit_vec(1)
    chunk0 = _make_chunk(lecture_id, 0, "Khái niệm vector.", vec0, chunk_id=c0_id, next_id=c1_id)
    chunk1 = _make_chunk(lecture_id, 1, "Cơ sở trực chuẩn.", vec1, chunk_id=c1_id, prev_id=c0_id)

    recorded_exec_values = []
    connections: list[_FakeConnection] = []

    def query_handler(sql, params):
        norm_sql = " ".join(sql.split()).lower()
        if norm_sql == "select 1":
            return [(1,)]
        if "from rag.lecture_chunks where lecture_id" in norm_sql:
            vec0_str = "[" + ",".join(str(x) for x in vec0) + "]"
            return [
                (
                    str(c0_id),
                    str(lecture_id),
                    0,
                    Decimal("0.000"),
                    Decimal("10.000"),
                    "00:00",
                    "00:10",
                    "LECTURER",
                    "Khái niệm vector.",
                    3,
                    vec0_str,
                    {"vector": 0.9},
                    None,
                    str(c1_id),
                    {"segment_ids": [0]},
                )
            ]
        if "rag.search_vietnamese_rag_rrf" in norm_sql:
            return [
                (
                    str(c0_id),
                    str(lecture_id),
                    0,
                    Decimal("0.000"),
                    Decimal("10.000"),
                    "00:00",
                    "00:10",
                    "LECTURER",
                    "Khái niệm vector.",
                    None,
                    str(c1_id),
                    0.99,
                    1,
                    1,
                    0.04918,
                    {"vector": 0.9},
                )
            ]
        if "rag.get_expanded_context" in norm_sql:
            return [
                ("CURRENT", str(c0_id), "00:00", "00:10", "LECTURER", "Khái niệm vector."),
                ("NEXT", str(c1_id), "00:10", "00:20", "LECTURER", "Cơ sở trực chuẩn."),
            ]
        return []

    def conn_factory():
        conn = _FakeConnection(query_handler)
        connections.append(conn)
        return conn

    def fake_execute_values(cur, sql, rows, template=None):
        recorded_exec_values.append((sql, list(rows), template))

    store = PostgresPgVectorChunkStore(
        connection_factory=conn_factory,
        json_adapter=lambda d: d,
        values_executor=fake_execute_values,
    )

    assert store.is_postgres_connected() is True
    saved = store.save_lecture_chunks(lecture_id, [chunk0, chunk1])
    assert saved == 2
    assert connections[-1].committed is True
    assert "DELETE FROM rag.lecture_chunks WHERE lecture_id = %s" in connections[-1].cursor_obj.executed[0][0]
    assert len(recorded_exec_values) == 1
    assert "::halfvec(1024)" in (recorded_exec_values[0][2] or "")
    assert len(recorded_exec_values[0][1]) == 2

    fetched = store.get_lecture_chunks(lecture_id)
    assert len(fetched) == 1
    assert fetched[0].id == c0_id
    assert len(fetched[0].embedding_half) == 1024
    assert fetched[0].next_chunk_id == c1_id

    search_res = store.search_hybrid_rrf([lecture_id], vec0, "khai niem vector", top_k=5, rrf_k=60)
    assert len(search_res) == 1
    assert search_res[0]["chunk_id"] == c0_id
    assert search_res[0]["rrf_total_score"] == pytest.approx(0.04918)
    assert search_res[0]["lexical_weights"] == {"vector": 0.9}

    ctx = store.get_expanded_context(c0_id)
    assert [item["position"] for item in ctx] == ["CURRENT", "NEXT"]


def test_composite_chunk_store_offline_fallback_and_strict_mode():
    from ai_service.core.chunk_store import (
        CompositeChunkStore,
        InMemoryChunkStore,
        PostgresPgVectorChunkStore,
    )

    lecture_id = uuid.uuid4()
    chunk = _make_chunk(lecture_id, 0, "Thuật toán tìm kiếm.", _unit_vec(0))

    offline_pg = PostgresPgVectorChunkStore(connection_factory=lambda: (_ for _ in ()).throw(ConnectionError("offline")))
    composite = CompositeChunkStore(
        memory_store=InMemoryChunkStore(),
        postgres_store=offline_pg,
        enable_pgvector=True,
        strict_db=False,
    )

    count = composite.save_lecture_chunks(lecture_id, [chunk])
    assert count == 1
    assert composite.last_db_synced is False
    assert composite.is_postgres_connected() is False
    assert len(composite.get_lecture_chunks(lecture_id)) == 1

    # strict_db=True must surface DB failure
    strict_composite = CompositeChunkStore(
        memory_store=InMemoryChunkStore(),
        postgres_store=offline_pg,
        enable_pgvector=True,
        strict_db=True,
    )
    with pytest.raises(ConnectionError):
        strict_composite.save_lecture_chunks(lecture_id, [chunk])


def test_composite_chunk_store_online_sync_delegation_and_skip_sync():
    from ai_service.core.chunk_store import (
        CompositeChunkStore,
        InMemoryChunkStore,
        PostgresPgVectorChunkStore,
    )

    lecture_id = uuid.uuid4()
    c0_id = uuid.uuid4()
    c1_id = uuid.uuid4()
    vec0 = _unit_vec(0)
    c0 = _make_chunk(lecture_id, 0, "Không gian vector.", vec0, chunk_id=c0_id, next_id=c1_id)
    c1 = _make_chunk(lecture_id, 1, "Cơ sở trực giao.", _unit_vec(1), chunk_id=c1_id, prev_id=c0_id)

    pg_called = {"save": 0, "search": 0, "context": 0}

    class _OnlinePgStub(PostgresPgVectorChunkStore):
        def is_postgres_connected(self) -> bool:
            return True

        def save_lecture_chunks(self, lid, chunks) -> int:
            pg_called["save"] += 1
            return len(chunks)

        def get_lecture_chunks(self, lid):
            return [c0, c1]

        def search_hybrid_rrf(self, lecture_ids, query_embedding, query_text, top_k=25, rrf_k=60):
            pg_called["search"] += 1
            return [{"chunk_id": c0_id, "rrf_total_score": 0.05}]

        def get_expanded_context(self, cid):
            pg_called["context"] += 1
            return [{"position": "CURRENT", "chunk_id": c0_id}]

    composite = CompositeChunkStore(
        memory_store=InMemoryChunkStore(),
        postgres_store=_OnlinePgStub(),
        enable_pgvector=True,
    )

    # sync_to_db=False skips Postgres write
    composite.save_lecture_chunks(lecture_id, [c0, c1], sync_to_db=False)
    assert pg_called["save"] == 0
    assert composite.last_db_synced is False
    assert composite.is_lecture_synced(lecture_id) is False

    # sync_to_db=True syncs to Postgres and delegates reads/search/context
    composite.save_lecture_chunks(lecture_id, [c0, c1], sync_to_db=True)
    assert pg_called["save"] == 1
    assert composite.last_db_synced is True
    assert composite.is_lecture_synced(lecture_id) is True

    assert len(composite.get_lecture_chunks(lecture_id)) == 2
    search_out = composite.search_hybrid_rrf([lecture_id], vec0, "khong gian vector")
    assert pg_called["search"] == 1
    assert search_out[0]["chunk_id"] == c0_id

    ctx_out = composite.get_expanded_context(c0_id)
    assert pg_called["context"] == 1
    assert ctx_out[0]["position"] == "CURRENT"



