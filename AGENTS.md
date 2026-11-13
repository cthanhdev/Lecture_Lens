# 🤖 LectureLens Agent Constitution & Engineering Guidelines

Tài liệu này là **Hiến Chương Kỹ Thuật (Constitution)** bắt buộc dành cho tất cả các AI Agents (Antigravity, Claude, Copilot, Cursor,...) khi tham gia đọc, thiết kế, tái cấu trúc hoặc sinh mã nguồn trong kho lưu trữ **LectureLens**.

---

## 1. ⚡ Tech Stack Thực Tế Của Dự Án (Actual Tech Stack)

> [!IMPORTANT]
> **📱 BẢN CHẤT DỰ ÁN: ĐÂY LÀ ỨNG DỤNG DI ĐỘNG NATIVE 100% (EXPO SDK 58 / REACT NATIVE)!**
> - **LectureLens là một Mobile App 100%**: Xây dựng trên nền tảng **Expo SDK 58** (React Native 0.88+, New Architecture enabled) đặt tại thư mục `mobile/`.
> - **Tỷ lệ chuẩn (Target Viewport)**: Chiều rộng tham chiếu là **`390px`** (dựa trên toàn bộ 28 tệp thiết kế SVG/PNG mẫu bảo tồn tại `docs/design-assets/screens/`).
> - **TUYỆT ĐỐI KHÔNG THIẾT KẾ DÀN TRẢI KIỂU WEB DESKTOP!** Mọi thành phần (Header, Hero, Bento Card, Floating Island Tab Bar, Capsule Audio Player) đều phải tối ưu cho ngón tay cái (**Thumb Zone**) với chiều cao tương tác tối thiểu `44px` - `52px`.
> - **Native Safe Areas**: Sử dụng `react-native-safe-area-context` và `expo-status-bar` để xử lý tràn viền tự nhiên, tai thỏ / Dynamic Island và Home Indicator của hệ điều hành.

