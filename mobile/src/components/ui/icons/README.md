# 🦊 Kitsune Soft Native Icons

Bộ **74 biểu tượng** chuẩn hoá của LectureLens cho React Native (`react-native-svg`), phong cách **Duotone Soft-Blob**: nét outline **1.75px** màu Plum Ink `#261333` trên tấm lót đốm pastel hữu cơ.

- Nguồn SVG gốc: [`docs/design-assets/icons/`](../../../../../docs/design-assets/icons/) (74 tệp, đối chiếu 1:1 bởi test)
- Registry: [`registry.ts`](./registry.ts) · Kiểu: [`types.ts`](./types.ts) · Component: [`Icon.tsx`](./Icon.tsx), [`SoftBlob.tsx`](./SoftBlob.tsx)

> [!IMPORTANT]
> Theo [AGENTS.md](../../../../../AGENTS.md) §2.6: **luôn** dùng `<Icon />` từ module này. **Không** vẽ inline SVG trong component giao diện, **không** thêm thư viện icon ngoài (`lucide-react`, `heroicons`, …).

---

## Cách Dùng

```tsx
import { Icon, MicIcon } from '@/components/ui/icons' // alias @/* → mobile/src/* (tsconfig.json)

<MicIcon size="md" />                                  // 74 component đặt tên sẵn (PascalCase + "Icon")

<Icon name="mic" />                                   // 24px, nét 1.75px, màu plum ink
<Icon name="home" size="xl" blob />                    // bật Soft-Blob với màu mặc định của icon
<Icon name="star" size={28} blob="mochi" />            // ép màu blob
<Icon name="search" accessibilityLabel="Tìm kiếm" />   // có nhãn → role="image" cho screen reader
```

| Prop | Kiểu | Mặc định | Ghi chú |
| :--- | :--- | :--- | :--- |
| `name` | `IconName` | `'sparkles'` | Tên không có trong registry → trả `null` (cảnh báo khi `__DEV__`) |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| number` | `'lg'` | 14 / 16 / 20 / 24 / 32 / 40 px |
| `blob` | `boolean \| BlobColor` | — | `true` dùng blob mặc định của icon (hoặc `sakura` nếu icon không có) |
| `strokeWidth` | `number` | `1.75` | Giữ nguyên chuẩn trừ khi thiết kế yêu cầu |
| `strokeColor` | `string` | `KITSUNE_COLORS.plumInk` | |
| `accessibilityLabel` | `string` | — | Không có nhãn → icon được ẩn khỏi trình đọc màn hình |

### Soft-Blob Palette (`SOFT_BLOB_PALETTE`)

| `BlobColor` | HEX | Token |
| :--- | :---: | :--- |
| `sakura` | `#F5C3C9` | sakura-pink |
| `mist` | `#A9D4E8` | mist-sky |
| `mochi` | `#FFE27A` | mochi-yellow |
| `matcha` | `#BEE1D0` | matcha-mint |
| `coral` | `#F47F72` | kitsune-coral |
| `plum` | `#261333` | plum-ink |

---

## Danh Mục 74 Biểu Tượng

Cột **Blob** là màu blob mặc định khi `blob={true}` (`—` = không khai báo, rơi về `sakura`).

### navigation (20)

| Tên | Blob | Ý nghĩa |
| :--- | :---: | :--- |
| `home` | sakura | Bàn học (Home) |
| `library` | mist | Kho bài giảng (Library) |
| `subjects` | mochi | Môn học (Subjects) |
| `review` | matcha | Ôn tập (Review) |
| `profile` | coral | Hồ sơ sinh viên (Profile) |
| `plus` | coral | Thêm mới |
| `arrow-left` | — | Quay lại |
| `arrow-right` | — | Tiếp tục |
| `close` | — | Đóng |
| `more-horizontal` | — | Tuỳ chọn ngang |
| `more-vertical` | — | Tuỳ chọn dọc |
| `search` | mist | Tìm kiếm ngữ nghĩa |
| `filter` | — | Bộ lọc |
| `sort` | — | Sắp xếp |
| `settings` | plum | Cài đặt |
| `bell` | mochi | Thông báo |
| `bell-dot` | coral | Thông báo chưa đọc |
| `chevron-down` | — | Mở rộng |
| `chevron-up` | — | Thu gọn |
| `chevron-right` | — | Điều hướng mục |

### audio (15)

