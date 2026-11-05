# 📖 LectureLens Domain Glossary (Từ Điển Ngôn Ngữ Miền)

Tài liệu định nghĩa ngôn ngữ miền chuẩn (**Ubiquitous Language**) và thuật ngữ thiết kế mã nguồn của hệ thống **LectureLens** — Nền tảng học tập thông minh & Trợ lý bài giảng AI tiếng Việt.

Tất cả các kỹ sư, trợ lý AI và tài liệu dự án bắt buộc phải sử dụng các thuật ngữ này một cách nhất quán.

---

## 1. 🏗️ Kiến Trúc Cốt Lõi & Bảo Mật (Core Architecture & Privacy)

**LectureLens**:
Nền tảng học tập thông minh chuyển đổi âm thanh bài giảng đại học thành sổ tay điện tử thông minh, hỗ trợ hỏi đáp ngữ nghĩa 2 giai đoạn (2-Stage Neural RAG) kèm mốc thời gian và tự động sinh bộ công cụ ôn tập cá nhân (Flashcards, Quizzes).
*Tránh dùng (Avoid)*: LectureApp, LensApp, SmartLecture, SmartLecture AI.

**Privacy-First & On-Premise AI**:
Triết lý và nguyên tắc kiến trúc cốt lõi (ADR 0001): Toàn bộ quy trình nhận dạng giọng nói, nhúng vector đặc trưng và suy luận mô hình ngôn ngữ lớn được thực thi 100% cục bộ trên máy chủ nội bộ hoặc máy trạm. Cam kết **Zero Cloud Leakage**: tuyệt đối không truyền âm thanh, văn bản hay tài liệu bài giảng ra bất kỳ dịch vụ đám mây bên thứ ba nào.
*Tránh dùng (Avoid)*: Cloud AI, External SaaS API, OpenAI API integration.

**2-Stage Neural RAG**:
Quy trình truy vấn bài giảng ngữ nghĩa hai giai đoạn bảo đảm độ chính xác tối đa:
1. *Giai đoạn 1 (Candidate Retrieval)*: Dense Search sử dụng vector 1024 chiều từ mô hình **BGE-M3** kết hợp chỉ mục **HNSW** (`vector_cosine_ops`) trên PostgreSQL pgvector để lọc nhanh Top-25 phân đoạn ứng viên.
2. *Giai đoạn 2 (Precision Reranking)*: Bộ tái định vị Cross-Encoder **BGE-Reranker-v2-m3** chấm điểm tương quan chuyên sâu giữa truy vấn và từng phân đoạn để chọn lọc Top 3–5 đoạn có độ phù hợp cao nhất cho mô hình ngôn ngữ lớn suy luận.

**PhoWhisper**:
Mô hình ASR (nhận dạng tiếng nói) tiếng Việt chuyên biệt (`PhoWhisper-base`), được tối ưu hóa cho ngữ điệu và thuật ngữ bài giảng tiếng Việt, tự động gán mốc thời gian (*Timestamps*) chuẩn theo định dạng `[MM:SS]`.

**BGE-M3**:
Mô hình embedding đa ngữ tiên tiến, sinh vector dense 1024 chiều đại diện ngữ nghĩa cho các phân đoạn bài giảng và truy vấn tìm kiếm.

**BGE-Reranker-v2-m3**:
Mô hình Cross-Encoder chuyên dụng chấm điểm tương quan cặp (Query - Passage), loại bỏ phân đoạn nhiễu trước khi đưa vào LLM.

**Gemma 4 E4B**:
Mô hình ngôn ngữ lớn cục bộ chạy qua Ollama, chịu trách nhiệm tổng hợp câu trả lời dựa trên ngữ cảnh trích xuất, luôn kèm trích dẫn mốc thời gian gốc `[MM:SS]`.

---

## 2. 🎨 Trải Nghiệm Học Tập & Bảng Màu Thiết Kế (Study Experience & Design Tokens)

**Pastel Stationery Design System**:
Hệ thống thiết kế giao diện mô phỏng không gian bàn học thân thuộc của sinh viên với giấy mỹ thuật, bút dạ quang, băng dính washi và thẻ sticky note:
- `bg-stationery-canvas`: Giấy mỹ thuật ngà ấm (`#FFFAF5`), chống mỏi mắt khi học lâu.
- `bg-stationery-surface`: Thẻ card bo góc trắng ngà (`#FFFFFF`).
- `primary-lavender`: Tím lavender nhận diện thương hiệu (`#6D5FD0`).
- `accent-sakura`: Hồng sakura điểm nhấn trợ lý và chủ đề (`#F875AA`).
- `accent-mint`: Xanh bạc hà biểu thị mốc thời gian và trạng thái hoàn thành (`#10B981`).
- `accent-sticky`: Vàng pastel ghi chú tóm tắt (`#FFF1C9`).
- `border-stationery-ruled`: Đường kẻ vở phân cách trang nhã (`#F0EAE1`).

