# LectureLens Domain Glossary

Thuật ngữ định nghĩa ngôn ngữ miền (Ubiquitous Language) của hệ thống LectureLens - Nền tảng học tập thông minh & trợ lý bài giảng AI tiếng Việt.

---

## 1. Core Architecture & Privacy

**LectureLens**:
Nền tảng học tập thông minh chuyển đổi âm thanh bài giảng đại học thành sổ tay điện tử thông minh, hỗ trợ RAG và bộ công cụ ôn tập cá nhân.
*Avoid*: LectureApp, LensApp, SmartLecture.

**Privacy-First & On-Premise AI**:
Kiến trúc AI cục bộ độc lập, thực thi toàn bộ quy trình nhận dạng giọng nói, nhúng đặc trưng vector và suy luận mô hình ngôn ngữ lớn trên máy chủ nội bộ hoặc máy cá nhân, cam kết không truyền âm thanh hay tài liệu bài giảng ra dịch vụ đám mây bên thứ ba.
*Avoid*: Cloud AI, External SaaS API.

**2-Stage Neural RAG**:
Quy trình truy vấn bài giảng theo hai giai đoạn:
1. *Giai đoạn 1 (Candidate Retrieval)*: Dense Search sử dụng vector 1024 chiều (BGE-M3) kết hợp chỉ mục HNSW trên PostgreSQL pgvector để lọc nhanh Top-25 phân đoạn.
2. *Giai đoạn 2 (Precision Reranking)*: Cross-Encoder BGE-Reranker-v2-m3 chấm điểm tương quan sâu để chọn Top 3-5 đoạn xuất sắc nhất cho LLM suy luận.

**PhoWhisper**:
Mô hình ASR (nhận dạng tiếng nói) tiếng Việt chuyên biệt (`PhoWhisper-base`), tự động gán mốc thời gian (*Timestamps*) theo định dạng `[MM:SS]`.

**Gemma 4 E4B**:
Mô hình ngôn ngữ lớn cục bộ chạy qua Ollama chịu trách nhiệm suy luận ngữ cảnh, giải thích và sinh nội dung học tập.

---

## 2. Study Experience & Stationery Tokens

**Pastel Stationery Design System**:
Hệ thống thiết kế mô phỏng bàn học sinh viên ấm áp với giấy can, bút dạ quang, băng dính washi và thẻ sticky note:
- `bg-stationery-canvas`: Giấy mỹ thuật ngà ấm (`#FFFAF5`)
- `bg-stationery-surface`: Thẻ card bo góc trắng (`#FFFFFF`)
- `primary-lavender`: Tím lavender thương hiệu (`#6D5FD0`)
- `accent-sakura`: Hồng sakura điểm nhấn trợ lý (`#F875AA`)
- `accent-mint`: Xanh bạc hà trạng thái & timestamp (`#10B981`)
- `accent-sticky`: Vàng ghi chú tóm tắt (`#FFF1C9`)

**Owl Companion (Trợ lý Cú Mèo)**:
Linh vật và người bạn đồng hành AI học tập trên LectureLens, giải thích khái niệm phức tạp và gợi ý câu hỏi ôn tập.

**Cornell Notes**:
Định dạng ghi chép bài giảng cấu trúc chuẩn gồm 3 vùng: Tóm tắt tổng quan (Summary), Thuật ngữ/Gợi ý (Cues), và Nội dung chi tiết (Notes).

**Flashcard**:
Thẻ học ghi nhớ tích cực (Active Recall) tự động tạo từ nội dung bài giảng với hiệu ứng lật mặt (Front/Back) và thuật toán lặp lại ngắt quãng (Spaced Repetition).

**Quiz**:
Bài trắc nghiệm 4 lựa chọn (Single-Choice Question) tạo tự động với đáp án đúng và lời giải thích đối chiếu từ mốc thời gian gốc.

**Capsule Audio Player**:
Trình phát bài giảng dạng con nhộng ghim cố định ở đáy màn hình, hỗ trợ phát đồng bộ theo mốc thời gian bài giảng và đa tốc độ (0.75x đến 2.0x).

---

## 3. Engineering Workflows & Tasks

**Issue tracker**:
Công cụ quản lý công việc và phát triển tính năng của repository (GitHub Issues trên `cthanhdev/Lecture_Lens`).

**Issue**:
Đơn vị công việc được theo dõi trong issue tracker (Task, Bug, Spec hoặc Ticket).

**Triage role**:
Nhãn trạng thái trong quy trình phân loại: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.
