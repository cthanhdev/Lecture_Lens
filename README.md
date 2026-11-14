<div align="center">

<img src="./docs/design-assets/branding/logo-LectureLens.png" alt="LectureLens Logo" width="130" height="130" style="border-radius: 28px; box-shadow: 0 12px 32px rgba(38, 19, 51, 0.12);" />

# 🦉 LectureLens

### Nền Tảng Học Tập Thông Minh & Trợ Lý Bài Giảng AI Tiếng Việt
**Biến đổi bản ghi âm bài giảng thành sổ tay tri thức tương tác — Kiến trúc Mobile Native & On-Premise 2-Stage Neural RAG bảo mật tuyệt đối.**

<br/>

[![Expo SDK 58](https://img.shields.io/badge/Expo-SDK%2058-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native 0.88](https://img.shields.io/badge/React%20Native-0.88.1%20(New%20Arch)-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript 5.8 Strict](https://img.shields.io/badge/TypeScript-5.8%20(Strict)-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Shopify Skia](https://img.shields.io/badge/Shopify%20Skia-2D%20Canvas%20120FPS-FF5722?style=for-the-badge)](https://shopify.github.io/react-native-skia/)
[![Spring Boot 3.3](https://img.shields.io/badge/Spring%20Boot-3.3.x-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL 16 + pgvector](https://img.shields.io/badge/PostgreSQL%2016-pgvector%200.7+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Ollama Gemma 4](https://img.shields.io/badge/Ollama-Gemma%204%20E4B-111111?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai/)
[![Mobile Tests](https://img.shields.io/badge/Mobile%20Tests-31%20passed-brightgreen?style=for-the-badge)](./mobile)
[![Backend Tests](https://img.shields.io/badge/Backend%20Tests-65%20passed-brightgreen?style=for-the-badge)](./backend)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue?style=for-the-badge)](./LICENSE)

<br/>

[Tổng Quan](#-1-tổng-quan-dự-án-overview) • [Tính Năng Cốt Lõi](#-2-tính-năng-cốt-lõi-core-features) • [Ngôn Ngữ Thiết Kế Kitsune Soft](#-3-ngôn-ngữ-thiết-kế-kitsune-soft-design-system) • [Kiến Trúc Kỹ Thuật](#-4-kiến-trúc-hệ-thống-system-architecture) • [Bộ Mô Hình AI Cục Bộ](#-5-bộ-mô-hình-ai-on-premise-local-weights) • [Cơ Sở Dữ Liệu Vector Multi-Schema](#-6-cơ-sở-dữ-liệu-vector-multi-schema-database) • [Cấu Trúc Thư Mục](#-7-cấu-trúc-thư-mục-repository-structure) • [Hướng Dẫn Cài Đặt](#-8-hướng-dẫn-cài-đặt--vận-hành-quickstart) • [Quy Chuẩn Kỹ Sư](#-9-quy-chuẩn-kỹ-sư--triết-lý-phần-mềm-engineering-constitution)

</div>

---

## 📖 1. Tổng Quan Dự Án (Overview)

Trong các giảng đường đại học và môi trường nghiên cứu chuyên sâu, sinh viên thường xuyên đối mặt với **áp lực kép**: vừa phải tập trung nghe giảng viên phân tích các khái niệm trừu tượng, vừa phải cặm cụi ghi chép tài liệu. Việc nghe lại toàn bộ bản ghi âm bài giảng dài từ 2 đến 3 tiếng là một sự lãng phí thời gian khổng lồ trong mùa thi cử.

**LectureLens** ra đời như một **Bàn Học Điện Tử Di Động Thông Minh (Smart Study Hub)** được may đo riêng cho người học Việt Nam:
1. **Ứng dụng di động Native 100% ([ADR 0003](./docs/adr/0003-native-mobile-architecture-expo-sdk58.md)):** Xây dựng trên **Expo SDK 58** (React Native 0.88.1 New Architecture), tối ưu hoàn hảo cho ngón tay cái (**Thumb Zone**) trên khung nhìn chuẩn **`390px`**, tôn trọng Native Safe Areas và vận hành trình phát âm thanh liên tục trong nền (`expo-audio`).
2. **Thu âm & Chuyển đổi chính xác cao ([ADR 0002](./docs/adr/0002-audio-ingest-storage-and-transcript.md)):** Sử dụng mô hình nhận dạng giọng nói tiếng Việt chuyên biệt (`PhoWhisper-base` / `PhoWhisper-medium`), tự động tách câu và gắn mốc thời gian (*Timestamps*) theo định dạng `[MM:SS]`.
3. **Cấu trúc hóa tri thức tự động:** Chuyển đổi nội dung bài giảng thành hệ thống ghi chép khoa học chuẩn **Cornell Notes** (Summary tổng quan, Cues từ khóa trọng tâm, và Notes chi tiết).
4. **Truy vấn ngữ nghĩa 2 giai đoạn (2-Stage Neural RAG):** Cho phép người học đặt câu hỏi trực tiếp trên toàn bộ kho bài giảng, nhận câu trả lời súc tích kèm mốc thời gian dẫn nguồn chính xác để bấm vào nghe lại tức thì.
5. **Bộ công cụ ôn tập cá nhân hóa:** Tự động trích xuất thẻ học **Kitsune Flashcard** hai mặt (Active Recall & Spaced Repetition) liên kết trực tiếp với đoạn phát lại âm thanh gốc.
6. **Linh vật Cáo Kitsune Skia 2D Canvas:** Người bạn đồng hành AI được thể hiện bằng Pixel Art Nhật Bản trên nền tảng **Shopify Skia 2D Canvas** (`FloatingPetals2D` & `KitsuneMascotCanvas`), đạt tần số 60–120 FPS mượt mà và tiết kiệm pin.

> [!IMPORTANT]
> **Triết lý Bất Biến — Privacy-First & Zero Cloud Leakage ([ADR 0001](./docs/adr/0001-privacy-first-local-ai-architecture.md)):**  
> Toàn bộ pipeline ASR, Vectorization, Reranking và LLM Inference được thực thi **100% cục bộ (On-Premise)** trên máy chủ hoặc máy trạm của tổ chức giáo dục.  
> **Cam kết không bao giờ truyền bất kỳ byte âm thanh, văn bản ghi chép hay vector bài giảng nào ra dịch vụ đám mây công cộng bên thứ ba.**

---

## ✨ 2. Tính Năng Cốt Lõi (Core Features)

```
                       🎙️ BÀI GIẢNG ÂM THANH (AUDIO INGEST)
                                      │
                                      ▼
               ⚡ NHẬN DẠNG TIẾNG NÓI TIẾNG VIỆT (PhoWhisper)
                     (Tự động gán mốc thời gian [MM:SS])
                                      │
                                      ▼
               📑 PHÂN ĐOẠN ĐỆ QUY & NHÚNG VECTOR (BGE-M3)
                     (512 tokens / 64 overlap, 1024 chiều)
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
     🔍 2-STAGE NEURAL RAG                     📝 SMART STATIONERY STUDY
     • 3-Stream Hybrid Search (RRF)            • Ghi chép khoa học Cornell Notes
     • Cross-Encoder (BGE-Reranker-v2-m3)      • Kitsune Flashcard (Active Recall)
     • Ollama Gemma 4 E4B (Grounded)           • Lặp lại ngắt quãng Spaced Repetition
     • Trích dẫn mốc thời gian [MM:SS]         • Linh vật Cáo Kitsune Skia 2D Canvas
```

### 2.1. 🎙️ Nhận Dạng Giọng Nói Chuyên Biệt Cho Tiếng Việt (Vietnamese ASR)
- Ứng dụng mô hình **PhoWhisper** (`phowhisper-base` / `phowhisper-medium`) được huấn luyện tối ưu cho ngữ điệu học thuật, thuật ngữ chuyên ngành và các phương ngữ địa phương Việt Nam.
- Gán timestamp `[MM:SS]` chính xác đến từng câu nói. Khi bấm vào bất kỳ dòng văn bản nào trên giao diện, trình phát âm thanh sẽ tự động nhảy đến đúng thời điểm giảng viên phát biểu.

### 2.2. 🔍 Truy Vấn Ngữ Nghĩa Hai Giai Đoạn (2-Stage Neural RAG)
- **Giai đoạn 1 — Candidate Retrieval:** Truy vấn lai 3 luồng đồng thời (**Dense HNSW Vector** + **Full-Text Search TSVECTOR** + **Trigram pg_trgm Fuzzy**) được hợp nhất bằng thuật toán **Reciprocal Rank Fusion (RRF)** để trích xuất nhanh Top-25 phân đoạn tiềm năng.
- **Giai đoạn 2 — Deep Precision Reranking:** Bộ tái định vị Cross-Encoder **BGE-Reranker-v2-m3** chấm điểm tương quan cặp (Query - Passage), loại bỏ triệt để các đoạn văn bản gây nhiễu và chọn lọc Top 3–5 đoạn đắt giá nhất.
- **Suy luận có dẫn nguồn (Grounded Generation):** Mô hình **Gemma 4 E4B** (qua Ollama) tổng hợp câu trả lời dựa trên văn cảnh trích xuất, bắt buộc đính kèm trích dẫn `[MM:SS]`, triệt tiêu hoàn toàn hiện tượng ảo giác (hallucination).

### 2.3. 🗂️ Bộ Công Cụ Học Tập Thông Minh (Smart Stationery)
- **Cấu Trúc Cornell Notes:** Bố cục 3 phần khoa học gồm Summary (khái quát nhanh), Cues (thuật ngữ trọng tâm, gợi ý câu hỏi) và Notes (nội dung bài giảng chi tiết).
- **Kitsune Flashcard (Active Recall & Spaced Repetition):** Thẻ học lật hai mặt (Front: Câu hỏi kích thích tư duy; Back: Lời giải thích, đánh giá mức độ ghi nhớ và lối tắt phát lại đúng đoạn âm thanh bài giảng).
- **Capsule Audio Player:** Trình phát bài giảng dạng con nhộng ghim cố định ở đáy màn hình, hỗ trợ phát ngầm liên tục qua `expo-audio`, điều chỉnh đa tốc độ (`0.75x` đến `2.0x`) và tua nhanh/chậm 10 giây.
- **Floating Island Tab Bar:** Thanh điều hướng 5 đảo nổi cách đáy màn hình 16px với nền kính sữa Miruku Glass và con trỏ trượt san hô mềm.

### 2.4. 🦊 Linh Vật Cáo Kitsune Skia 2D Canvas (Kitsune Fox Companion)
- Linh vật Cáo trắng Kitsune Pixel Art được dựng bằng **Shopify Skia 2D Vector Canvas** (`@shopify/react-native-skia`), kết hợp hiệu ứng cánh hoa anh đào rơi (`FloatingPetals2D`), đem lại trải nghiệm học tập ấm áp, thanh bình ở tần số 60–120 FPS.

---

## 🌸 3. Ngôn Ngữ Thiết Kế: Kitsune Soft (Design System)

Giao diện LectureLens được xây dựng dựa trên hệ thống thiết kế độc quyền **Kitsune Soft** (*"Kawaii-Calm" Japanese Soft-Minimalism*) — lấy cảm hứng từ bàn học tối giản, ấm cúng của sinh viên Nhật Bản (chi tiết tại [`docs/design-system.md`](./docs/design-system.md)):

### 3.1. Bảng Màu Cốt Lõi (Color Palette Tokens)

| Token Thiết Kế | Mã Màu HEX | Hằng Số TypeScript (`mobile/src/theme/tokens.ts`) | Vai Trò & Vị Trí Áp Dụng |
| :--- | :---: | :--- | :--- |
| **`washi-cream`** | `#FFF7FD` | `KITSUNE_COLORS.washiCream` | Nền canvas toàn bộ ứng dụng: Giấy Washi ngà ấm áp, chống mỏi mắt |
| **`kitsune-coral`** | `#F47F72` | `KITSUNE_COLORS.kitsuneCoral` | San hô Kitsune: Màu thương hiệu chính (Primary CTA, viền focus, active) |
| **`kitsune-coral-dark`** | `#A03F36` | `KITSUNE_COLORS.kitsuneCoralDark` | San hô sẫm: Viền nhấn & trạng thái active |
| **`sakura-pink`** | `#F5C3C9` | `KITSUNE_COLORS.sakuraPink` | Hồng hoa anh đào: Badge phân loại môn học, điểm nhấn linh vật |
| **`mist-sky`** | `#A9D4E8` | `KITSUNE_COLORS.mistSky` | Xanh sương lam: Thanh tiến độ học tập, thông báo hệ thống cân bằng |
| **`mochi-yellow`** | `#FFE27A` | `KITSUNE_COLORS.mochiYellow` | Vàng mochi: Đánh dấu sao yêu thích, khối tóm tắt Cornell, huy hiệu |
| **`matcha-mint`** | `#BEE1D0` | `KITSUNE_COLORS.matchaMint` | Xanh trà matcha: Trạng thái hoàn thành, nhãn timestamp `[MM:SS]` |
| **`plum-ink`** | `#261333` | `KITSUNE_COLORS.plumInk` | Mực mận chín cao cấp: Toàn bộ chữ tiêu đề, nội dung và nét icon (**WCAG AAA**) |
| **`plum-ink-muted`** | `#56423F` | `KITSUNE_COLORS.plumInkMuted` | Chữ phụ đề, văn bản thứ cấp |
| **`plum-ink-subtle`** | — | `KITSUNE_COLORS.plumInkSubtle` | Placeholder, viền kẻ mờ (`rgba(86,66,63,0.50)`) |

### 3.2. Bề Mặt & Động Lực Học (Surfaces & Mochi Physics)
- **Kính Mờ Sữa (Miruku Glass):** Nền thẻ card bán trong suốt `rgba(255, 255, 255, 0.76)` kết hợp `<BlurView>` của `expo-blur` và bóng đổ mận chín `rgba(38, 19, 51, 0.06)` (`KITSUNE_SHADOWS.miruku`).
- **Bo Góc Squircle & Pill:** Bo góc Squircle `28px` (`KITSUNE_RADII.squircleCard`) cho các thẻ Bento bài học và bo tròn tuyệt đối `9999px` (`KITSUNE_RADII.pill`) cho toàn bộ nút bấm, trường nhập liệu, chip lọc.
- **Động Lực Học Mochi (Mochi Press Depth):** Mọi nút bấm và thẻ tương tác khi nhấn co nhẹ `scale(0.97)` trong thời gian `0.15s` qua `react-native-reanimated` kết hợp rung xúc giác nhẹ qua `expo-haptics`.
- **Hệ Thống 74 Biểu Tượng Chuẩn Hóa:** Bộ icon độc quyền Duotone Soft-Blob tại `mobile/src/components/ui/icons/` (tra cứu chi tiết tại [`mobile/src/components/ui/icons/README.md`](./mobile/src/components/ui/icons/README.md)).

### 3.3. Danh Mục 28 Màn Hình Mẫu Chuẩn Hóa

Toàn bộ 28 màn hình đã được đối soát nội dung và đồng bộ hóa danh xưng 1:1 giữa hai định dạng:
- Vector SVG: [`docs/design-assets/screens/svg/`](./docs/design-assets/screens/svg/)
- Raster PNG (4x): [`docs/design-assets/screens/png/`](./docs/design-assets/screens/png/)
- Bản đồ luồng điều hướng: [`docs/UX-NAVIGATION-FLOW.md`](./docs/UX-NAVIGATION-FLOW.md)

<details>
<summary><b>👉 Nhấn vào đây để xem chi tiết danh sách 28 màn hình chuẩn hóa</b></summary>
<br/>

| STT | Tên Tệp Chuẩn Hóa (`.svg` / `.png`) | Nhóm Nghiệp Vụ | Đường Dẫn Route Expo Router (`mobile/src/app`) |
| :---: | :--- | :--- | :--- |
| **01** | `01 - Splash - App Launch` | Khởi Động | `app/index.tsx` |
| **02** | `02 - Onboarding - Step 1 (Record or Upload)` | Onboarding | `app/(onboarding)/step-1.tsx` |
| **03** | `03 - Onboarding - Step 2 (Find What Matters)` | Onboarding | `app/(onboarding)/step-2.tsx` |
| **04** | `04 - Onboarding - Step 3 (Remember It)` | Onboarding | `app/(onboarding)/step-3.tsx` |
| **05** | `05 - Auth - Sign In` | Xác Thực | `app/(auth)/sign-in.tsx` |
| **06** | `06 - Auth - Create Account` | Xác Thực | `app/(auth)/create-account.tsx` |
| **07** | `07 - Paywall - Kitsune Plus Subscription` | Gói Dịch Vụ | `app/(modal)/paywall.tsx` |
| **08** | `08 - Home - Study Hub Dashboard` | Bàn Học Chính | `app/(tabs)/home.tsx` |
| **09** | `09 - Home - Offline State` | Trạng Thái | `app/(tabs)/home.tsx` (offline overlay) |
| **10** | `10 - Library - Lecture Archive` | Thư Viện | `app/(tabs)/library.tsx` |
| **11** | `11 - Library - Empty State` | Thư Viện | `app/(tabs)/library.tsx` (empty overlay) |
| **12** | `12 - Library - Offline State` | Thư Viện | `app/(tabs)/library.tsx` (vault offline) |
| **13** | `13 - Audio - Add Audio Bottom Sheet` | Ghi Âm | `app/(modal)/add-audio.tsx` |
| **14** | `14 - Audio - Live Recording` | Ghi Âm | `app/(guarded)/audio/record.tsx` |
| **15** | `15 - Audio - Processing Pipeline` | Xử Lý AI | `app/(guarded)/audio/processing/[jobId].tsx` |
| **16** | `16 - Audio Detail - Synchronized Transcript` | Chi Tiết Audio | `app/lectures/[id]/transcript.tsx` |
| **17** | `17 - Audio Detail - Key Highlights` | Chi Tiết Audio | `app/lectures/[id]/highlights.tsx` |
| **18** | `18 - Audio Detail - Cornell Summary Overview` | Chi Tiết Audio | `app/lectures/[id]/cornell.tsx` |
| **19** | `19 - Audio Detail - Cornell Summary Chapter View` | Chi Tiết Audio | `app/lectures/[id]/chapters/[chId].tsx` |
| **20** | `20 - Subjects - Course Archive` | Môn Học | `app/(tabs)/subjects.tsx` |
| **21** | `21 - Subjects - Course Detail (Macroeconomics)` | Môn Học | `app/subjects/[courseId].tsx` |
| **22** | `22 - Search - Neural RAG & Audio Snippets` | Tìm Kiếm RAG | `app/(modal)/search.tsx` |
| **23** | `23 - Review - Spaced Repetition Study Hub` | Ôn Tập | `app/(tabs)/review.tsx` |
| **24** | `24 - Flashcard - Question (Front)` | Flashcard | `app/(guarded)/review/session/[deckId].tsx` |
| **25** | `25 - Flashcard - Answer (Back)` | Flashcard | `app/(guarded)/review/session/[deckId].tsx` |
| **26** | `26 - Review - Session Complete Celebration` | Ôn Tập | `app/(guarded)/review/complete/[deckId].tsx` |
| **27** | `27 - Profile - Student Stats & Activity` | Hồ Sơ | `app/(tabs)/profile.tsx` |
| **28** | `28 - Settings - App Preferences` | Cài Đặt | `app/settings.tsx` |

</details>

---

## 🏗️ 4. Kiến Trúc Kỹ Thuật (System Architecture)

Hệ thống được thiết kế theo mô hình **Microservices Topology** với sự phân định ranh giới nghiêm ngặt giữa mạng Internet công khai và mạng nội bộ bảo mật:

```mermaid
flowchart TD
    subgraph Clients ["📱 Lớp Ứng Dụng Khách (Clients)"]
        MOBILE["📱 LectureLens Mobile App<br/>(Expo SDK 58 / React Native 0.88 / Expo Router v58)<br/>• Shopify Skia 2D Canvas (60-120 FPS)<br/>• Capsule Audio Player (expo-audio)<br/>• Vùng chạm Thumb Zone 390px"]
        LEGACY["🗄️ legacy/web-frontend (Lưu trữ lịch sử)"]
    end

    subgraph PublicDMZ ["🛡️ Phân Vùng Công Khai (Public Facing Ingress)"]
        SPRING["🍃 Spring Boot 3.3 Gateway (Container: spring)<br/>• Port 8080 (Hoặc HTTPS qua Reverse Proxy)<br/>• Xác thực JWT Stateless & Phân quyền RBAC<br/>• Quản lý Tệp Âm Thanh & Máy trạng thái Jobs"]
    end

    MOBILE -->|HTTPS / REST API + Bearer JWT| SPRING

    subgraph PrivateSubnet ["🔒 Mạng Nội Bộ Docker Cô Lập (rag-internal-network)"]
        direction TB

        subgraph AIService ["⚡ FastAPI AI Service (Container: ai - Internal Port: 8000)"]
            direction TB
            INGEST_FLOW["📥 Stage 1 + Stage 2 Ingest Worker (GLOBAL_GPU_SEMAPHORE=1)<br/>[I4] PhoWhisper ➔ transcript.json ➔ [I5] Recursive Chunking (<=512 tok)<br/>➔ Unload ASR (LOW_VRAM_MODE) ➔ [I6] BGE-M3 Dual Embedding ➔ chunks.json"]
            QUERY_FLOW["🔍 Query & Context Engine<br/>BGE-M3 Dual Query ➔ 3-Stream RRF ➔ Doubly-Linked Context Expansion"]
        end

        subgraph SharedVol ["💾 Thư Mục Dùng Chung (Shared Volume)"]
            VOLUME[("volumes/rag_data<br/>• ingest/incoming/{jobId}.ext<br/>• audio/{jobId}/manifest.json<br/>• transcripts/{jobId}/transcript.json<br/>• chunks/{jobId}/chunks.json")]
        end

        subgraph StorageLayer ["🐘 PostgreSQL 16 + pgvector (Container: db)"]
            direction LR
            SCHEMA_APP[("🗄️ Schema: app<br/>users, roles, lectures, jobs (READY)")]
            SCHEMA_RAG[("📐 Schema: rag<br/>lecture_chunks (halfvec 1024-d HNSW +<br/>lexical_weights JSONB + tsv_content GIN + prev/next)<br/>semantic_query_cache, audit_logs")]
        end

        subgraph LLMRuntime ["🦙 Ollama Local Inference (Container: llm)"]
            GEMMA["✨ Gemma 4 E4B<br/>(Grounding Citations: [MM:SS])"]
        end
    end

    SPRING -->|Ghi audio nguyên tử| VOLUME
    AIService -->|Đọc/Ghi manifest, transcript, chunks| VOLUME
    SPRING -->|HTTP + Header: X-Internal-Secret| AIService
    SPRING -->|JDBC / JPA Connections| SCHEMA_APP
    INGEST_FLOW -->|Batch Upsert Chunks & Dual Vectors| SCHEMA_RAG
    QUERY_FLOW <-->|3-Stream RRF Hybrid Query & Context RPC| SCHEMA_RAG
    QUERY_FLOW -->|Prompt Context + Re-ranked Chunks| GEMMA
    GEMMA -->|Streamed Answer + Timestamp Citations| QUERY_FLOW
    AIService -.->|Webhook PUT /internal/v1/jobs/{jobId}/status| SPRING
```

### Cơ Chế An Toàn Mạng & Hợp Đồng Dữ Liệu (Security & Data Invariants):
1. **Chỉ mở cổng Ingress:** Duy nhất dịch vụ `spring` được bind port ra mạng ngoài (`8080:8080`). Chi tiết toàn bộ API xem tại [`docs/API-REFERENCE.md`](./docs/API-REFERENCE.md).
2. **Khóa bí mật nội bộ (`X-Internal-Secret`):** Toàn bộ lời gọi nội bộ từ Spring Boot sang FastAPI và webhook callback (`PUT /internal/v1/jobs/{jobId}/status`) đều xác thực qua `X-Internal-Secret`.
3. **Cô lập CSDL & LLM:** Container `db`, `ai`, `llm` hoạt động trong subnet khép kín `rag-internal-network`, không mở port ra Internet.
4. **Bắt tay âm thanh & chunks qua Volume chia sẻ ([ADR 0002](./docs/adr/0002-audio-ingest-storage-and-transcript.md), [ADR 0004](./docs/adr/0004-recursive-chunking-and-bge-m3-halfvec-indexing.md)):** Spring Boot ghi file âm thanh nguyên tử vào `volumes/rag_data/ingest/incoming/{jobId}.ext`; FastAPI xuất bản `transcripts/{jobId}/transcript.json` ở Stage 1 và `chunks/{jobId}/chunks.json` ở Stage 2 với tra cứu $O(1)$.
5. **Sequential VRAM Offloading (`LOW_VRAM_MODE=true`):** Để chạy mượt trên GPU 4 GB VRAM (`RTX 3050`), pipeline giải phóng `PhoWhisper` ngay tại `STT_COMPLETED` trước khi nạp `BGE-M3` (`transformers` + `sparse_linear.pt`) cho `[I6]`.

---

## 🧠 5. Bộ Mô Hình AI On-Premise (Local Weights)

Hệ thống vận hành bằng 4 mô hình trí tuệ nhân tạo chuyên biệt với tổng dung lượng trọng số ~**21.5 GB**:

| Thư Mục Mô Hình | Định Danh Hugging Face | Dung Lượng | Kiến Trúc Mạng | Ngữ Cảnh Tối Đa | Nhiệm Vụ Kỹ Thuật |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **`phowhisper-base`** / **`medium`** | [`vinai/phowhisper-base`](https://huggingface.co/vinai/phowhisper-base) | ~290 MB - 1.5 GB | Whisper (Encoder-Decoder) | 30s audio / window | Phiên âm tiếng Việt học thuật, gán timestamp `[MM:SS]` |
| **`bge-m3`** | [`BAAI/bge-m3`](https://huggingface.co/BAAI/bge-m3) | ~2.2 GB | XLM-RoBERTa (1024-d) | 8192 tokens | Sinh Dense Embedding 1024 chiều và trọng số từ vựng |
| **`bge-reranker-v2-m3`** | [`BAAI/bge-reranker-v2-m3`](https://huggingface.co/BAAI/bge-reranker-v2-m3) | ~2.27 GB | Cross-Encoder | 8192 tokens | Tái xếp hạng ngữ nghĩa sâu Top-25 xuống Top 3–5 đoạn |
| **`gemma-4-e4b`** | [`google/gemma-4-E4B-it`](https://ai.google.dev/gemma) | ~15.8 GB | Gemma 4 Decoder-only | 8192 tokens | Suy luận ngữ cảnh, trả lời câu hỏi và đính kèm dẫn nguồn |

> [!TIP]
> **Tải tự động:** Chạy lệnh `python backend/download_models.py` để tải tự động toàn bộ trọng số về thư mục `backend/models/`.

---

## 🐘 6. Cơ Sở Dữ Liệu Vector (Multi-Schema Database)

Hệ thống cơ sở dữ liệu được tổ chức thành 2 schema phân lập trong PostgreSQL 16 (chi tiết tại [`backend/db/README.md`](./backend/db/README.md)):

```
lecturelens_db
├── 🗄️ schema: app (Nghiệp vụ do Spring Boot quản trị)
│   ├── users (Thông tin sinh viên, giảng viên, vai trò RBAC)
│   ├── lectures (Metadata bài giảng, đường dẫn audio, thời lượng)
│   └── jobs (Máy trạng thái xử lý: QUEUED -> PROCESSING_STT -> STT_COMPLETED -> CHUNKING -> EMBEDDING -> READY)
│
└── 📐 schema: rag (Tri thức số hóa do FastAPI quản trị)
    ├── lecture_chunks (Phân đoạn bài giảng <=512 tok, halfvec(1024), lexical_weights JSONB, prev/next_chunk_id, tsv_content)
    ├── semantic_query_cache (Bộ đệm câu hỏi tương đồng >0.95, phản hồi <10ms)
    └── rag_audit_logs (Lưu vết độ trễ và chất lượng truy xuất)
```

### Các Đặc Tính Tối Ưu Nâng Cao:
- **`halfvec(1024)` + `lexical_weights JSONB` (`[I6]` BGE-M3 Dual Embedding):** Lưu trữ Dense Vector ở FP16 (`halfvec`, giảm 50% RAM, tăng tốc quét HNSW) kết hợp trọng số từ vựng sparse trực tiếp từ `transformers` + `sparse_linear.pt` ([ADR 0004](./docs/adr/0004-recursive-chunking-and-bge-m3-halfvec-indexing.md)).
- **3-Stream RRF Hybrid Search (`rag.search_vietnamese_rag_rrf`):** Kết hợp đồng thời Dense Vector + Lexical Weights BGE-M3 + Vietnamese FTS (`to_tsvector('simple', unaccent(content))`). Chi tiết RPCs & API xem tại [`docs/API-REFERENCE.md`](./docs/API-REFERENCE.md).
- **Mở Rộng Ngữ Cảnh 3 Chiều (`rag.get_expanded_context`):** Tự động liên kết `prev_chunk_id` và `next_chunk_id` (Doubly-Linked Chunks từ `[I5]`) để cung cấp đoạn văn bản mạch lạc `[PREVIOUS, CURRENT, NEXT]` xung quanh mốc trích xuất.

---

## 📂 7. Cấu Trúc Thư Mục (Repository Structure)

```
lecture_lens/
├── package.json                         # Monorepo Orchestrator: scripts uỷ quyền sang mobile & understand
├── AGENTS.md                            # Hiến chương kỹ thuật bắt buộc cho AI Agents
├── GLOSSARY.md                          # Từ điển ngôn ngữ miền chuẩn (Ubiquitous Language)
├── README.md                            # Hồ sơ kỹ thuật tổng thể (Tài liệu này)
│
├── mobile/                              # 📱 ỨNG DỤNG DI ĐỘNG NATIVE (Expo SDK 58 / React Native 0.88)
│   ├── app.json / eas.json              # Cấu hình Expo, quyền micro, audio background, EAS Build
│   ├── assets/                          # Icon, Splash Screen, tài nguyên di động
│   ├── src/
│   │   ├── app/                         # 28 màn hình file-based routes (Expo Router v58)
│   │   ├── components/
│   │   │   ├── canvas/                  # Shopify Skia 2D: KitsuneMascotCanvas, FloatingPetals2D
│   │   │   ├── navigation/              # FloatingIslandTabBar, RouteSlot
│   │   │   └── ui/                      # Atoms: Button, Chip, FormInputPill, KawaiiCheckbox, Icons
│   │   ├── modules/
│   │   │   ├── audio/                   # CapsuleAudioPlayer, useAudioPlayer, AudioContext
│   │   │   ├── auth/                    # Validation, passwordEntropy, AuthSeam
│   │   │   └── storage/                 # KeyValueStorage seam (AsyncStorageAdapter, MemoryStorageAdapter)
│   │   ├── navigation/                  # useAppNavigation, parentFallback, MochiConfirmDialog
│   │   ├── services/                    # ApiClient, AudioPipelineService, NetworkMonitor
│   │   └── theme/                       # tokens.ts (KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS)
│   └── README.md                        # Đặc tả chi tiết ứng dụng di động
│
├── backend/                             # ⚙️ HẠ TẦNG BACKEND & AI ENGINE (On-Premise 2-Stage RAG)
│   ├── ai_service/                      # FastAPI AI & RAG Engine
│   │   ├── core/                        # asr, preprocessing, vad_chunker, text_chunker [I5], embedder [I6], chunk_store, audio_store
│   │   ├── pipeline/                    # ingest_pipeline.py (GLOBAL_GPU_SEMAPHORE + LOW_VRAM_MODE offload)
│   │   └── routers/                     # health.py, ingest.py (7 endpoint nội bộ /internal/v1/ai/*)
│   ├── db/                              # PostgreSQL 16 + pgvector init scripts (01-06) & verify_rag_db.py
│   ├── models/                          # Thư mục lưu trữ 4 mô hình AI (~21.5 GB)
│   ├── tests/                           # Bộ kiểm thử 65 tests pytest (Stage 1, Stage 2 [I5]/[I6], Chunk Store)
│   ├── docker-compose.ai-dev.yml        # Docker compose 1-lệnh cho db + ai (16GB RAM / 4GB VRAM)
│   ├── download_models.py               # Script tự động tải mô hình từ Hugging Face
│   └── README.md                        # Đặc tả chi tiết kiến trúc Backend
│
├── docs/                                # 📚 TÀI LIỆU KỸ THUẬT & KIẾN TRÚC
│   ├── API-REFERENCE.md                 # Single Source of Truth API (Ingress :8080, AI :8000, Webhook, SQL RPCs)
│   ├── design-system.md                 # Đặc tả hệ thống thiết kế Kitsune Soft
│   ├── UX-NAVIGATION-FLOW.md            # Đặc tả luồng điều hướng 28 màn hình
│   ├── adr/                             # Architectural Decision Records (ADR 0001, 0002, 0003, 0004)
│   └── design-assets/                   # 28 màn hình (SVG, PNG 4x), 74 icons vector, branding
│
├── legacy/                              # 🗄️ LƯU TRỮ LỊCH SỬ
│   └── web-frontend/                    # Bản web study portal cũ (React 19 / Vite 8 / Three.js)
│
├── TEST/                                # 🧪 TEST STUDIO CÔ LẬP
│   └── server.py / docker-compose.test.yml # Lab kiểm thử độc lập Stage 1 (ASR) + Stage 2 ([I5]/[I6] & RRF Search)
│
└── volumes/rag_data/                    # 💾 Thư mục dùng chung (incoming, audio/manifest.json, transcripts, chunks)
```

---

## 🚀 8. Hướng Dẫn Cài Đặt & Vận Hành (Quickstart)

### 8.1. Yêu Cầu Tiên Quyết (Prerequisites)
- **Node.js:** Phiên bản `v20.x` hoặc `v22.x` (LTS)
- **Python:** Phiên bản `3.10+` kèm `pip` (khuyến nghị tạo môi trường ảo `.venv`)
- **Docker & Docker Compose:** Phiên bản `v2.20+`
- **Phần cứng hỗ trợ:**
  - **Hồ sơ Dev / Edge (`LOW_VRAM_MODE=true`):** **16 vCPU / 16 GB RAM / NVIDIA RTX 3050 4 GB VRAM** (hoặc fallback CPU). Cấu hình container giới hạn sẵn `ai` (`6.0` CPU / `6G` RAM) và `db` (`2.0` CPU / `1536M` RAM / `256mb` shm) trong [`backend/docker-compose.ai-dev.yml`](./backend/docker-compose.ai-dev.yml).
  - **Production khuyến nghị:** NVIDIA RTX 3060 12GB VRAM / RTX 4090 24GB VRAM, 32–64 GB RAM cho tải cao song song.

---

### 8.2. Khởi Chạy Ứng Dụng Di Động (`mobile/`)

Thực thi trực tiếp từ thư mục gốc thông qua npm scripts:

```bash
# 1. Cài đặt các gói phụ thuộc cho mobile
npm install --prefix mobile

# 2. Khởi chạy Expo Development Server
npm run start        # hoặc: npm run dev

# 3. Chạy trực tiếp trên thiết bị hoặc máy ảo
npm run android      # Mở trên Android emulator / thiết bị (kết nối gateway qua 10.0.2.2:8080)
npm run ios          # Mở trên iOS simulator (kết nối gateway qua localhost:8080)
npm run web          # Xem trước nhanh trên nền tảng web

# 4. Kiểm tra 31 bài test tự động (Node Native Test Runner)
npm test

# 5. Kiểm tra kiểu dữ liệu TypeScript (Strict Mode)
npm run typecheck

# 6. Kiểm tra chuẩn mã nguồn
npm run lint
```

---

### 8.3. Khởi Chạy Backend & AI Engine (`backend/`)

```bash
# 1. Tạo môi trường ảo và cài đặt thư viện
python -m venv .venv
.venv\Scripts\activate        # Trên Windows (hoặc: source .venv/bin/activate trên Linux)
pip install -r backend/requirements.txt

# 2. Tải toàn bộ trọng số mô hình AI về backend/models/ (~21.5 GB)
python backend/download_models.py

# 3. Khởi chạy 1-lệnh PostgreSQL (pgvector) và FastAPI AI Service (hồ sơ 16GB RAM / 4GB VRAM)
docker compose -f backend/docker-compose.ai-dev.yml up --build

# 4. (Tùy chọn) Khởi chạy LectureLens TEST Studio cho Stage 1 + Stage 2
docker compose -f TEST/docker-compose.test.yml up --build

# 5. Chạy bộ 65 bài kiểm thử tự động của Backend (Stage 1, Stage 2 [I5]/[I6] & Chunk Store)
.\.venv\Scripts\python.exe -m pytest backend/tests -v

# 6. Kiểm tra và xác minh CSDL pgvector RAG
python backend/db/verify_rag_db.py
```

> 📖 Xem toàn bộ hợp đồng API Gateway `:8080`, FastAPI `:8000`, `chunks.json` và SQL RPCs tại [`docs/API-REFERENCE.md`](./docs/API-REFERENCE.md).

---

### 8.4. Công Cụ Phân Tích Mã Nguồn (Understand Anything)

```bash
# Quét toàn bộ codebase và cập nhật Knowledge Graph (.ua/manifest.json)
npm run understand:scan

# Khởi chạy dashboard phân tích kiến trúc
npm run understand:dashboard
```

---

## 🛡️ 9. Quy Chuẩn Kỹ Sư & Triết Lý Phần Mềm (Engineering Constitution)

Mọi kỹ sư và trợ lý AI khi làm việc trên kho lưu trữ **LectureLens** bắt buộc phải tuân thủ [Hiến Chương Kỹ Thuật (AGENTS.md)](./AGENTS.md) và các nguyên lý kỹ thuật từ Matt Pocock:

### 1. Thiết Kế Mô-đun Sâu (Deep Modules Principle)
- Giữ giao diện (**Interface**) của mọi component, service hoặc hàm ở mức tối giản, dễ hiểu và dễ tiếp cận.
- Ẩn giấu toàn bộ tính toán phức tạp vào phần triển khai (**Implementation**).
- *Ví dụ:* Interface `KeyValueStorage` chỉ gồm 4 phương thức `getItem`, `setItem`, `removeItem`, `clear`; ẩn giấu toàn bộ việc lưu trữ AsyncStorage của native hoặc Memory của kiểm thử bên trong.

### 2. Tuân Thủ Ngôn Ngữ Miền Bắt Buộc (Ubiquitous Language)
- Luôn đối soát thuật ngữ với [GLOSSARY.md](./GLOSSARY.md).
- Dùng đúng: `LectureLens`, `Kitsune Soft`, `Kitsune Fox Companion`, `Capsule Audio Player`, `Cornell Notes`, `2-Stage Neural RAG`.
- Tránh tuyệt đối: `SmartLecture`, `LectureApp`, `Cloud AI API`.

### 3. Phát Triển Hướng Kiểm Thử Qua Ranh Giới (Test Through The Seam)
- Viết kiểm thử trước khi hiện thực hóa logic (TDD).
- Kiểm thử thông qua ranh giới thay đổi (**Seam**), không kiểm thử xuyên qua chi tiết triển khai nội bộ để đảm bảo mã nguồn dễ tái cấu trúc mà không làm gãy test.

---

## 📜 Giấy Phép Bản Quyền (License)

Dự án được phân phối dưới giấy phép **Apache License 2.0**. Xem chi tiết tại tệp [LICENSE](./LICENSE).

---

<div align="center">
  <sub>Được phát triển với niềm đam mê nâng cao chất lượng giáo dục Việt Nam 🇻🇳</sub><br/>
  <sub>Bản quyền © 2026 <b>LectureLens Engineering Team</b>. Bảo lưu mọi quyền.</sub>
</div>