**Owl Companion (Trợ Lý Cú Mèo)**:
Linh vật và người bạn đồng hành AI học tập trên LectureLens: xuất hiện trong giao diện 3D và các khung trò chuyện, hỗ trợ giải thích khái niệm phức tạp, gợi ý câu hỏi ôn tập và khích lệ tiến độ.

**Cornell Notes**:
Phương pháp ghi chép bài giảng cấu trúc khoa học gồm 3 khu vực:
1. *Summary (Tóm tắt tổng quan)*: Khái quát ngắn gọn trọng tâm bài học.
2. *Cues (Từ khóa & Gợi ý)*: Các thuật ngữ chính, câu hỏi trọng tâm.
3. *Notes (Nội dung chi tiết)*: Ghi chú diễn giải bài giảng kèm mốc thời gian `[MM:SS]`.

**Flashcard**:
Thẻ học ghi nhớ chủ động (Active Recall) được tạo tự động từ bài giảng với 2 mặt (Mặt trước: Thuật ngữ/Khái niệm; Mặt sau: Định nghĩa/Ví dụ), hỗ trợ ôn tập theo thuật toán lặp lại ngắt quãng (Spaced Repetition).

**Quiz**:
Bài tập trắc nghiệm 4 lựa chọn (Single-Choice Question) tạo tự động với đáp án chính xác và phần giải thích đối chiếu trực tiếp từ mốc thời gian gốc của bài giảng.

**Capsule Audio Player**:
Trình phát bài giảng dạng con nhộng ghim cố định ở đáy màn hình, hỗ trợ phát âm thanh liên tục không gián đoạn, đa tốc độ (0.75x đến 2.0x) và đồng bộ nhảy đến mốc thời gian `[MM:SS]` khi người dùng bấm vào ghi chú.

---

## 3. 📐 Thuật Ngữ Thiết Kế Mã Nguồn (Matt Pocock Codebase Design)

Tuân thủ nghiêm ngặt hệ thống từ vựng thiết kế module sâu theo triết lý của Matt Pocock & John Ousterhout:

**Module**:
Bất kỳ thành phần nào sở hữu một giao diện (**Interface**) và một phần thân triển khai (**Implementation**). Có tính độc lập về quy mô: một hàm, một lớp, một package, hoặc một lát cắt liên tầng.
*Tránh dùng (Avoid)*: Unit, Component, Service (khi nói về khái niệm trừu tượng).

**Interface**:
Tất cả những gì người gọi (**Caller**) bắt buộc phải biết để sử dụng module một cách chính xác: chữ ký kiểu dữ liệu, các điều kiện bất biến (invariants), thứ tự gọi, chế độ lỗi, cấu hình bắt buộc và đặc tính hiệu năng.
*Tránh dùng (Avoid)*: API, Signature (quá hẹp, chỉ nói về mặt kiểu dữ liệu).

**Implementation**:
Toàn bộ mã nguồn và logic thực thi nằm bên trong module, được ẩn giấu hoàn toàn khỏi Interface.

**Depth (Độ Sâu Của Module)**:
Tỷ lệ đòn bẩy tại giao diện: Module có **Depth cao (Deep Module)** khi cung cấp khối lượng tính toán, xử lý nghiệp vụ lớn ẩn sau một Interface nhỏ gọn, súc tích. Tránh các module nông (**Shallow Module** - Interface phức tạp nhưng Implementation chỉ chuyển tiếp lệnh).

**Seam (Ranh Giới Thay Đổi)**:
Vị trí mà bạn có thể thay đổi hành vi của hệ thống mà không cần chỉnh sửa trực tiếp tại nơi đó; nơi Interface của module tồn tại.
*Tránh dùng (Avoid)*: Boundary (tránh nhầm lẫn với Bounded Context của DDD).

**Adapter**:
Thành phần cụ thể thỏa mãn một Interface tại một Seam nhất định (ví dụ: in-memory mock repository phục vụ kiểm thử).

**Leverage (Đòn Bẩy)**:
Lợi ích người gọi nhận được từ module sâu: chỉ cần học một giao diện đơn giản nhưng vận hành được tính năng mạnh mẽ.

**Locality (Tính Tập Trung)**:
Lợi ích người bảo trì nhận được từ module sâu: thay đổi, sửa lỗi, và xác minh chỉ tập trung tại một nơi duy nhất thay vì lan rộng ra khắp các nơi gọi.

**The Deletion Test**:
Phép thử xóa module: Nếu xóa module mà sự phức tạp biến mất hoàn toàn thì đó là module nông (pass-through). Nếu sự phức tạp tái xuất hiện rải rác trên N nơi gọi, module đó đang làm rất tốt vai trò của mình.
