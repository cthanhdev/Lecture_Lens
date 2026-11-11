# 🌸 LectureLens Design System: Kitsune Soft

> **Ngôn ngữ thiết kế chính thức của LectureLens**  
> *"Kawaii-Calm" Japanese Soft-Minimalism — Sự giao thoa tinh tế giữa giấy mỹ thuật Washi truyền thống, chất liệu kính mờ sữa Miruku Glass, các khối Bento Squircle mềm mại và linh vật Cáo Kitsune Pixel Art.*

---

## 1. 🦊 Bản Sắc Thương Hiệu & Triết Lý Thiết Kế (Brand & Philosophy)

**Kitsune Soft** được thiết kế nhằm xóa bỏ cảm giác khô khan, áp lực và nặng nề thường thấy trong các ứng dụng học tập học thuật. Lấy cảm hứng từ không gian bàn học tối giản, ấm cúng của sinh viên Nhật Bản, hệ thống cân bằng giữa sự ngọt ngào, thư thái (*kawaii-calm*) với tính chuẩn xác, kỷ luật và độ tương phản cao của giao diện số hiện đại.

```
                  🌸 VĂN HÓA HỌC TẬP THƯ THÁI (KAWAII-CALM) 🌸
     ┌───────────────────────────────────────────────────────────────┐
     │  📜 Giấy Washi Ấm Áp       +      🥛 Kính Mờ Sữa (Miruku)    │
     │  (Không mỏi mắt khi đọc)          (Không gian phân tầng mềm)  │
     ├───────────────────────────────────────────────────────────────┤
     │  🍡 Khối Squircle Mochi    +      🦊 Linh Vật Cáo Kitsune     │
     │  (Góc bo tròn 28px nảy)           (Người bạn đồng hành AI)    │
     └───────────────────────────────────────────────────────────────┘
```

### 1.1. Ba Trụ Cột Cảm Xúc (Emotional Tenors)
1. **Kawaii-Calm (Dễ thương & Thanh bình):** Thân thiện, chào đón và tròn trịa nhưng không sa đà vào sự trẻ con hỗn loạn; giữ vững tính thanh thoát, tập trung và tĩnh lặng cho việc học tập chuyên sâu.
2. **Mindful Tactility (Xúc giác mềm dẻo):** Từng bề mặt gợi cảm giác chạm vào chất liệu kính sữa (*miruku-garasu*), bánh mochi mềm dẻo và bề mặt giấy thủ công tự nhiên.
3. **Accessible Precision (Chính xác & Dễ đọc):** Mực mận chín (*Plum Ink*) đậm đà trên nền giấy kem Washi đạt chuẩn tương phản cao cấp **WCAG AAA**, kết hợp cùng kiểu chữ hình học quốc tế **Plus Jakarta Sans**.

### 1.2. Linh Vật Chính Thức: Cáo Kitsune Pixel Art (Kitsune Fox Companion)
- **Hình tượng:** Cáo trắng Kitsune được tạo hình theo phong cách **Pixel Art Nhật Bản**, đeo chuông cổ vàng may mắn (*suzu*), điểm xuyết cánh hoa anh đào (*sakura*), cổng trời (*torii*) và vầng thái dương đỏ rạng rỡ.
- **Ý nghĩa:** Biểu trưng cho sự lanh lợi, trí tuệ mẫn tiệp, khả năng lắng nghe tinh tường và lòng đồng hành trung kiên cùng sinh viên suốt những giờ học căng thẳng.
- **Vai trò trong ứng dụng:** Xuất hiện trong các trạng thái động viên: chào mừng (Onboarding), trạng thái rảnh rỗi (Empty State), quá trình phân tích âm thanh (Processing), chúc mừng hoàn thành bài học (Session Celebration) và mô hình 3D tương tác trong phòng học.

---

## 2. 🎨 Bảng Màu Chuẩn (Color Palette & Tokens)

Bảng màu Kitsune Soft sử dụng chất liệu nền giấy Washi ấm áp, tiếp thêm năng lượng bằng sắc San hô Kitsune rực rỡ, cân bằng bởi các gam màu pastel thảo mộc và neo giữ độ tương phản bằng màu Mực mận chín cao cấp.

### 2.1. Bảng Màu Cốt Lõi (Core Palette)