| Tên | Blob | Ý nghĩa |
| :--- | :---: | :--- |
| `mic` | coral | Thu âm giảng đường |
| `mic-off` | — | Tắt mic |
| `upload` | mist | Tải tệp âm thanh |
| `cloud-upload` | mist | Tải lên |
| `link` | mochi | Dán liên kết |
| `waveform` | matcha | Ghi âm Voice Memos |
| `play` | — | Phát |
| `pause` | — | Tạm dừng |
| `stop` | — | Dừng ghi âm |
| `replay-10` | — | Tua lại 10s |
| `forward-10` | — | Tua tới 10s |
| `headphones` | sakura | Tai nghe bài giảng |
| `speaker` | — | Loa trích đoạn |
| `speed` | — | Tốc độ phát |
| `snippet-play` | coral | Nghe trích đoạn gốc |

### ai (2)

| Tên | Blob | Ý nghĩa |
| :--- | :---: | :--- |
| `sparkles` | coral | Trợ lý AI Kitsune |
| `robot-ai` | coral | Trợ lý 2-Stage Neural RAG |

### study (11)

| Tên | Blob | Ý nghĩa |
| :--- | :---: | :--- |
| `file-text` | mochi | Tóm tắt Cornell Notes |
| `clock` | matcha | Mốc thời gian `[MM:SS]` |
| `star` | mochi | Đánh dấu điểm nhấn |
| `bookmark` | sakura | Đánh dấu phân đoạn |
| `highlighter` | mochi | Trích xuất điểm nhấn |
| `flame` | coral | Chuỗi streak & cảnh báo đề thi |
| `help-circle` | mist | Câu hỏi gợi nhớ (Cues) |
| `list-tree` | — | Cây mục lục chương |
| `download` | matcha | Tải vào bộ nhớ máy (Vault) |
| `share` | — | Xuất & chia sẻ |
| `copy` | — | Sao chép văn bản |

### review (10)

| Tên | Blob | Ý nghĩa |
| :--- | :---: | :--- |
| `cards` | sakura | Kitsune Flashcard |
| `flip` | mochi | Lật thẻ |
| `lightbulb` | mochi | Gợi ý đáp án |
| `trophy` | mochi | Vinh danh hoàn thành |
| `party-popper` | sakura | Chúc mừng thành tích |
| `brain` | mist | Lặp lại ngắt quãng |
| `rating-again` | — | Đánh giá: Quên hẳn |
| `rating-hard` | — | Đánh giá: Khó nhớ |
| `rating-good` | — | Đánh giá: Nhớ tốt |
| `rating-easy` | — | Đánh giá: Dễ |

### mascot (1)

| Tên | Blob | Ý nghĩa |
| :--- | :---: | :--- |
| `kitsune-fox` | coral | Kitsune Fox Companion |

### system (15)

| Tên | Blob | Ý nghĩa |
| :--- | :---: | :--- |
| `crown` | mochi | Kitsune Plus |
| `check` | — | Dấu tích |
| `check-circle` | matcha | Hoàn thành |
| `check-double` | — | Đã xử lý |
| `wifi-off` | — | Ngoại tuyến |
| `lock` | plum | Khoá bảo mật On-Premise |
| `lock-check` | matcha | Khoá an toàn |
| `eye` | — | Hiện mật khẩu |
| `eye-off` | — | Ẩn mật khẩu |
| `mail` | mist | Email sinh viên |
| `pencil` | — | Chỉnh sửa ghi chú |
| `trash` | — | Xoá bài giảng |
| `refresh` | — | Đồng bộ & thử lại |
| `google` | — | Đăng nhập Google |
| `apple` | — | Đăng nhập Apple |

---

## Thêm Biểu Tượng Mới

1. Thêm tệp SVG nguồn (viewBox `0 0 24 24`, nét 1.75px) vào `docs/design-assets/icons/<name>.svg`.
2. Thêm `<name>` vào union `IconName` trong `types.ts`.
3. Thêm entry vào `ICON_REGISTRY` trong `registry.ts` (`title`, `category`, `blob` tuỳ chọn, `paths`) và component đặt tên trong `index.tsx`.
4. Cập nhật số lượng mong đợi trong `__tests__/icons.test.ts` và bảng trên, rồi chạy `npm test`.

> [!NOTE]
> Comment đầu `registry.ts` còn ghi "69 standardized" — đó là số cũ; registry và test hiện xác nhận **74**.
