# 🌸 Thư Viện Biểu Tượng Chuẩn Hóa: Kitsune Soft Iconography

> **QUY CHUẨN KỸ THUẬT BẮT BUỘC (ARCHITECTURAL INVARIANT):**  
> **TẤT CẢ các AI Agents và Lập trình viên khi phát triển Frontend (`frontend/`) BẮT BUỘC phải import và sử dụng bộ Icon này.**  
> 🚫 **TUYỆT ĐỐI KHÔNG TỰ Ý VẼ LẠI INLINE SVG** trong các trang hay component.  
> 🚫 **TUYỆT ĐỐI KHÔNG IMPORT CÁC THƯ VIỆN BÊN NGOÀI** (như `lucide-react`, `heroicons`, `react-icons`,...) một cách tùy tiện làm sai lệch tỷ lệ nét vẽ `1.75px` và phá vỡ ngôn ngữ thiết kế Duotone Soft-Blob của Kitsune Soft.

---

## 1. 🎨 Đặc Tả Thiết Kế (Design System Specs)

Mọi biểu tượng trong thư viện này được thiết kế và tối ưu chuẩn hóa theo các quy tắc cốt lõi từ [`docs/design-system.md`](../../../docs/design-system.md) (Mục 6.4):

1. **Hệ Lưới & Tọa Độ (Grid & ViewBox):**
   - Chuẩn hệ tọa độ phẳng `viewBox="0 0 24 24"`.
   - Độ dày nét chính (**Stroke Width**): Chuẩn `1.75px` (hoặc `2.0px` khi cần nhấn mạnh).
   - Đầu mút & Khớp nối: `stroke-linecap="round"` và `stroke-linejoin="round"`.
2. **Màu Sắc Mực (Plum Ink Invariant):**
   - Màu nét vẽ mặc định: Mực mận chín cao cấp `#261333` (`plum-ink`) hoặc kế thừa từ `currentColor`.
   - Tuyệt đối không dùng màu đen `#000000` thô ráp.
3. **Đốm Nền Hữu Cơ Hai Tông (Duotone Soft-Blob):**
   - Bật tấm lót bằng prop `blob={true}` hoặc chỉ định màu `blob="sakura" | "mist" | "mochi" | "matcha" | "coral"`.
   - Tấm lót là hình dạng hữu cơ mềm mại (`border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%`), thu nhỏ tỷ lệ 68% và đặt lệch góc `+2px, +2px` tạo chiều sâu thị giác ấm áp.

---

## 2. 🚀 Hướng Dẫn Sử Dụng (Quick Start)

### Cách 1: Sử Dụng Named Component (Khuyên Dùng - Tối Ưu Tree-Shaking)

```tsx
import { HomeIcon, MicIcon, SparklesIcon, CheckCircleIcon } from '@/components/ui/icons'

export function StudyCard() {
  return (
    <div className="flex items-center gap-3">
      {/* Icon cơ bản */}
      <HomeIcon size="md" className="text-[#261333]" />

      {/* Icon có tấm lót hữu cơ Soft-Blob pastel */}
      <MicIcon size="lg" blob="coral" />

      {/* Icon trợ lý AI tự động dùng blob mặc định */}
      <SparklesIcon size="xl" blob />

      {/* Icon hoàn thành có nhãn tiếp cận Screen Reader */}
      <CheckCircleIcon size="sm" ariaLabel="Đã hoàn thành phân tích" className="text-emerald-600" />
    </div>
  )
}
```

### Cách 2: Sử Dụng Component Đa Hình Động (`Icon`)

Dùng khi tên icon được truyền động từ cấu hình, dữ liệu server hoặc router:

```tsx
import { Icon } from '@/components/ui/icons'
import type { IconName } from '@/components/ui/icons'

interface NavButtonProps {
  iconName: IconName
  label: string
}

export function NavButton({ iconName, label }: NavButtonProps) {
  return (
    <button className="flex items-center gap-2 p-2 rounded-full hover:bg-black/5">
      <Icon name={iconName} size="md" blob />
      <span>{label}</span>
    </button>
  )
}
```