| Tên Token | Giá Trị HEX | RGBA / Biến Thể | Ý Nghĩa & Vị Trí Áp Dụng |
| :--- | :---: | :---: | :--- |
| **`kitsune-coral`** *(Primary)* | `#F47F72` | `rgba(244, 127, 114, 1)` | Màu nhận diện chủ đạo: Nút CTA chính, trạng thái active, viền focus input, badge nổi bật |
| **`kitsune-coral-dark`** | `#A03F36` | `rgba(160, 63, 54, 1)` | Màu san hô sẫm: Điểm nhấn viền, text trên nền sáng, hover states |
| **`sakura-pink`** *(Secondary)* | `#F5C3C9` | `rgba(245, 195, 201, 1)` | Màu hoa anh đào: Badge phân loại môn học, điểm nhấn linh vật, nền icon phụ trợ |
| **`mist-sky`** *(Tertiary)* | `#A9D4E8` | `rgba(169, 212, 232, 1)` | Xanh sương lam: Thanh tiến độ học tập, thông báo hệ thống, nền ghi chú cân bằng |
| **`mochi-yellow`** *(Accent)* | `#FFE27A` | `rgba(255, 226, 122, 1)` | Vàng mochi: Đánh dấu sao yêu thích, khối tóm tắt bài học Cornell, huy hiệu thành tích |
| **`matcha-mint`** *(Accent)* | `#BEE1D0` | `rgba(190, 225, 208, 1)` | Xanh trà matcha: Trạng thái hoàn thành, mốc thời gian timestamp `[MM:SS]`, chỉ số tiến bộ |
| **`plum-ink`** *(Neutral Ink)* | `#261333` | `rgba(38, 19, 51, 1)` | Màu mực mận chín: Chữ tiêu đề, nội dung bài giảng, outline nét icon (thay cho màu đen thô ráp) |
| **`plum-ink-muted`** | `#56423F` | `rgba(86, 66, 63, 0.85)` | Chữ phụ đề, văn bản thứ cấp, nhãn mô tả |
| **`plum-ink-subtle`** | — | `rgba(86, 66, 63, 0.50)` | Placeholder, viền kẻ mờ, văn bản gợi ý |
| **`washi-cream`** *(Canvas)* | `#FFF7FD` | `rgba(255, 247, 253, 1)` | Nền canvas toàn ứng dụng: Giấy washi ấm, chống chói mắt tuyệt đối |

---

## 3. 🥛 Hệ Thống Bề Mặt & Kính Mờ (Surfaces & Glassmorphism)

LectureLens loại bỏ các bóng đổ đen xám cứng nhắc, thay bằng bóng đổ ấm màu mận chín (**Plum Ambient Shadows**) kết hợp bề mặt kính sữa thủy tinh mờ (**Miruku Glass**):

```
┌────────────────────────────────────────────────────────┐
│  Level 3: Modal & Paywall Sheet (#FFFFFF + Deep Shadow)│
│  ┌──────────────────────────────────────────────────┐  │
│  │ Level 2: Floating Tab Island & Action Sheets      │  │
│  │ (rgba(255,255,255,0.88) + 24px Blur + Plum Glow) │  │
│  │  ┌────────────────────────────────────────────┐   │  │
│  │  │ Level 1: Bento Study Cards (0.76 + 16px)   │   │  │
│  │  │  ┌──────────────────────────────────────┐  │   │  │
│  │  │  │ Level 0: Washi Cream Canvas (#FFF7FD)│  │   │  │
│  │  │  └──────────────────────────────────────┘  │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 3.1. Phân Tầng Chi Tiết (Elevation Levels)

- **Level 0 (Canvas Base):**
  - Màu nền: `#FFF7FD` (Washi Cream)
  - Phẳng, không bóng đổ, đóng vai trò chất liệu nền cố định.
- **Level 1 (Bento Cards & Content Modules):**
  - Màu nền: `rgba(255, 255, 255, 0.76)` (Translucent Milk Glass)
  - Hiệu ứng kính: `backdrop-filter: blur(16px) saturate(140%)`
  - Viền mờ vi mô: `border: 1px solid rgba(255, 255, 255, 0.85)`
  - Bóng đổ: `box-shadow: 0 8px 24px -4px rgba(38, 19, 51, 0.06), 0 2px 6px -1px rgba(38, 19, 51, 0.03)`
