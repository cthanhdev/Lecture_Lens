# 📖 LectureLens Domain Glossary (Từ Điển Ngôn Ngữ Miền)

Từ điển định nghĩa ngôn ngữ miền chuẩn (**Ubiquitous Language**) và thuật ngữ thiết kế của dự án **LectureLens** — Nền tảng học tập thông minh & Trợ lý bài giảng AI tiếng Việt. Mọi kỹ sư, AI Agent và tài liệu kỹ thuật bắt buộc phải sử dụng các thuật ngữ này một cách nhất quán.

---

## 1. 🏗️ Kiến Trúc Cốt Lõi & Bảo Mật (Core Architecture & Privacy)

**LectureLens**:
Nền tảng học tập thông minh chuyển đổi âm thanh bài giảng đại học thành sổ tay số khoa học, hỗ trợ hỏi đáp ngữ nghĩa 2 giai đoạn kèm mốc thời gian và tự động trích xuất bộ công cụ ôn tập cá nhân.
_Avoid_: LectureApp, LensApp, SmartLecture, SmartLecture AI.

**Privacy-First & On-Premise AI**:
Triết lý kiến trúc cốt lõi (ADR 0001): Toàn bộ quy trình ASR, Vectorization, Reranking và suy luận LLM được thực thi 100% cục bộ trên hạ tầng on-premise của tổ chức, cam kết không bao giờ truyền dữ liệu ra đám mây công cộng bên thứ ba.
_Avoid_: Cloud AI, External SaaS API, OpenAI integration, Third-party STT.

**2-Stage Neural RAG**:
Quy trình truy vấn bài giảng hai giai đoạn kết hợp Candidate Retrieval (HNSW Cosine trên PostgreSQL pgvector) và Precision Reranking (Cross-Encoder BGE-Reranker-v2-m3) trước khi đưa ngữ cảnh vào LLM suy luận.
_Avoid_: Single-stage vector search, Naive RAG, Direct LLM QA.

**PhoWhisper**:
Mô hình ASR tiếng Việt chuyên biệt (`PhoWhisper-base` / `PhoWhisper-medium`), được tối ưu cho ngữ điệu và thuật ngữ bài giảng, tự động gán mốc thời gian chuẩn định dạng `[MM:SS]`.
_Avoid_: Whisper Cloud, Whisper API, General ASR.

**BGE-M3**:
Mô hình nhúng ngữ nghĩa đa ngữ tiên tiến, trích xuất vector dense 1024 chiều đại diện cho phân đoạn bài giảng và câu hỏi truy vấn.
_Avoid_: OpenAI Ada, Text-embedding-3, Sentence-Transformers chung chung.

**BGE-Reranker-v2-m3**:
Mô hình Cross-Encoder chuyên dụng chấm điểm tương quan cặp (Query - Passage), loại bỏ triệt để phân đoạn nhiễu trước khi tổng hợp câu trả lời.
_Avoid_: Heuristic reranker, Bi-encoder reranking.

**Gemma 4 E4B**:
Mô hình ngôn ngữ lớn cục bộ chạy qua Ollama, chịu trách nhiệm tổng hợp câu trả lời dựa trên ngữ cảnh trích xuất và bắt buộc dẫn nguồn bằng mốc thời gian `[MM:SS]`.
_Avoid_: GPT-4, Claude API, Un-grounded LLM.

---

## 2. 📱 Nền Tảng Di Động & Hệ Thống Thiết Kế (Mobile Platform & Kitsune Soft)

**Expo SDK 58 Architecture**:
Nền tảng ứng dụng di động native 100% của LectureLens (React Native 0.88.1, React 19.3, New Architecture enabled) đặt tại `mobile/`, sử dụng Expo Router v58 điều hướng file-based.
_Avoid_: Web Study Portal, Responsive Web App, Electron App.

**Kitsune Soft**:
Ngôn ngữ thiết kế chính thức của LectureLens, lấy cảm hứng từ phong cách tối giản thanh bình Nhật Bản (*kawaii-calm*), kết hợp chất liệu giấy Washi, kính mờ Miruku Glass, khối Bento Squircle và động lực học Mochi.
_Avoid_: Material Design, Flat UI, Brutalism.

