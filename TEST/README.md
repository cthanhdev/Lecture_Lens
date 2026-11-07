# 🧪 LectureLens Audio Ingest & Transcript Test Lab
*Thư mục kiểm thử cô lập 100% — Xóa sạch an toàn sau khi hoàn tất kiểm tra*

---

## 🎯 Giới Thiệu

Thư mục `TEST/` này được tạo riêng để phục vụ việc kiểm thử nhanh:
1. **Tải tệp âm thanh bài giảng lên** (`.mp3`, `.wav`, `.m4a`,...).
2. **Kích hoạt Pipeline** (Chuẩn hóa âm thanh qua FFmpeg $\rightarrow$ Nhận dạng tiếng nói PhoWhisper-base $\rightarrow$ Sinh tệp `transcript.json`).
3. **Kiểm tra trực quan kết quả trên giao diện:**
   * Xem lời thoại từng câu tiếng Việt kèm nhãn thời gian `[MM:SS]`.
   * Bấm vào nhãn thời gian để phát đúng đoạn âm thanh tương ứng trên player.
   * Xem chi tiết tệp `transcript.json` và `manifest.json`.
   * Xem trước cấu trúc dữ liệu lưu trữ vào bảng `app.jobs` và `rag.lecture_chunks`.

---

## 🚀 Cách Chạy Kiểm Thử

### Cách 1: Chạy Siêu Tốc Cục Bộ (Khuyên dùng - Không cần Docker)
Chỉ cần nhấp đúp vào file:
👉 **`TEST\run_test_local.bat`**  
*(Hoặc gõ lệnh trong terminal: `python TEST\server.py`)*

Trình duyệt sẽ tự động mở trang web: **`http://localhost:8090`**.

### Cách 2: Chạy Qua Docker (Đóng gói trọn vẹn cả Model + PostgreSQL)
Yêu cầu đã bật Docker Desktop trên máy:
👉 **`TEST\run_test_docker.bat`**  
*(Hoặc gõ lệnh: `docker compose -f TEST\docker-compose.test.yml up --build`)*

---

## 💡 Hướng Dẫn Sử Dụng Trên Giao Diện Web

1. **Chọn chế độ ASR:**
   * **⚡ Fast Mock (<1s):** Hoàn thành trong tích tắc bằng dữ liệu mẫu để bạn kiểm tra giao diện, player và bảng DB.
   * **🎙️ PhoWhisper ASR Thật:** Nạp trực tiếp mô hình tại `backend/models/phowhisper-base` để nhận dạng âm thanh tiếng Việt thực tế.
2. **Chọn âm thanh:**
   * Bấm nút **"🎯 Dùng File Âm Thanh Mẫu"** để nạp sẵn file bài giảng mẫu.
   * Hoặc kéo thả file audio bất kỳ từ máy tính của bạn vào dropzone.
3. **Bấm "🚀 Bắt Đầu Ingest & Chuyển Thành Text":**
   * Quan sát tiến độ từ 0% đến 100%.
   * Khám phá 4 Tab kiểm tra kết quả:
     * *Tab 1 (Lời thoại):* Danh sách câu tiếng Việt, bấm mốc thời gian để nghe lại.
     * *Tab 2 (transcript.json):* JSON Schema chuẩn, có nút Copy và Tải về.
     * *Tab 3 (manifest.json):* Thông số kỹ thuật, SHA-256, thời lượng audio.
     * *Tab 4 (Database):* Bảng kiểm tra trạng thái `app.jobs` và các chunks.

---

## 🧹 Lệnh Xóa Sạch Thư Mục TEST (Khi Đã Kiểm Tra Xong)

Sau khi kiểm thử xong, chỉ cần chạy 1 câu lệnh PowerShell từ thư mục gốc của dự án:

```powershell
# 1. Dừng container nếu đã chạy qua Docker
docker compose -f TEST\docker-compose.test.yml down -v

# 2. Xóa sạch thư mục TEST
Remove-Item -Recurse -Force TEST
```
Toàn bộ mã nguồn cốt lõi của dự án hoàn toàn nguyên vẹn và sạch sẽ!