- **Level 2 (Active Sheets, Bottom Bars & Action Panels):**
  - Màu nền: `rgba(255, 255, 255, 0.88)`
  - Hiệu ứng kính: `backdrop-filter: blur(24px) saturate(160%)`
  - Viền: `border: 1px solid rgba(255, 255, 255, 0.95)`
  - Bóng đổ: `box-shadow: 0 14px 36px -6px rgba(38, 19, 51, 0.10), 0 4px 12px -2px rgba(38, 19, 51, 0.05)`
- **Level 3 (Primary Modals, Alerts & Paywalls):**
  - Màu nền: `#FFFFFF` (Solid White)
  - Bóng đổ nổi khối: `box-shadow: 0 20px 48px -8px rgba(38, 19, 51, 0.14), 0 8px 16px -2px rgba(38, 19, 51, 0.06)`

---

## 4. ✍️ Quy Chuẩn Kiểu Chữ (Typography: Plus Jakarta Sans)

Dự án sử dụng duy nhất kiểu chữ **Plus Jakarta Sans** trên toàn bộ hệ thống. Với các đường cong hình học mềm mại, chiều cao x-height lớn và độ mở thoáng đãng, font chữ đảm bảo khả năng đọc hoàn hảo trên cả màn hình di động lẫn máy tính bàn.

| Cấp Bậc (Scale) | Size (px) | Weight | Line Height | Tracking | Vị Trí Sử Dụng |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Headline Display** | 36px | ExtraBold (800) | 44px | -0.03em | Tiêu đề lớn màn hình chào mừng, banner chính |
| **Headline Display Mobile** | 30px | ExtraBold (800) | 38px | -0.025em | Tiêu đề lớn trên màn hình điện thoại hẹp |
| **Headline Lg** | 26px | Bold (700) | 34px | -0.02em | Tên bài học chi tiết, tiêu đề màn hình chính |
| **Headline Md** | 22px | Bold (700) | 28px | -0.015em | Tiêu đề thẻ Bento, tên khối ghi chú |
| **Headline Sm** | 18px | SemiBold (600) | 24px | -0.01em | Tiêu đề nhóm con, tên môn học |
| **Body Lg** | 16px | Medium (500) | 24px | -0.005em | Nội dung tóm tắt quan trọng, đoạn trích dẫn |
| **Body Md** | 14px | Regular (400) | 21px | 0em | Văn bản bài giảng chính, diễn giải câu hỏi |
| **Body Sm** | 13px | Regular (400) | 18px | +0.005em | Ghi chú phụ, nội dung bảng tra cứu |
| **Label Lg** | 14px | SemiBold (600) | 18px | +0.01em | Nút bấm chính (Button Primary / Secondary) |
| **Label Md** | 12px | SemiBold (600) | 16px | +0.02em | Filter chip, tag phân loại môn học |
| **Label Sm** | 11px | Bold (700) | 14px | +0.03em | Mốc thời gian `[MM:SS]`, trạng thái badge |

---

## 5. 📐 Hình Khối & Động Lực Học Mochi (Shapes & Mochi Physics)

### 5.1. Bán Kính Bo Góc (Corner Radii)
- **Controls & Actions (Buttons, Inputs, Chips, Badges):** Bán kính viên thuốc hoàn hảo (**Pill** - `9999px` / `rounded-full`).
- **Bento Modules & Content Cards:** Bo góc Squircle liên tục từ **`24px` đến `32px`** (`rounded-2xl` đến `rounded-3xl`).
- **Embedded Inner Containers (Waveforms, Images, Audio Players):** Bo góc tỷ lệ thuận **`16px` đến `20px`** (`rounded-xl`).
- **Organic Blobs (Backdrop Plates):** Các mảng hình dạng hữu cơ SVG mềm mại (`border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%`) đặt lệch góc 3px lót dưới các icon.

### 5.2. Hiệu Ứng Nén Xúc Giác Mochi (Mochi Tactile Press Depth)
Mọi phần tử có thể tương tác (Buttons, Cards, Chips) đều tích hợp phản hồi nảy xúc giác mềm:
- **Trạng thái Active/Press:**
  - Thu phóng nhẹ: `transform: scale(0.97)`
  - Bóng đổ thu gọn: `box-shadow: 0 2px 6px rgba(38, 19, 51, 0.04)`
  - Thời gian chuyển động: `transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)`
  - Mang lại cảm giác mềm mại, đàn hồi như bấm vào một viên bánh mochi tươi.

