# 🌐 LectureLens Frontend — Modern Web Study Portal

Giao diện Web hiện đại của **LectureLens**, được xây dựng trên nền tảng **React 19**, **Vite 8**, **Tailwind CSS v4** và **Three.js / React Three Fiber** theo hệ thống thiết kế chính thức **Kitsune Soft** ("kawaii-calm" Japanese soft-minimalism).

---

## 🦊 Linh Vật & Triết Lý Thiết Kế: Kitsune Soft

Giao diện LectureLens mô phỏng không gian bàn học thư thái của sinh viên Nhật Bản, xua tan áp lực thi cử và khối lượng bài giảng nặng nề:
- **Linh vật Cáo Kitsune (Kitsune Fox Pixel Art):** Biểu tượng của sự lanh lợi, trí tuệ sắc bén và sự đồng hành ấm áp, xuất hiện xuyên suốt các trạng thái ứng dụng.
- **Giấy Washi Ấm Áp (`#FFF7FD`):** Canvas chống lóa, bảo vệ thị lực trong những buổi học kéo dài.
- **Kính Mờ Sữa (Miruku Glass):** Bề mặt thẻ card `rgba(255, 255, 255, 0.76)` với hiệu ứng làm mờ `16px blur`.
- **Khối Bento Squircle (28px):** Cấu trúc thẻ mô phỏng hộp cơm bento vuông tròn nảy nở.
- **Động Lực Học Mochi (Mochi Tactile Press):** Hiệu ứng co nhẹ `scale(0.97)` đàn hồi khi tương tác.

---

## 🎨 Bảng Tra Cứu Token Màu Sắc (Color Tokens)

| Token Tên Gọi | Mã HEX | Vai Trò Ứng Dụng |
| :--- | :---: | :--- |
| **`kitsune-coral`** *(Primary)* | `#F47F72` | Nút hành động chính, tab kích hoạt, viền focus input |
| **`kitsune-coral-dark`** | `#A03F36` | Điểm nhấn viền, text trên nền sáng |
| **`sakura-pink`** *(Secondary)* | `#F5C3C9` | Thẻ phân loại môn học, điểm nhấn cánh hoa anh đào |
| **`mist-sky`** *(Tertiary)* | `#A9D4E8` | Thanh tiến độ học tập, thẻ thông tin giải thích |
| **`mochi-yellow`** *(Accent)* | `#FFE27A` | Đánh dấu sao, khối tóm tắt bài học Cornell, huy hiệu |
| **`matcha-mint`** *(Accent)* | `#BEE1D0` | Trạng thái hoàn thành, mốc thời gian timestamp `[MM:SS]` |
| **`plum-ink`** *(Neutral Ink)* | `#261333` | Màu mực mận chín: Chữ tiêu đề, nội dung, nét vẽ icon |
| **`washi-cream`** *(Canvas)* | `#FFF7FD` | Nền canvas toàn bộ màn hình ứng dụng |

---

## ✍️ Kiểu Chữ Chuẩn: Plus Jakarta Sans

Dự án áp dụng duy nhất kiểu chữ hình học cao cấp **Plus Jakarta Sans**:
- **Display / Tiêu đề lớn:** 30px–36px, Weight 800 (ExtraBold), tracking -0.025em.
- **Headlines / Tiêu đề thẻ:** 18px–26px, Weight 700 (Bold) / 600 (SemiBold).
- **Body / Nội dung bài giảng:** 14px–16px, Weight 400 (Regular) / 500 (Medium).
- **Labels / Nút bấm & Timestamp:** 11px–14px, Weight 600–700 (SemiBold/Bold), tracking +0.01em đến +0.03em.

---

## 📱 Danh Mục 28 Màn Hình Mẫu (Assets Mapping)

Toàn bộ 28 màn hình thiết kế chuẩn đã được đồng bộ hóa tên gọi và chức năng tại hai thư mục tài nguyên:  
👉 **SVG (Vector)**: [`src/assets/LectureLens App Design System - SVG/`](./src/assets/LectureLens%20App%20Design%20System%20-%20SVG/)  
👉 **PNG (Raster)**: [`src/assets/LectureLens App Design System - PNG/`](./src/assets/LectureLens%20App%20Design%20System%20-%20PNG/)  

1. **Khởi động & Xác thực:**
   - `01 - Splash - App Launch`
   - `02 - Onboarding - Step 1 (Record or Upload)`
   - `03 - Onboarding - Step 2 (Find What Matters)`
   - `04 - Onboarding - Step 3 (Remember It)`
   - `05 - Auth - Sign In`
   - `06 - Auth - Create Account`
   - `07 - Paywall - Kitsune Plus Subscription`