---

## 3. 📐 Thông Số Thuộc Tính (Component Props)

| Thuộc Tính (Prop) | Kiểu Dữ Liệu (Type) | Mặc Định | Diễn Giải & Tác Dụng |
| :--- | :--- | :---: | :--- |
| **`name`** | `IconName` | `'sparkles'` | Tên định danh của biểu tượng (chỉ dùng với `<Icon />`) |
| **`size`** | `IconSize` | `'lg'` (24px) | `'xs'` (14px), `'sm'` (16px), `'md'` (20px), `'lg'` (24px), `'xl'` (32px), `'2xl'` (40px) hoặc số pixel |
| **`blob`** | `boolean \| BlobColor` | `undefined` | Bật đốm nền hữu cơ: `'sakura'`, `'mist'`, `'mochi'`, `'matcha'`, `'coral'`, `'plum'` |
| **`strokeWidth`** | `number` | `1.75` | Độ dày đường vẽ nét (chuẩn 1.75px) |
| **`strokeColor`** | `string` | `'currentColor'` | Màu nét vẽ ghi đè (HEX hoặc class Tailwind) |
| **`ariaLabel`** | `string` | `undefined` | Nhãn trợ thính màn hình (Screen Reader), tự chuyển `role="img"` |
| **`className`** | `string` | `''` | Class Tailwind bổ sung |

---

## 4. 📚 Danh Mục Đầy Đủ 74 Biểu Tượng (Icon Catalog)

### 4.1. Điều Hướng & Khung Ứng Dụng (Navigation & Shell)
| Tên Component | Định Danh (`name`) | Blob Khuyên Dùng | Vị Trí Áp Dụng (28 Màn Hình) |
| :--- | :--- | :---: | :--- |
| `<HomeIcon />` | `home` | `sakura` | Tab bar chính, màn hình 08, 09, 26 |
| `<LibraryIcon />` | `library` | `mist` | Tab bar chính, màn hình 10, 11, 12 |
| `<SubjectsIcon />` | `subjects` | `mochi` | Tab bar chính, màn hình 20, 21 |
| `<ReviewIcon />` | `review` | `matcha` | Tab bar chính, màn hình 23, 24, 25, 26 |
| `<ProfileIcon />` | `profile` | `coral` | Tab bar chính, màn hình 27 |
| `<PlusIcon />` | `plus` | `coral` | FAB Button trung tâm, thêm môn học |
| `<ArrowLeftIcon />` | `arrow-left` | — | Thanh điều hướng quay lại (Header Top bar) |
| `<ArrowRightIcon />` | `arrow-right` | — | Nút chuyển tiếp bước Onboarding, CTA tiếp tục |
| `<CloseIcon />` | `close` | — | Nút X đóng Bottom Sheet, Modal, Flashcard |
| `<MoreHorizontalIcon />` | `more-horizontal` | — | Dấu ba chấm tùy chọn thẻ bài giảng |
| `<MoreVerticalIcon />` | `more-vertical` | — | Dấu ba chấm menu chi tiết bài giảng |
| `<SearchIcon />` | `search` | `mist` | Thanh tìm kiếm bài giảng, tìm kiếm Neural RAG |
| `<FilterIcon />` | `filter` | — | Bộ lọc môn học, ngày tháng |
| `<SortIcon />` | `sort` | — | Sắp xếp thứ tự bài giảng |
| `<SettingsIcon />` | `settings` | `plum` | Nút cài đặt ứng dụng, màn hình 28 |
| `<BellIcon />` | `bell` | `mochi` | Chuông thông báo học tập |
| `<BellDotIcon />` | `bell-dot` | `coral` | Chuông thông báo có chấm đỏ chưa đọc |
| `<ChevronDownIcon />` | `chevron-down` | — | Mở rộng accordion danh sách chương |
| `<ChevronUpIcon />` | `chevron-up` | — | Thu gọn accordion |
| `<ChevronRightIcon />` | `chevron-right` | — | Mũi tên dẫn hướng trang cài đặt |