---

## 6. 🧩 Quy Chuẩn Các Thành Phần Giao Diện (Components Spec)

### 6.1. Nút Bấm (Pill Buttons)
- **Primary Button (Kitsune Pill):**
  - Nền: `#F47F72` (Kitsune Coral)
  - Chữ: `#FFFFFF` (Trắng), font `Plus Jakarta Sans` 14px SemiBold
  - Bán kính: `9999px` (Pill)
  - Chiều cao: Chuẩn `52px` (hoặc `44px` cho compact)
  - Bóng đổ: `0 6px 16px rgba(244, 127, 114, 0.35)`
  - Active: Scale `0.97`
- **Secondary Button (Glass Pill):**
  - Nền: `rgba(255, 255, 255, 0.65)` (Miruku Glass)
  - Viền: `1.5px solid rgba(38, 19, 51, 0.12)`
  - Chữ: `#261333` (Deep Plum Ink)
- **Tertiary Button (Soft Tint Pill):**
  - Nền: `#F5C3C9` (Sakura Pink) hoặc `#A9D4E8` (Mist Sky)
  - Chữ: `#261333`

### 6.2. Thẻ Bento (Bento Study Cards)
- Cấu trúc lưới linh hoạt mô phỏng hộp cơm Bento Nhật Bản: các thẻ tỷ lệ `1:1` (vuông) hoặc `2:1` (chữ nhật ngang).
- Nền: `rgba(255, 255, 255, 0.76)`, blur `16px`.
- Bo góc: Squircle `28px`.
- Padding trong: `20px`.
- Chứa đựng: Số liệu thống kê, bài học gần nhất, gợi ý ôn tập, và lối tắt ghi âm.

### 6.3. Trường Nhập Liệu (Input Fields)
- Chiều cao `52px`, bo góc `9999px` (Pill), nền `rgba(255, 255, 255, 0.9)`.
- Viền: `1.5px solid rgba(38, 19, 51, 0.08)`.
- Chữ: `#261333`, placeholder: `rgba(38, 19, 51, 0.35)`.
- **Trạng thái Focus (Halo Glow):** Viền chuyển sang `#F47F72`, bao quanh bởi vầng hào quang san hô mềm: `box-shadow: 0 0 0 3px rgba(244, 127, 114, 0.20)`.

### 6.4. Biểu Tượng Đồ Họa Hai Tông (Duotone Soft-Blob Iconography)
- Nét vẽ chính: Vector Outline sắc nét độ dày **1.75px** bằng màu Mực mận chín (`#261333`).
- Tấm lót phía sau: Hình đốm pastel hữu cơ mềm mại (Sakura Pink, Mist Sky, Mochi Yellow hoặc Matcha Mint) thu nhỏ tỷ lệ 68%, đặt lệch góc 2-3px tạo chiều sâu thị giác ấm áp.
- **Thư Viện Chuẩn Hóa**: Đã được số hóa 100% thành **74 biểu tượng vector** tại `docs/design-assets/icons/` và gói React Native SVG Component tại `mobile/src/components/ui/icons/`.
- **Nguyên Tắc Bắt Buộc**: Bắt buộc mọi màn hình và component phải import từ `mobile/src/components/ui/icons/`, tuyệt đối không vẽ lại inline SVG hay kéo icon bên ngoài vào. Xem tài liệu hướng dẫn và bảng tra cứu tại [`mobile/src/components/ui/icons/README.md`](../mobile/src/components/ui/icons/README.md).

### 6.5. Thanh Điều Hướng Đảo Nổi (Floating Island Tab Bar)
- Thanh capsule bo tròn hoàn hảo treo lơ lửng cách đáy màn hình `16px`.
- Nền: Kính sữa trong suốt `rgba(255, 255, 255, 0.85)` với `expo-blur` và bóng đổ mận ấm.
- Con trỏ trượt (**Sliding Pill Indicator**): Trượt mượt mà phía sau tab đang kích hoạt với màu san hô trong suốt `rgba(244, 127, 114, 0.15)`.

---

## 7. 📱 Danh Mục 28 Màn Hình Mẫu Chuẩn Hóa (Screen Assets Inventory)

Toàn bộ 28 màn hình mẫu đã được đồng bộ hóa tên gọi và chức năng chuẩn xác 1:1 giữa hai định dạng Vector (`docs/design-assets/screens/svg/`) và Raster (`docs/design-assets/screens/png/`):