**Kitsune Fox Companion (Linh Vật Cáo Kitsune)**:
Linh vật và người bạn đồng hành AI thông minh chính thức của LectureLens, thể hiện bằng phong cách Pixel Art Nhật Bản mang chuông cổ vàng và hoa anh đào, tượng trưng cho trí tuệ lanh lợi và sự kiên trì.
_Avoid_: Cute mascot, 3D Fox Model, Robot icon.

**Shopify Skia 2D Canvas**:
Động cơ đồ họa vector 2D hiệu năng cao 60–120 FPS trên di động (`@shopify/react-native-skia`) dùng để dựng Linh vật Cáo Kitsune (`KitsuneMascotCanvas`) và cánh hoa anh đào rơi (`FloatingPetals2D`), thay thế cho Three.js / WebGL nặng nề.
_Avoid_: Three.js Canvas, WebGL Mascot, CSS Animations.

**Native Icon Registry**:
Bộ 74 biểu tượng vector chuẩn hóa độc quyền của Kitsune Soft tại `mobile/src/components/ui/icons/`, thể hiện bằng nét vẽ 1.75px màu Plum Ink đặt trên tấm lót đốm hữu cơ Soft-Blob pastel.
_Avoid_: Inline SVG, Lucide React, Heroicons, FontAwesome.

**Thumb Zone Ergonomics**:
Quy chuẩn thiết kế giao diện tối ưu cho ngón tay cái điều khiển một tay trên màn hình tham chiếu 390px, bảo đảm mọi phần tử tương tác có chiều cao tối thiểu từ 44px đến 52px.
_Avoid_: Desktop click targets, 24px buttons, Mouse-hover UX.

**Miruku Glass (Kính Mờ Sữa)**:
Bề mặt thẻ card bán trong suốt `rgba(255, 255, 255, 0.76)` kết hợp với `BlurView` của `expo-blur` và bóng đổ mận chín `rgba(38, 19, 51, 0.06)`.
_Avoid_: Dark glass, Frosted plastic, CSS backdrop-filter.

**Squircle**:
Đường cong bo góc bầu bĩnh liên tục từ 24px đến 32px (chuẩn thẻ Bento là 28px) dùng cho toàn bộ thẻ nội dung.
_Avoid_: Sharp rectangle, Simple border-radius.

**Pill Shape (Hình Viên Thuốc)**:
Đường cong bo tròn tuyệt đối 9999px dùng cho mọi điều khiển tương tác: nút bấm, trường nhập liệu, chip lọc và badge.
_Avoid_: Box button, Square input.

**Mochi Tactile Press**:
Hiệu ứng nén xúc giác mềm dẻo khi bấm (`scale 0.97` trong 150ms) thực hiện bằng React Native Reanimated kết hợp rung xúc giác nhẹ qua `expo-haptics`.
_Avoid_: CSS active, Hard click, No-feedback press.

**Capsule Audio Player**:
Trình phát bài giảng dạng con nhộng ghim cố định đáy màn hình, phát âm thanh nền liên tục qua `expo-audio`, hỗ trợ đa tốc độ (0.75x đến 2.0x) và tự động nhảy tới mốc `[MM:SS]` khi chạm vào lời thoại.
_Avoid_: HTML5 Audio, Web audio player, Standard OS player.

**Floating Island Tab Bar**:
Thanh điều hướng 5 đảo lơ lửng cách đáy màn hình 16px với bề mặt kính sữa Miruku Glass và con trượt san hô mềm.
_Avoid_: Bottom Navigation Bar cố định viền, Standard tabstrip.

**Hierarchy Fallback Matrix**:
Bản đồ định tuyến cha dự phòng trong `parentFallback.ts`, bảo đảm mọi màn hình con khi truy cập trực tiếp bằng Deep Link đều rollback an toàn về nhánh cha, không bao giờ rơi vào trạng thái cụt đường.
_Avoid_: window.history.back(), Unhandled back trap.

---

## 3. 📝 Không Gian Học Tập & Ghi Chép (Study Workspace & Stationery)