### 4.2. Âm Thanh, Thu Âm & Trình Phát (Audio & Playback)
| Tên Component | Định Danh (`name`) | Blob Khuyên Dùng | Vị Trí Áp Dụng (28 Màn Hình) |
| :--- | :--- | :---: | :--- |
| `<MicIcon />` | `mic` | `coral` | Thu âm bài giảng trực tiếp, màn hình 02, 13, 14, 15 |
| `<MicOffIcon />` | `mic-off` | — | Tắt micro / Tạm ngắt thu âm |
| `<UploadIcon />` | `upload` | `mist` | Nạp tệp âm thanh từ máy, màn hình 13 |
| `<CloudUploadIcon />` | `cloud-upload` | `mist` | Tải lên bộ nhớ đám mây |
| `<LinkIcon />` | `link` | `mochi` | Dán URL bài giảng (YouTube, Google Drive), màn hình 13 |
| `<WaveformIcon />` | `waveform` | `matcha` | Nạp từ Apple Voice Memos, màn hình 13 |
| `<PlayIcon />` | `play` | — | Phát âm thanh Capsule Player, phát bài giảng |
| `<PauseIcon />` | `pause` | — | Tạm dừng phát / tạm dừng thu âm |
| `<StopIcon />` | `stop` | — | Dừng và lưu bản ghi âm giảng đường |
| `<Replay10Icon />` | `replay-10` | — | Tua lùi 10 giây |
| `<Forward10Icon />` | `forward-10` | — | Tua tới 10 giây |
| `<HeadphonesIcon />` | `headphones` | `sakura` | Trình phát Capsule, thẻ tóm tắt âm thanh |
| `<SpeakerIcon />` | `speaker` | — | Loa trích đoạn phát âm thanh lời thoại |
| `<SpeedIcon />` | `speed` | — | Điều chỉnh tốc độ bài giảng (1.0x - 2.0x) |
| `<SnippetPlayIcon />` | `snippet-play` | `coral` | Phát câu trích đoạn trả lời Neural RAG |

### 4.3. Trí Tuệ AI & Ghi Chú Cornell (AI & Cornell Notes)
| Tên Component | Định Danh (`name`) | Blob Khuyên Dùng | Vị Trí Áp Dụng (28 Màn Hình) |
| :--- | :--- | :---: | :--- |
| `<SparklesIcon />` | `sparkles` | `coral` | Trợ lý AI Kitsune, trích xuất điểm nhấn, tóm tắt RAG |
| `<FileTextIcon />` | `file-text` | `mochi` | Ghi chú tóm tắt bài giảng chuẩn Cornell |
| `<ClockIcon />` | `clock` | `matcha` | Mốc thời gian `[MM:SS]` lời thoại đồng bộ |
| `<StarIcon />` | `star` | `mochi` | Gắn sao highlight bài giảng, yêu thích |
| `<BookmarkIcon />` | `bookmark` | `sakura` | Đánh dấu phân đoạn quan trọng |
| `<HighlighterIcon />` | `highlighter` | `mochi` | Bút dạ quang điểm nhấn thi cử |
| `<FlameIcon />` | `flame` | `coral` | Chuỗi ngày học Streak, cảnh báo trọng tâm đề thi |
| `<HelpCircleIcon />` | `help-circle` | `mist` | Câu hỏi gợi mở Cues cột Cornell |
| `<ListTreeIcon />` | `list-tree` | — | Cây mục lục chương bài học |
| `<DownloadIcon />` | `download` | `matcha` | Tải bài học về bộ nhớ máy (Vault ngoại tuyến) |
| `<ShareIcon />` | `share` | — | Xuất báo cáo PDF, Markdown |
| `<CopyIcon />` | `copy` | — | Sao chép lời thoại bài giảng |
| `<RobotAiIcon />` | `robot-ai` | `coral` | Trợ lý phân tích ngữ nghĩa Neural RAG |