| STT | Nhóm Nghiệp Vụ | Tên Tệp Chuẩn Hóa (`.svg` / `.png`) | Chức Vụ & Ý Nghĩa Thiết Kế |
| :---: | :--- | :--- | :--- |
| **01** | **Khởi Động** | `01 - Splash - App Launch` | Màn hình khởi động (Splash Screen), hiển thị linh vật Cáo Kitsune Pixel Art và thanh trạng thái chuẩn bị hệ thống |
| **02** | **Onboarding** | `02 - Onboarding - Step 1 (Record or Upload)` | Giới thiệu bước 1: Thu âm bài giảng trực tiếp trong lớp học hoặc tải tệp âm thanh lên |
| **03** | **Onboarding** | `03 - Onboarding - Step 2 (Find What Matters)` | Giới thiệu bước 2: Trợ lý AI tự động trích xuất điểm nhấn và tóm tắt trọng tâm |
| **04** | **Onboarding** | `04 - Onboarding - Step 3 (Remember It)` | Giới thiệu bước 3: Thẻ ghi nhớ Flashcard thông minh gắn kèm đoạn âm thanh bài giảng gốc |
| **05** | **Xác Thực** | `05 - Auth - Sign In` | Đăng nhập tài khoản sinh viên (Email trường / Mật khẩu / Đăng nhập nhanh Google, Apple) |
| **06** | **Xác Thực** | `06 - Auth - Create Account` | Đăng ký tài khoản sinh viên mới kèm điều khoản dịch vụ |
| **07** | **Gói Dịch Vụ** | `07 - Paywall - Kitsune Plus Subscription` | Màn hình nâng cấp gói học tập Kitsune Plus (mở khóa không giới hạn giờ ASR & RAG) |
| **08** | **Bàn Học Chính** | `08 - Home - Study Hub Dashboard` | Bàn học thông minh (Home Study Hub): Tiếp tục nghe bài giảng, thẻ cần ôn hôm nay, chuỗi ngày streak |
| **09** | **Trạng Thái** | `09 - Home - Offline State` | Giao diện màn hình Home khi mất kết nối mạng, hiển thị thông báo offline và bài đã tải |
| **10** | **Thư Viện** | `10 - Library - Lecture Archive` | Kho lưu trữ bài giảng tổng hợp, hỗ trợ lọc theo môn học và mốc thời gian |
| **11** | **Thư Viện** | `11 - Library - Empty State` | Trạng thái rỗng của thư viện khi người dùng chưa có bản thu âm nào, kèm nút gợi ý tạo bài mới |
| **12** | **Thư Viện** | `12 - Library - Offline State` | Thư viện khi ngoại tuyến, hiển thị kho bài học đã lưu vào bộ nhớ máy (Vault) |
| **13** | **Ghi Âm** | `13 - Audio - Add Audio Bottom Sheet` | Bảng điều khiển nạp âm thanh: Thu âm trực tiếp, tải file từ máy, dán liên kết hoặc Voice Memos |
| **14** | **Ghi Âm** | `14 - Audio - Live Recording` | Màn hình đang thu âm bài giảng trực tiếp: Hiển thị sóng âm, thời lượng, gắn sao highlight và ghi chú timestamp |
| **15** | **Xử Lý AI** | `15 - Audio - Processing Pipeline` | Tiến trình AI tổng hợp 5 giai đoạn (Upload -> ASR nhận dạng giọng nói -> Trích xuất Highlight -> Tóm tắt -> Sinh Flashcard) |
| **16** | **Chi Tiết Audio** | `16 - Audio Detail - Synchronized Transcript` | Trình phát bài giảng tab Lời thoại: Bản gỡ băng tự động đồng bộ theo từng mốc thời gian `[MM:SS]` |
| **17** | **Chi Tiết Audio** | `17 - Audio Detail - Key Highlights` | Trình phát bài giảng tab Điểm nhấn: Danh sách các phân đoạn quan trọng do AI lọc hoặc sinh viên đánh dấu |
| **18** | **Chi Tiết Audio** | `18 - Audio Detail - Cornell Summary Overview` | Trình phát bài giảng tab Tóm tắt: Bản tóm tắt chuẩn Cornell Notes (Key ideas, Keywords, Definitions, Exam alerts) |
| **19** | **Chi Tiết Audio** | `19 - Audio Detail - Cornell Summary Chapter View` | Bản tóm tắt Cornell mở rộng chi tiết theo chương kèm điều khiển tua nhanh 10 giây |
| **20** | **Môn Học** | `20 - Subjects - Course Archive` | Danh mục tổng hợp tất cả môn học trong học kỳ kèm tỷ lệ hoàn thành |
| **21** | **Môn Học** | `21 - Subjects - Course Detail (Macroeconomics)` | Trang chi tiết môn học (Kinh tế vĩ mô): Mức độ ghi nhớ, số thẻ cần ôn và danh sách bài giảng thuộc môn |
| **22** | **Tìm Kiếm RAG** | `22 - Search - Neural RAG & Audio Snippets` | Tìm kiếm ngữ nghĩa 2-Stage Neural RAG trích xuất chính xác phân đoạn audio và câu trả lời tương ứng |
| **23** | **Ôn Tập** | `23 - Review - Spaced Repetition Study Hub` | Trung tâm ôn luyện ghi nhớ ngắt quãng (Spaced Repetition), quản lý các bộ thẻ (Decks) và tiến độ tuần |
| **24** | **Flashcard** | `24 - Flashcard - Question (Front)` | Mặt trước thẻ học Flashcard (Active Recall Question) kèm nút gợi ý và mốc nghe lại |
| **25** | **Flashcard** | `25 - Flashcard - Answer (Back)` | Mặt sau thẻ học Flashcard: Lời giải thích, phát lại trích đoạn bài giảng và nút đánh giá độ nhớ |
| **26** | **Ôn Tập** | `26 - Review - Session Complete Celebration` | Màn hình chúc mừng sau khi hoàn thành phiên ôn tập, cập nhật streak và số thẻ làm đúng |
| **27** | **Hồ Sơ** | `27 - Profile - Student Stats & Activity` | Trang cá nhân sinh viên: Thống kê số giờ nghe giảng, thẻ đã thuộc, bản đồ nhiệt học tập (Activity Heatmap) |
| **28** | **Cài Đặt** | `28 - Settings - App Preferences` | Cài đặt ứng dụng: Nhắc nhở học tập, tốc độ phát mặc định, ngôn ngữ ASR, quản lý bộ nhớ đệm và tài khoản |