**Home Study Hub**:
Bàn học điện tử thông minh, trung tâm điều phối bài giảng đang học dở, thẻ cần ôn hôm nay và lối tắt thu âm bài giảng mới.
_Avoid_: Dashboard, Homepage, Main screen.

**Cornell Notes**:
Phương pháp ghi chép bài giảng khoa học gồm 3 khu vực phân lập: Summary (khái quát ngắn gọn), Cues (từ khóa và câu hỏi gợi mở) và Notes (chi tiết bài giảng kèm mốc thời gian `[MM:SS]`).
_Avoid_: Raw text summary, Unstructured markdown.

**Kitsune Flashcard**:
Thẻ học ghi nhớ chủ động (Active Recall) hai mặt: Mặt trước (Question Front) và Mặt sau (Answer Back), hỗ trợ lật thẻ và đánh giá 4 cấp độ ghi nhớ theo phương pháp Spaced Repetition.
_Avoid_: Anki card, Quizlet card, Plain question-answer.

**Spaced Repetition Study Hub**:
Trung tâm ôn luyện ngắt quãng hỗ trợ sinh viên củng cố tri thức theo chu kỳ quên tự nhiên của não bộ, tích hợp bộ theo dõi chuỗi ngày học (*Streak*).
_Avoid_: Flashcard list, Quiz section.

---

## 4. 📐 Thiết Kế Mã Nguồn & Ranh Giới (Matt Pocock Codebase Design)

**Module**:
Bất kỳ đơn vị mã nguồn nào sở hữu một giao diện (**Interface**) và một phần thân triển khai (**Implementation**).
_Avoid_: Component, Service, Unit (khi dùng theo nghĩa trừu tượng).

**Interface**:
Tất cả những gì người gọi (**Caller**) bắt buộc phải biết để sử dụng module một cách chính xác: chữ ký kiểu, điều kiện bất biến (invariants), thứ tự gọi, chế độ lỗi và cấu hình.
_Avoid_: API, Signature (quá hẹp, chỉ mô tả kiểu dữ liệu).

**Implementation**:
Toàn bộ mã nguồn và logic thực thi nằm bên trong module, được ẩn giấu hoàn toàn khỏi Interface.
_Avoid_: Internal logic, Body.

**Depth (Độ Sâu Của Module)**:
Tỷ lệ đòn bẩy tại giao diện: Module sâu (**Deep Module**) cung cấp khối lượng tính toán lớn ẩn sau một giao diện nhỏ gọn, súc tích. Tránh các module nông (**Shallow Module** - giao diện cồng kềnh nhưng chỉ chuyển tiếp lệnh).
_Avoid_: Code complexity, LOC size.

**Seam (Ranh Giới Thay Đổi)**:
Vị trí cho phép thay đổi hành vi của hệ thống mà không cần chỉnh sửa trực tiếp tại nơi đó; nơi Interface của module tồn tại.
_Avoid_: Boundary (tránh nhầm lẫn với Bounded Context của DDD).

**Adapter**:
Thành phần cụ thể thỏa mãn một Interface tại một Seam nhất định (ví dụ: `MemoryStorageAdapter` cho test và `AsyncStorageAdapter` cho mobile runtime).
_Avoid_: Driver, Provider (khi nói về vai trò lấp đầy seam).

**Storage Seam (`KeyValueStorage`)**:
Ranh giới lưu trữ khóa-giá trị bất đồng bộ trên client với 4 phương thức tối giản: `getItem`, `setItem`, `removeItem`, `clear`.
_Avoid_: Direct AsyncStorage coupling, window.localStorage.

**The Deletion Test**:
Phép thử xóa module: Nếu xóa module mà sự phức tạp biến mất hoàn toàn thì đó là module nông (pass-through). Nếu sự phức tạp tái xuất hiện rải rác trên N nơi gọi, module đó đang làm rất tốt vai trò của mình.
_Avoid_: Refactor test, Dead code check.

---

## 5. 🎙️ Quy Trình Thu Nạp Bài Giảng (Audio Ingest Pipeline)

