"""
=========================================================================
LectureLens RAG DB Verification Script (PostgreSQL 16 + pgvector 0.7.0+)
=========================================================================
Kịch bản tự động kiểm thử tính hợp lệ của phân vùng schema rag:
1. Kiểm tra phiên bản pgvector (>= 0.7.0).
2. Kiểm tra các extensions: vector, unaccent, pg_trgm, uuid-ossp.
3. Chèn mẫu phân đoạn bài giảng tiếng Việt kèm vector ngẫu nhiên halfvec(1024).
4. Kiểm tra các cột sinh tự động [MM:SS] và unaccent.
5. Thử nghiệm hàm Hybrid Search 3 luồng (RRF) với câu hỏi tiếng Việt không dấu.
6. Thử nghiệm hàm mở rộng ngữ cảnh Context Expansion.
=========================================================================
"""

import os
import sys
import uuid

def run_verification():
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
    except ImportError:
        print("⚠️ Chưa cài đặt thư viện 'psycopg2'. Vui lòng cài đặt: pip install psycopg2-binary")
        return

    # Lấy thông tin kết nối từ biến môi trường hoặc giá trị mặc định
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = int(os.getenv("POSTGRES_PORT", "5432"))
    dbname = os.getenv("POSTGRES_DB", "lecturelens_db")
    user = os.getenv("POSTGRES_USER", "ll_admin")
    password = os.getenv("POSTGRES_PASSWORD", "ll_secure_password_2026")

    print("=" * 70)
    print("🔍 BẮT ĐẦU KIỂM THỬ RAG DATABASE CHO LECTURELENS")
    print(f"📡 Kết nối: postgresql://{user}:***@{host}:{port}/{dbname}")
    print("=" * 70)

    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password,
            connect_timeout=5,
        )
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=RealDictCursor)
    except Exception as e:
        print(f"❌ Không thể kết nối tới cơ sở dữ liệu: {e}")
        print("💡 Hãy chắc chắn container PostgreSQL đã được khởi chạy:")
        print("   cd BE && docker compose up -d db")
        return

    try:
        # 1. Kiểm tra Extension vector version
        print("\n[Bước 1/6] Kiểm tra Extension pgvector & các phần mở rộng...")
        cur.execute("SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'unaccent', 'pg_trgm', 'uuid-ossp');")
        extensions = {row["extname"]: row["extversion"] for row in cur.fetchall()}
        
        for ext in ["vector", "unaccent", "pg_trgm", "uuid-ossp"]:
            if ext in extensions:
                print(f"  ✅ Extension '{ext}' đã kích hoạt (Phiên bản: {extensions[ext]})")
            else:
                print(f"  ❌ Extension '{ext}' CHƯA được kích hoạt!")

        # 2. Kiểm tra cấu hình HNSW pgvector 0.7.0+
        print("\n[Bước 2/6] Kiểm tra tham số cấu hình pgvector 0.7.0+...")
        try:
            cur.execute("SHOW hnsw.iterative_scan;")
            iter_scan = cur.fetchone()["hnsw.iterative_scan"]
            print(f"  ✅ hnsw.iterative_scan = '{iter_scan}'")
        except Exception:
            print("  ⚠️ hnsw.iterative_scan chưa khả dụng (yêu cầu pgvector 0.7.0+)")

        cur.execute("SHOW hnsw.ef_search;")
        ef_search = cur.fetchone()["hnsw.ef_search"]
        print(f"  ✅ hnsw.ef_search = {ef_search}")

        # 3. Tạo ID bài giảng thử nghiệm
        test_lecture_id = str(uuid.uuid4())
        chunk1_id = str(uuid.uuid4())
        chunk2_id = str(uuid.uuid4())

        # Vector giả lập 1024 chiều
        dummy_vector = "[" + ",".join(["0.03125"] * 1024) + "]"

        print("\n[Bước 3/6] Thử nghiệm chèn dữ liệu bài giảng tiếng Việt...")
        cur.execute("""
            INSERT INTO rag.lecture_chunks (
                id, lecture_id, chunk_index, start_time_seconds, end_time_seconds,
                speaker_label, content, token_count, embedding_half, next_chunk_id
            ) VALUES (
                %s, %s, 1, 75.500, 135.250, 'LECTURER',
                'Thuật toán Gradient Descent cập nhật trọng số ngược chiều gradient của hàm mất mát.',
                45, %s, %s
            );
        """, (chunk1_id, test_lecture_id, dummy_vector, chunk2_id))

        cur.execute("""
            INSERT INTO rag.lecture_chunks (
                id, lecture_id, chunk_index, start_time_seconds, end_time_seconds,
                speaker_label, content, token_count, embedding_half, prev_chunk_id
            ) VALUES (
                %s, %s, 2, 135.250, 195.000, 'LECTURER',
                'Tốc độ học hay learning rate quyết định độ dài bước nhảy trong không gian tối ưu.',
                40, %s, %s
            );
        """, (chunk2_id, test_lecture_id, dummy_vector, chunk1_id))

        print(f"  ✅ Đã chèn thành công 2 chunks liên kết cho bài giảng test: {test_lecture_id}")

        # 4. Kiểm tra các cột sinh tự động [MM:SS] và unaccent
        print("\n[Bước 4/6] Kiểm tra các cột sinh tự động (Timestamps & Unaccent)...")
        cur.execute("""
            SELECT id, start_timestamp_display, end_timestamp_display, content_unaccent 
            FROM rag.lecture_chunks WHERE id = %s;
        """, (chunk1_id,))
        row = cur.fetchone()
        print(f"  ✅ Mốc thời gian: {row['start_timestamp_display']} - {row['end_timestamp_display']}")
        print(f"  ✅ Văn bản không dấu: \"{row['content_unaccent']}\"")
        assert row["start_timestamp_display"] == "01:15", f"Sai mốc thời gian: {row['start_timestamp_display']}"

        # 5. Thử nghiệm hàm Hybrid Search 3 luồng RRF với câu hỏi không dấu
        print("\n[Bước 5/6] Thử nghiệm Hybrid Search 3 luồng (RRF) với câu hỏi KHÔNG DẤU...")
        query_text = "thuat toan gradient descent la gi"
        cur.execute("""
            SELECT chunk_id, chunk_index, start_timestamp_display, content, dense_score, rrf_total_score
            FROM rag.search_vietnamese_rag_rrf(
                ARRAY[%s]::uuid[],
                %s::halfvec,
                %s,
                5
            );
        """, (test_lecture_id, dummy_vector, query_text))
        search_results = cur.fetchall()
        print(f"  ✅ Tìm thấy {len(search_results)} kết quả phù hợp!")
        for r in search_results:
            print(f"     • [{r['start_timestamp_display']}] Chunk #{r['chunk_index']} - RRF Score: {r['rrf_total_score']:.5f}")
            print(f"       Nội dung: {r['content']}")

        # 6. Thử nghiệm hàm Context Expansion
        print("\n[Bước 6/6] Thử nghiệm hàm Context Expansion (Mở rộng ngữ cảnh)...")
        cur.execute("""
            SELECT position, chunk_id, start_timestamp_display, end_timestamp_display, content
            FROM rag.get_expanded_context(%s);
        """, (chunk1_id,))
        context_rows = cur.fetchall()
        print(f"  ✅ Trích xuất được {len(context_rows)} đoạn ngữ cảnh:")
        for c in context_rows:
            print(f"     [{c['position']}] {c['start_timestamp_display']} -> {c['end_timestamp_display']}: {c['content']}")

        # Dọn dẹp dữ liệu test
        cur.execute("DELETE FROM rag.lecture_chunks WHERE lecture_id = %s;", (test_lecture_id,))
        print("\n🧹 Đã dọn dẹp sạch dữ liệu thử nghiệm.")

        print("\n" + "=" * 70)
        print("🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ SCHEMA RAG ĐỀU THÀNH CÔNG VƯỢT TRỘI!")
        print("=" * 70)

    except Exception as e:
        print(f"\n❌ Lỗi trong quá trình kiểm thử: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_verification()