---

## 8. 📱 Quy Chuẩn Định Dạng Ứng Dụng Di Động Native (Expo SDK 58 Architecture)

> [!IMPORTANT]
> **BẢN CHẤT PRODUCT: LECTURELENS LÀ ỨNG DỤNG DI ĐỘNG NATIVE (EXPO SDK 58 / REACT NATIVE 0.88+)**
> Tất cả các nhà thiết kế và AI Agents khi sinh code giao diện bắt buộc phải tuân theo format điện thoại di động:

1. **Kích Thước Khung Di Động Chuẩn (Mobile Viewport Reference)**:
   - Chiều rộng chuẩn: **`390px`** (iPhone 14/15/16).
   - Chiều cao chuẩn: **`844px`** đến **`884px`** (khớp chính xác 1:1 với kích thước canvas của 28 tệp thiết kế SVG mẫu).
2. **Native Safe Areas & Status Bar**:
   - Sử dụng `react-native-safe-area-context` để tự động xử lý khoảng cách an toàn cho notch / Dynamic Island và thanh Home Indicator của hệ điều hành.
   - `<StatusBar style="dark" />` hiển thị hài hòa trên nền canvas Washi Cream `#FFF7FD`.
3. **Đồ Họa & Chuyển Động Native**:
   - Động cơ đồ họa `@shopify/react-native-skia` chạy ở tần số 60–120 FPS để thể hiện linh vật Cáo Kitsune và hiệu ứng cánh hoa anh đào rơi (`FloatingPetals2D`).
   - Phản hồi xúc giác `expo-haptics` kết hợp `react-native-reanimated` cho hiệu ứng nén Mochi (`scale 0.97` / 150ms).
4. **Vùng Tương Tác Chạm (Thumb Zone & Touch Targets)**:
   - Mọi nút bấm, tab điều hướng, chip lọc phải có chiều cao tối thiểu `44px` - `52px`, đạt tiêu chuẩn công thái học điều khiển một tay (One-Handed Mobile Ergonomics).