### 4.4. Ôn Tập, Flashcards & Phản Xạ (Review & Flashcards)
| Tên Component | Định Danh (`name`) | Blob Khuyên Dùng | Vị Trí Áp Dụng (28 Màn Hình) |
| :--- | :--- | :---: | :--- |
| `<CardsIcon />` | `cards` | `sakura` | Bộ thẻ học ghi nhớ ngắt quãng (Decks) |
| `<FlipCardIcon />` | `flip` | `mochi` | Nút lật thẻ xem đáp án 3D Mochi |
| `<LightbulbIcon />` | `lightbulb` | `mochi` | Gợi ý khi bí câu trả lời flashcard |
| `<TrophyIcon />` | `trophy` | `mochi` | Cúp hoàn thành xuất sắc phiên ôn tập |
| `<PartyPopperIcon />` | `party-popper` | `sakura` | Pháo bông ăn mừng streak màn hình 26 |
| `<BrainIcon />` | `brain` | `mist` | Bán cầu não phương pháp Active Recall |
| `<RatingAgainIcon />` | `rating-again` | — | Đánh giá "Quên hẳn" (Màu Đỏ San Hô) |
| `<RatingHardIcon />` | `rating-hard` | — | Đánh giá "Khó nhớ" (Màu Cam Mochi) |
| `<RatingGoodIcon />` | `rating-good` | — | Đánh giá "Nhớ tốt" (Màu Lam Sương) |
| `<RatingEasyIcon />` | `rating-easy` | — | Đánh giá "Dễ ợt" (Màu Xanh Matcha) |

### 4.5. Linh Vật, Bảo Mật & Hệ Thống (Mascot & System)
| Tên Component | Định Danh (`name`) | Blob Khuyên Dùng | Vị Trí Áp Dụng (28 Màn Hình) |
| :--- | :--- | :---: | :--- |
| `<KitsuneFoxIcon />` | `kitsune-fox` | `coral` | Đầu linh vật Cáo Kitsune Pixel Art |
| `<CrownIcon />` | `crown` | `mochi` | Vương miện gói học tập Kitsune Plus |
| `<CheckIcon />` | `check` | — | Dấu tích đơn |
| `<CheckCircleIcon />` | `check-circle` | `matcha` | Vòng tròn tích xanh hoàn thành bước |
| `<CheckDoubleIcon />` | `check-double` | — | Hai dấu tích xác nhận đã đồng bộ |
| `<WifiOffIcon />` | `wifi-off` | — | Cảnh báo mất kết nối / Ngoại tuyến |
| `<LockIcon />` | `lock` | `plum` | Bảo mật quyền riêng tư on-premise (ADR 0001) |
| `<LockCheckIcon />` | `lock-check` | `matcha` | Khóa an toàn xác nhận mật khẩu |
| `<EyeIcon />` | `eye` | — | Hiện mật khẩu sinh viên |
| `<EyeOffIcon />` | `eye-off` | — | Ẩn mật khẩu |
| `<MailIcon />` | `mail` | `mist` | Email đăng nhập sinh viên |
| `<PencilIcon />` | `pencil` | — | Chỉnh sửa ghi chú và thông tin cá nhân |
| `<TrashIcon />` | `trash` | — | Xóa bài giảng / dọn bộ nhớ cache |
| `<RefreshIcon />` | `refresh` | — | Thử lại kết nối / Làm mới danh sách |
| `<GoogleIcon />` | `google` | — | Nút đăng nhập Google |
| `<AppleIcon />` | `apple` | — | Nút đăng nhập Apple |

---

## 5. 📂 Tệp SVG Thuần Túy (Raw SVG Directory)

Ngoài React Components, toàn bộ 74 tệp vector SVG độc lập được lưu trữ tại:
```
frontend/src/assets/icons/
  ├── home.svg
  ├── library.svg
  ├── mic.svg
  ├── sparkles.svg
  └── ... (74 tệp)
```
Các tệp này có thể nhúng trực tiếp vào thẻ `<img src="...">`, nhúng vào tài liệu hoặc mở trên Figma khi cần thiết kế bổ sung.
