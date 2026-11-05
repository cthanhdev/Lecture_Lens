# 🤖 LectureLens Agent Constitution & Engineering Guidelines

Tài liệu này là **Hiến Chương Kỹ Thuật (Constitution)** bắt buộc dành cho tất cả các AI Agents (Antigravity, Claude, Copilot, Cursor,...) khi tham gia đọc, thiết kế, tái cấu trúc hoặc sinh mã nguồn trong kho lưu trữ **LectureLens**.

---

## 1. ⚡ Tech Stack Thực Tế Của Dự Án (Actual Tech Stack)

> [!CAUTION]
> **TUYỆT ĐỐI KHÔNG TỰ Ý SINH MÃ REACT NATIVE / EXPO CŨ!**
> Dự án đã chuyển đổi hoàn toàn cấu trúc Frontend sang Web Application hiện đại tại thư mục `frontend/`. Không được tham chiếu hay sinh mã cho thư mục `FE/` (đã bị xóa).

### Frontend Web (`frontend/`)
- **Runtime & Bundler**: Node.js 20+, [Vite 8](https://vitejs.dev/)
- **Framework**: [React 19](https://react.dev/) + [TypeScript 5.8+](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`) + [Framer Motion](https://www.framer.com/motion/)
- **3D Graphics & Canvas**: [Three.js](https://threejs.org/) + [@react-three/fiber](https://r3f.docs.pmnd.rs/) + [@react-three/drei](https://github.com/pmndrs/drei)
- **Linter**: [oxlint](https://oxc.rs/) (Siêu tốc độ, thay thế ESLint truyền thống)

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

## 2. 🛡️ Quy Tắc Bất Biến & An Ninh (Invariants & Security)

1. **Privacy-First & Zero Cloud Leakage (ADR 0001):**
   - Tuyệt đối không tích hợp các API đám mây bên thứ ba (OpenAI, Anthropic, Google Cloud Speech, AWS Transcribe, Pinecone,...) cho các tác vụ xử lý bài giảng.
   - Toàn bộ pipeline ASR, Embeddings, Reranking và LLM phải chạy 100% cục bộ trên hạ tầng on-premise.
2. **Tuân Thủ Ngôn Ngữ Miền (Ubiquitous Language):**
   - Luôn đọc và đối chiếu thuật ngữ với [GLOSSARY.md](./GLOSSARY.md).
   - Dùng đúng `LectureLens` (không dùng `SmartLecture`, `LectureApp`), dùng đúng `Capsule Audio Player`, `Cornell Notes`, `2-Stage Neural RAG`.
3. **Bảo Tồn Ranh Giới (Seams):**
   - Client (`frontend/`) không bao giờ truy vấn trực tiếp cơ sở dữ liệu hoặc AI model weights. Mọi luồng đi qua Gateway hoặc Backend API.

---

## 3. 🛠️ Quy Trình Kỹ Thuật (Engineering Skills Integration)

Dự án tích hợp sâu hai hệ thống kỹ năng tại `.agents/skills/`:

### A. Matt Pocock Engineering Skills (`.agents/skills/`)
- **`codebase-design`**: Luôn thiết kế module sâu (**Deep Modules**). Giữ Interface nhỏ gọn, súc tích; ẩn giấu toàn bộ tính toán phức tạp vào Implementation. Xác định rõ ràng vị trí của Seam (ranh giới thay đổi) và Adapter.
- **`domain-modeling`**: Mọi khái niệm mới trong code phải được phản ánh trong `GLOSSARY.md` và tuân thủ các ADR trong `docs/adr/`.
- **`tdd`**: Viết kiểm thử trước khi hiện thực hóa logic (Red-Green-Refactor). Kiểm thử thông qua Interface, không kiểm thử xuyên qua chi tiết nội bộ (Test through the seam).
- **`code-review`**: Đánh giá thay đổi theo hai trục: Tiêu chuẩn mã nguồn (Standards) và Đặc tả yêu cầu (Spec).

### B. Understand Anything Skills (`.agents/skills/`)
- **`/understand`**: Quét codebase để cập nhật Knowledge Graph tương tác (`.ua/manifest.json`).
- **`/understand-dashboard`**: Mở dashboard trực quan hóa phụ thuộc và kiến trúc lớp.
- **`/understand-explain <path>`**: Phân tích sâu ngữ cảnh và luồng chạy của bất kỳ tệp hay hàm nào.
- **`/understand-diff`**: Dự báo rủi ro và phạm vi ảnh hưởng trước khi commit.

---

## 4. 🚀 Lệnh Thao Tác Chuẩn Của Repository

Thực thi trực tiếp từ thư mục gốc thông qua npm scripts:

```bash
# Frontend Development Server (Port 5173)
npm run dev

# Kiểm tra kiểu dữ liệu TypeScript & Build kiểm tra
npm run build
npm run typecheck

# Kiểm tra chuẩn linter mã nguồn
npm run lint

# Xem trước bản build Production
npm run preview

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