2. **Bàn học & Trạng thái Home:**
   - `08 - Home - Study Hub Dashboard`
   - `09 - Home - Offline State`
3. **Thư viện bài giảng:**
   - `10 - Library - Lecture Archive`
   - `11 - Library - Empty State`
   - `12 - Library - Offline State`
4. **Ghi âm & Xử lý AI:**
   - `13 - Audio - Add Audio Bottom Sheet`
   - `14 - Audio - Live Recording`
   - `15 - Audio - Processing Pipeline`
5. **Chi tiết bài giảng & Ghi chú Cornell:**
   - `16 - Audio Detail - Synchronized Transcript`
   - `17 - Audio Detail - Key Highlights`
   - `18 - Audio Detail - Cornell Summary Overview`
   - `19 - Audio Detail - Cornell Summary Chapter View`
6. **Môn học & Chuyên đề:**
   - `20 - Subjects - Course Archive`
   - `21 - Subjects - Course Detail (Macroeconomics)`
7. **Tìm kiếm ngữ nghĩa RAG:**
   - `22 - Search - Neural RAG & Audio Snippets`
8. **Ôn tập Spaced Repetition & Flashcards:**
   - `23 - Review - Spaced Repetition Study Hub`
   - `24 - Flashcard - Question (Front)`
   - `25 - Flashcard - Answer (Back)`
   - `26 - Review - Session Complete Celebration`
9. **Hồ sơ sinh viên & Cài đặt:**
   - `27 - Profile - Student Stats & Activity`
   - `28 - Settings - App Preferences`

---

## 🧱 Kiến Trúc Module Giao Diện (Deep Modules UI)

Theo nguyên lý thiết kế **Matt Pocock Deep Modules**, các component UI được thiết kế với giao diện Interface nhỏ gọn, ẩn giấu sự phức tạp của chuyển động và logic bên trong:

- **`PillButton`**: Nút bấm bo tròn 9999px tích hợp hiệu ứng nén xúc giác Mochi scale 0.97.
- **`BentoCard`**: Thẻ học bento với góc bo squircle 28px và kính mờ sữa Miruku Glass.
- **`CapsuleAudioPlayer`**: Trình phát bài giảng dạng con nhộng ghim đáy màn hình, đồng bộ thời gian với transcript.
- **`CornellNoteView`**: Bố cục ghi chú 3 cột (Summary, Cues, Notes kèm mốc timestamp).
- **`KitsuneFlashcard`**: Thẻ học 2 mặt với chuyển động lật 3D Framer Motion mượt mà.
- **`KitsuneCompanionCanvas`**: Không gian 3D tương tác mô phỏng linh vật Cáo Kitsune bằng Three.js & React Three Fiber.

---

## 📦 Lệnh Thao Tác (Scripts)

Thao tác trực tiếp từ thư mục `frontend/` (hoặc thông qua root `package.json`):

```bash
# Khởi chạy Vite Dev Server tại http://localhost:5173
npm run dev

# Kiểm tra kiểu dữ liệu TypeScript & đóng gói Production
npm run build

# Kiểm tra quy chuẩn linter mã nguồn siêu tốc bằng oxlint
npm run lint

# Xem trước bản đóng gói Production
npm run preview
```

---

## 📂 Cấu Trúc Thư Mục Frontend

```
frontend/
├── public/                                      # Tài nguyên tĩnh, SVG icons
├── src/
│   ├── assets/
│   │   ├── LectureLens App Design System - PNG/ # 🌸 28 Màn hình thiết kế mẫu PNG
│   │   ├── LectureLens App Design System - SVG/ # 🌸 28 Màn hình thiết kế mẫu SVG
│   │   ├── logo-LectureLens.png                 # Logo thương hiệu
│   │   └── ...
│   ├── components/                              # 🧱 Reusable Deep UI Modules (dự kiến)
│   ├── features/                                # 🎯 Feature Slices (Home, Audio, Study, Review)
│   ├── App.tsx                                  # Root Component & 3D Interactive Canvas
│   ├── index.css                                # Tailwind CSS v4 & Kitsune Soft Theme
│   └── main.tsx                                 # Khởi chạy React DOM
├── .oxlintrc.json                               # Cấu hình oxlint siêu tốc
├── index.html                                   # HTML Template
├── package.json                                 # Dependencies & Scripts
├── tsconfig.json                                # Solution TypeScript Config
└── vite.config.ts                               # Cấu hình Vite & Plugins
```