**Audio Ingest Pipeline**:
Quy trình nền tự động chuyển đổi file âm thanh bài giảng thô từ thư mục dùng chung (Shared Volume) thành bản ghi lời thoại cấu trúc, gồm chuẩn hóa 16kHz Mono PCM, nhận dạng PhoWhisper và xuất bản `transcript.json`.
_Avoid_: Audio upload worker, STT queue.

**AudioStore**:
Module quản lý dữ liệu lưu trữ tập trung cho âm thanh bài giảng, định danh $O(1)$ qua `jobId`, đăng ký và xác minh checksum SHA-256, quản lý `manifest.json` theo từng tác vụ.
_Avoid_: File manager, Disk repo.

**Transcript Artifact (`transcript.json`)**:
Hợp đồng dữ liệu cấu trúc đầu ra của Giai đoạn 1 (ASR) và là đầu vào bất biến cho Giai đoạn 2 (Chunking & Embedding), chứa `full_text` và danh sách các phân đoạn không chồng lấn kèm nhãn `[MM:SS]`.
_Avoid_: Subtitle file, Text transcript, SRT file.

**Job State Machine**:
Máy trạng thái chu kỳ xử lý bài giảng: `QUEUED` $\rightarrow$ `PROCESSING_STT` $\rightarrow$ `STT_COMPLETED` $\rightarrow$ `CHUNKING` $\rightarrow$ `EMBEDDING` $\rightarrow$ `READY` (hoặc `FAILED`).
_Avoid_: Pipeline progress, Worker status.

---

## 6. 🧩 Phân Đoạn & Nhúng Vector Giai Đoạn 2 (Stage 2 Chunking & Vectorization)

**Recursive Token Chunker (`[I5]`)**:
Bộ phân đoạn đệ quy cấp token chuyển đổi `transcript.json` thành các phân đoạn ngữ nghĩa tối đa 512 token (kèm vùng gối đầu 64 token và nội suy mốc thời gian `[MM:SS]`).
_Avoid_: Character splitter, Fixed-length slicer, Naive chunker.

**BGE-M3 Dual Embedder (`[I6]`)**:
Thành phần trích xuất vector kép từ mô hình BGE-M3 cục bộ, sinh đồng thời vector đặc 1024 chiều chuẩn hóa nửa độ chính xác (`halfvec(1024)`) và trọng số từ vựng học được cho từng phân đoạn hoặc câu truy vấn.
_Avoid_: Dense-only embedder, FlagEmbedding wrapper, Cloud embedding API.

**Lexical Weights (`JSONB`)**:
Bản đồ trọng số từ vựng học được (`"token": weight`) trích xuất từ đầu tuyến tính thưa của BGE-M3 và lưu ở định dạng `JSONB` để hỗ trợ đối chiếu thuật ngữ chuyên ngành.
_Avoid_: TF-IDF map, Raw BM25 bag, Sparse matrix blob.

**Doubly-Linked Chunks**:
Chuỗi phân đoạn liên kết hai chiều qua cặp khóa `prev_chunk_id` và `next_chunk_id`, cho phép mở rộng ngữ cảnh ba chiều (`PREVIOUS`, `CURRENT`, `NEXT`) tức thì cho LLM.
_Avoid_: Flat chunk list, Orphan chunks, Ad-hoc neighbor query.

**Chunks Artifact (`chunks.json`)**:
Hợp đồng dữ liệu bất biến đầu ra của Giai đoạn 2 lưu trên volume chia sẻ theo `jobId`, chứa danh sách phân đoạn, vector `embedding_half`, `lexical_weights` và liên kết hai chiều trước khi đồng bộ vào PostgreSQL `pgvector`.
_Avoid_: Embedding dump, Vector cache file, Temp chunk list.

**Sequential VRAM Offloading**:
Chiến lược giải phóng tuần tự mô hình khỏi bộ nhớ GPU (`LOW_VRAM_MODE`) giữa Giai đoạn 1 (PhoWhisper ASR) và Giai đoạn 2 (BGE-M3 Dual Embedder) để vận hành an toàn trên phần cứng 4 GB VRAM.
_Avoid_: Simultaneous model pinning, Multi-GPU sharding, Model eviction hack.
