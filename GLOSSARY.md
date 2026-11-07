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

## 2. 🌸 Hệ Thống Thiết Kế Kitsune Soft & Trải Nghiệm Học Tập (Kitsune Soft Design System)

**Kitsune Soft**:
Ngôn ngữ thiết kế chính thức của LectureLens, lấy cảm hứng từ phong cách tối giản thanh bình của Nhật Bản (*kawaii-calm*), kết hợp chất liệu giấy thủ công Washi ấm áp, kính mờ sữa Miruku Glass, khối Bento Squircle và động lực học đàn hồi Mochi.

**Kitsune Fox (Cáo Kitsune / Kitsune Companion)**:
Linh vật và người bạn đồng hành AI thông minh chính thức của LectureLens. Được thể hiện bằng phong cách **Pixel Art Nhật Bản**, đeo chuông cổ vàng (*suzu*), điểm xuyết cánh hoa anh đào (*sakura*), cổng trời (*torii*) và vầng thái dương đỏ rạng rỡ. Đại diện cho trí tuệ lanh lợi, tính kiên trì và sự đồng hành ấm áp trong học tập.

**Hệ Thống Token Màu Sắc Kitsune Soft**:
- `washi-cream` (`#FFF7FD`): Giấy Washi ngà ấm, chống mỏi mắt khi học lâu, đóng vai trò nền canvas toàn ứng dụng.
- `kitsune-coral` (`#F47F72`): San hô Kitsune rực rỡ, màu nhận diện chính (Primary) cho nút CTA, viền focus và trạng thái kích hoạt.
- `sakura-pink` (`#F5C3C9`): Hồng cánh hoa anh đào (Secondary), dùng cho thẻ phân loại môn học và điểm nhấn linh vật.
- `mist-sky` (`#A9D4E8`): Xanh sương lam (Tertiary), dùng cho thanh tiến độ học tập và thẻ thông tin bình ổn.
- `mochi-yellow` (`#FFE27A`): Vàng mochi (Accent), dùng cho đánh dấu sao, khối tóm tắt bài học và huy hiệu thành tích.
- `matcha-mint` (`#BEE1D0`): Xanh trà matcha (Accent), biểu thị trạng thái hoàn thành và mốc thời gian `[MM:SS]`.
- `plum-ink` (`#261333`): Mực mận chín cao cấp (Neutral Ink), dùng cho toàn bộ tiêu đề, nội dung và nét icon outline (đạt chuẩn WCAG AAA).

**Miruku Glass (Kính Mờ Sữa)**:
Bề mặt thẻ card bán trong suốt `rgba(255, 255, 255, 0.76)` kết hợp với hiệu ứng làm mờ hậu cảnh `16px blur` và viền sáng siêu mỏng `1px solid rgba(255, 255, 255, 0.85)`.

**Plum Ambient Shadows**:
Hệ thống bóng đổ ấm màu mận chín `rgba(38, 19, 51, 0.06)`, thay thế hoàn toàn cho bóng xám lạnh truyền thống, tạo cảm giác bề mặt nổi mềm mại trên nền giấy Washi.

**Squircle (Hình Khối Bầu Bĩnh)**:
Đường cong toán học bo tròn liên tục từ **`24px` đến `32px`** dùng cho toàn bộ thẻ nội dung Bento.

**Pill Shape (Hình Viên Thuốc)**:
Đường cong bo tròn tuyệt đối **`9999px`** dùng cho mọi điều khiển tương tác (nút bấm, ô nhập liệu, chip lọc, badge).

**Mochi Tactile Press**:
Hiệu ứng tương tác xúc giác nảy mềm dẻo: khi bấm vào phần tử, kích thước co nhẹ `scale(0.97)` trong `0.15s` cùng độ bóng sụt giảm, mang lại phản hồi trực quan đàn hồi như bánh mochi tươi.