### Mobile App (`mobile/`)
- **Runtime & Framework**: Node.js 20+, [Expo SDK 58](https://expo.dev/) (React Native 0.88.1, React 19.3.0, TypeScript 5.8+ Strict Mode)
- **File-based Navigation**: [Expo Router v58](https://docs.expo.dev/router/introduction/) (Tabs, Stacks, Modals, Protected routes)
- **Design System**: **Kitsune Soft** ("kawaii-calm" Japanese soft-minimalism), chi tiết tại [`docs/design-system.md`](./docs/design-system.md)
- **Linh Vật**: **Cáo Kitsune Pixel Art (Kitsune Fox Companion)**
- **Kiểu Chữ**: **Plus Jakarta Sans** (`@expo-google-fonts/plus-jakarta-sans`)
- **2D Canvas & Fluid Graphics**: [@shopify/react-native-skia](https://shopify.github.io/react-native-skia/) (Hiệu năng cao 60–120 FPS cho Linh vật Kitsune và cánh hoa rơi `FloatingPetals2D`)
- **Động Lực Học & Xúc Giác**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) + [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) (Mochi press `scale 0.97` / 150ms)
- **Audio Engine**: [expo-audio](https://docs.expo.dev/versions/latest/sdk/audio/) + [expo-blur](https://docs.expo.dev/versions/latest/sdk/blur/) (Miruku Glass Capsule Audio Player)
- **Storage Seam**: [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) (trừu tượng hóa qua `KeyValueStorage` interface)
- **Network Monitor**: [@react-native-community/netinfo](https://github.com/react-native-netinfo/react-native-netinfo)
- **Build Pipeline**: EAS Build (`mobile/eas.json` profiles: `development`, `preview`, `production`)

### Backend & AI Engine (`backend/`)
- **API Gateway Service (Ingress)**: Java 21, Spring Boot 3.3 (Cổng công khai `8080`, xác thực JWT, RBAC, Audio Upload)
- **AI & RAG Service (Internal Engine)**: Python 3.10+, FastAPI 0.111 (Cổng nội bộ `8000`, bảo vệ bằng `X-Internal-Secret`)
- **Vector Database**: PostgreSQL 16 + `pgvector` 0.7+ (Chỉ mục HNSW, cosine distance, schema phân vùng `app` và `rag`)
- **Local AI Models (On-Premise Weights)**:
  - ASR Tiếng Việt: `phowhisper-base` (tự động gán timestamp `[MM:SS]`)
  - Dense Embedding: `bge-m3` (1024 chiều)
  - Cross-Encoder Reranker: `bge-reranker-v2-m3`
  - Contextual LLM: `gemma-4-e4b` chạy trên máy chủ Ollama cục bộ

---

## 2. 🌸 Quy Chuẩn Thiết Kế Bắt Buộc (UI/UX Design Invariants)

Mọi mã nguồn giao diện được sinh ra trong thư mục `mobile/` bắt buộc phải tuân thủ nghiêm ngặt hệ thống thiết kế **Kitsune Soft**:

1. **Bảng màu bất biến (Color Invariants):**
   - **Canvas Nền**: Luôn là Giấy Washi ấm `#FFF7FD` (`washi-cream`), tuyệt đối không dùng nền trắng tinh `#FFFFFF` làm nền chính của trang.
   - **Màu Nhận Diện (Primary)**: San hô Kitsune `#F47F72` (`kitsune-coral`) cho nút CTA, viền focus, trạng thái kích hoạt.
   - **Màu Mực (Text Ink)**: Mực mận chín `#261333` (`plum-ink`) đạt chuẩn tương phản cao cấp WCAG AAA, tuyệt đối không dùng màu đen `#000000` thô ráp.
   - **Màu Bổ Trợ**: Sakura Pink `#F5C3C9`, Mist Sky `#A9D4E8`, Mochi Yellow `#FFE27A`, Matcha Mint `#BEE1D0`.
2. **Hình dạng & Bo góc (Shapes & Radii):**
   - **Điều khiển tương tác**: Nút bấm, trường nhập liệu, chip lọc, badge phân loại luôn dùng hình viên thuốc tuyệt đối (**Pill Shape** - `9999px` / `rounded-full`).
   - **Thẻ nội dung Bento**: Bo góc Squircle bầu bĩnh từ **`24px` đến `32px`** (`rounded-2xl` đến `rounded-3xl`).
3. **Bề mặt kính mờ (Miruku Glass):**
   - Thẻ card sử dụng nền kính sữa trong suốt `rgba(255, 255, 255, 0.76)` kết hợp `backdrop-blur: 16px` (hoặc `expo-blur`) và bóng đổ mận chín ấm `rgba(38, 19, 51, 0.06)`.
4. **Động lực học Mochi (Mochi Tactile Press):**
   - Các phần tử tương tác (button, card) khi nhấn (`active` state) phải thu nhỏ nhẹ `scale(0.97)` trong thời gian `0.15s` kết hợp rung xúc giác nhẹ qua `expo-haptics`.
5. **Đối chiếu màn hình mẫu:**
   - Luôn đối chiếu với **28 tệp màn hình mẫu** tại `docs/design-assets/screens/svg/` và `docs/design-assets/screens/png/` trước khi xây dựng bất kỳ màn hình hoặc component mới nào.
6. **Quy Chuẩn Biểu Tượng & Nút Bấm Độc Quyền (Icons & UI Atoms Invariant):**
   - **BẮT BUỘC** sử dụng bộ 74 Icon chuẩn hóa tại `mobile/src/components/ui/icons/` (dựa trên tệp nguồn tại `docs/design-assets/icons/`) và bộ Button viên thuốc tại `mobile/src/components/ui/button/`.
   - **TUYỆT ĐỐI KHÔNG TỰ Ý VẼ LẠI INLINE SVG** trong các component giao diện.
   - **TUYỆT ĐỐI KHÔNG DÙNG THƯ VIỆN BÊN NGOÀI TÙY TIỆN** (như `lucide-react`, `heroicons`,...) làm phá vỡ nét vẽ `1.75px` và phong cách Duotone Soft-Blob của Kitsune Soft. Chi tiết tra cứu tại `mobile/src/components/ui/icons/README.md`.
7. **Quy Chuẩn Định Dạng Ứng Dụng Di Động Native (Native Mobile Format Invariant):**
   - **Tỷ lệ chuẩn (Target Viewport)**: Chiều rộng tham chiếu là `390px`.
   - **Native Safe Areas**: Luôn chừa khoảng cách an toàn cho Status Bar (tai thỏ / Dynamic Island) ở đỉnh màn hình và Home Indicator ở đáy màn hình bằng `react-native-safe-area-context`.
   - **Vùng chạm ngón tay (Touch Targets)**: Tất cả nút bấm, thanh điều hướng nổi (`FloatingIslandTabBar`), và `CapsuleAudioPlayer` phải được tối ưu cho ngón tay cái (Thumb Zone), chiều cao tối thiểu `44px` - `52px`.
8. **Quy Chuẩn Ngôn Ngữ Giao Diện (UI Copy Language Invariant):**
   - **Ngôn ngữ hiển thị trên UI là Tiếng Anh (English 100%)**: Mọi tiêu đề màn hình, nhãn điều hướng (tab bar, button, badge, chip, placeholder, thông báo hệ thống) trong `mobile/` bắt buộc dùng **Tiếng Anh**, khớp 1:1 với 28 tệp thiết kế mẫu tại `docs/design-assets/screens/`. Tài liệu hướng dẫn và bình luận kỹ thuật có thể dùng Tiếng Việt/Anh, nhưng văn bản hiển thị cho người dùng trên giao diện ứng dụng luôn là **Tiếng Anh** (không tự ý dịch ngược hoặc hỏi lại).

---

## 3. 🛡️ Quy Tắc Kỹ Thuật & An Ninh (Invariants & Security)

1. **Privacy-First & Zero Cloud Leakage ([ADR 0001](./docs/adr/0001-privacy-first-local-ai-architecture.md)):**
   - Tuyệt đối không tích hợp các API đám mây bên thứ ba (OpenAI, Anthropic, Google Cloud Speech, AWS Transcribe, Pinecone,...) cho các tác vụ xử lý bài giảng.
   - Toàn bộ pipeline ASR, Embeddings, Reranking và LLM phải chạy 100% cục bộ trên hạ tầng on-premise.
2. **Audio Ingest Handshake & Shared Volume ([ADR 0002](./docs/adr/0002-audio-ingest-storage-and-transcript.md)):**
   - Trao đổi âm thanh giữa Spring Boot Gateway và FastAPI AI Service thực hiện qua volume chia sẻ và `jobId` định danh $O(1)$; tệp `transcript.json` là hợp đồng dữ liệu bất biến giữa ASR (Giai đoạn 1) và Vectorization (Giai đoạn 2).
3. **Kiến Trúc Di Động Native 100% ([ADR 0003](./docs/adr/0003-native-mobile-architecture-expo-sdk58.md)):**
   - Ứng dụng khách chính thức là Mobile App trên Expo SDK 58 (`mobile/`). Web study portal cũ đã được đóng gói và lưu trữ tại `legacy/web-frontend/` (không phát triển tính năng mới vào đây).
4. **Tuân Thủ Ngôn Ngữ Miền (Ubiquitous Language):**
   - Luôn đọc và đối chiếu thuật ngữ với [GLOSSARY.md](./GLOSSARY.md).
   - Dùng đúng `LectureLens` (không dùng `SmartLecture`, `LectureApp`), dùng đúng `Kitsune Soft`, `Kitsune Fox Companion`, `Capsule Audio Player`, `Cornell Notes`, `2-Stage Neural RAG`.
5. **Bảo Tồn Ranh Giới (Seams):**
   - Client (`mobile/`) không bao giờ truy vấn trực tiếp cơ sở dữ liệu hoặc AI model weights. Mọi luồng đi qua Gateway hoặc Backend API.

---

## 4. 🛠️ Quy Trình Kỹ Thuật (Engineering Skills Integration)

Dự án tích hợp sâu hai hệ thống kỹ năng tại `.agents/skills/`:

### A. Matt Pocock Engineering Skills (`.agents/skills/`)
- **`codebase-design`**: Luôn thiết kế module sâu (**Deep Modules**). Giữ Interface nhỏ gọn, súc tích; ẩn giấu toàn bộ tính toán phức tạp vào Implementation. Xác định rõ ràng vị trí của Seam (ranh giới thay đổi) và Adapter (ví dụ: `KeyValueStorage` với `MemoryStorageAdapter` cho test và `AsyncStorageAdapter` cho mobile runtime).
- **`domain-modeling`**: Mọi khái niệm mới trong code phải được phản ánh trong `GLOSSARY.md` và tuân thủ các ADR trong `docs/adr/`.
- **`tdd`**: Viết kiểm thử trước khi hiện thực hóa logic (Red-Green-Refactor). Kiểm thử thông qua Interface, không kiểm thử xuyên qua chi tiết nội bộ (Test through the seam).
- **`code-review`**: Đánh giá thay đổi theo hai trục: Tiêu chuẩn mã nguồn (Standards) và Đặc tả yêu cầu (Spec).

### B. Understand Anything Skills (`.agents/skills/`)
- **`/understand`**: Quét codebase để cập nhật Knowledge Graph tương tác (`.ua/manifest.json`).
- **`/understand-dashboard`**: Mở dashboard trực quan hóa phụ thuộc và kiến trúc lớp.
- **`/understand-explain <path>`**: Phân tích sâu ngữ cảnh và luồng chạy của bất kỳ tệp hay hàm nào.
- **`/understand-diff`**: Dự báo rủi ro và phạm vi ảnh hưởng trước khi commit.

---

## 5. 🚀 Lệnh Thao Tác Chuẩn Của Repository

Thực thi trực tiếp từ thư mục gốc thông qua npm scripts:

```bash
# Khởi chạy Expo Development Server
npm run start
npm run dev

# Chạy trực tiếp trên thiết bị hoặc máy ảo
npm run android
npm run ios
npm run web

# Kiểm tra bộ kiểm thử tự động (Node Native Test Runner)
npm test

# Kiểm tra kiểu dữ liệu TypeScript (Strict Mode)
npm run typecheck

# Kiểm tra chuẩn linter mã nguồn Expo
npm run lint

# Quét phân tích cấu trúc mã nguồn (Understand Anything)
npm run understand:scan

# Khởi chạy dashboard phân tích kiến trúc
npm run understand:dashboard
```

Đối với Backend:
```bash
# Kiểm tra cấu hình và kết nối cơ sở dữ liệu RAG
python backend/db/verify_rag_db.py

# Tải bổ sung trọng số mô hình nếu thiếu
python backend/download_models.py
```