**Duotone Soft-Blob Iconography**:
Hệ thống biểu tượng đồ họa kết hợp giữa nét vẽ outline sắc sảo **1.75px** bằng mực mận chín (`#261333`) đặt trên tấm nền đốm màu pastel hữu cơ mềm mại lệch góc 3px.

**Home Study Hub**:
Bàn học điện tử thông minh, trung tâm điều phối toàn bộ bài giảng, tiến độ ghi nhớ và lối tắt ghi âm.

**Cornell Notes**:
Phương pháp ghi chép bài giảng cấu trúc khoa học gồm 3 khu vực:
1. *Summary (Tóm tắt tổng quan)*: Khái quát ngắn gọn trọng tâm bài học.
2. *Cues (Từ khóa & Gợi ý)*: Các thuật ngữ chính, câu hỏi trọng tâm.
3. *Notes (Nội dung chi tiết)*: Ghi chú diễn giải bài giảng kèm mốc thời gian `[MM:SS]`.

**Kitsune Flashcard**:
Thẻ học ghi nhớ chủ động (Active Recall) 2 mặt: Mặt trước (*Question Front*) và Mặt sau (*Answer Back*), hỗ trợ chuyển động lật 3D và thuật toán lặp lại ngắt quãng (Spaced Repetition).

**Capsule Audio Player**:
Trình phát bài giảng dạng con nhộng ghim cố định đáy màn hình, hỗ trợ phát liên tục không gián đoạn, đa tốc độ (0.75x đến 2.0x) và đồng bộ nhảy đến mốc thời gian `[MM:SS]` khi người dùng bấm vào transcript.

**Floating Island Tab Bar**:
Thanh điều hướng capsule lơ lửng cách đáy màn hình 16px với nền kính sữa Miruku Glass và con trỏ trượt san hô mềm.

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


---

## 4. 🎙️ Quy Trình Thu Nạp Bài Giảng & Tạo Bản Ghi (Audio Ingest & Transcription)

**Audio Ingest Pipeline**:
Quy trình nền tự động chuyển đổi file âm thanh bài giảng thô từ thư mục dùng chung (Shared Volume) thành bản ghi lời thoại cấu trúc chuẩn hóa, bao gồm kiểm tra tính toàn vẹn (Checksum SHA-256), chuẩn hóa tần số lấy mẫu 16kHz Mono PCM, nhận dạng giọng nói tiếng Việt bằng PhoWhisper và xuất bản tệp `transcript.json`.

**AudioStore**:
Module quản lý dữ liệu lưu trữ tập trung cho các tài nguyên âm thanh bài giảng. Chịu trách nhiệm định danh $O(1)$ thông qua `jobId`, đăng ký và xác minh checksum, quản lý manifest theo từng tác vụ và lưu trữ tệp transcript nguyên tử.

**Transcript Artifact (`transcript.json`)**:
Hợp đồng dữ liệu cấu trúc đầu ra của Giai đoạn 1 (ASR) và là đầu vào bất biến cho Giai đoạn 2 (BGE-M3 Chunking & Embedding). Chứa toàn bộ nội dung văn bản (`full_text`) cùng danh sách các phân đoạn lời thoại (`segments`) có mốc thời gian bắt đầu, kết thúc liên tục và nhãn hiển thị `[MM:SS]`.

**Job State Machine (Máy Trạng Thái Tác Vụ)**:
Chu kỳ chuyển đổi trạng thái của một phiên xử lý bài giảng từ lúc tiếp nhận đến khi sẵn sàng tra cứu:
`QUEUED` $\rightarrow$ `PROCESSING_STT` $\rightarrow$ `STT_COMPLETED` $\rightarrow$ `CHUNKING` $\rightarrow$ `EMBEDDING` $\rightarrow$ `READY` (hoặc `FAILED` nếu phát sinh sự cố).
*Lưu ý*: `STT_COMPLETED` là điểm phân tách ranh giới kỹ thuật giữa Giai đoạn 1 (ASR) và Giai đoạn 2 (Vectorization).
