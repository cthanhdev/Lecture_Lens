# 🌸 LectureLens UX Flow & Navigation Architecture Specification
## Hiến Chương Điều Hướng & Luồng Trải Nghiệm Người Dùng (28 Màn Hình)

> **Tài liệu đặc tả kiến trúc điều hướng chuẩn (Single Source of Truth - SSOT)**  
> Dựa trên 28 tệp thiết kế tại [`docs/design-assets/screens/svg/`](./design-assets/screens/svg/) & [`png/`](./design-assets/screens/png/), tuân thủ triết lý **Deep Modules (Matt Pocock)**, ngôn ngữ thiết kế **Kitsune Soft** và hệ thống thực thể **LectureLens Domain Glossary**.
>
> 📁 **Tệp sơ đồ đi kèm:**  
> - **Draw.io Master File**: [`docs/ux-navigation-flow.drawio`](./ux-navigation-flow.drawio) (Mở trực tiếp trên diagrams.net / VS Code Extension)  
> - **Vector SVG Visual Map**: [`docs/ux-navigation-flow.svg`](./ux-navigation-flow.svg) (Xem trước trực tiếp trên mọi trình duyệt)

---

## 1. 🧭 Triết Lý Kiến Trúc Điều Hướng (Navigation Architecture Philosophy)

Hệ thống điều hướng của LectureLens Mobile Application (Expo Router v58 / React Native New Architecture) được thiết kế nhằm đạt được 3 mục tiêu bất biến:
1. **Zero-Dead-End Guarantee (Bảo đảm không bao giờ cụt đường / kẹt trang):** Tuyệt đối không có bất kỳ màn hình nào rơi vào tình trạng người dùng bấm quay lại (Back button / gesture / browser history) mà bị kẹt, bị tải lại trang vô tận hoặc không thể rollback về trạng thái an toàn.
2. **Deep Module Navigation Coordinator (Module sâu theo Matt Pocock):** Giao diện điều hướng (`AppNavigator`) cực kỳ nhỏ gọn và dễ sử dụng cho các view/component; toàn bộ logic phức tạp (ngăn chặn mất dữ liệu, đồng bộ URL, quản lý ngăn xếp modal sheet, duy trì âm thanh của Capsule Audio Player) được ẩn giấu hoàn toàn bên trong Implementation.
3. **Capsule Audio Player Continuity (Âm thanh bài giảng không gián đoạn):** Quá trình nghe bài giảng tiếp diễn liên tục không ngắt quãng khi người dùng di chuyển giữa các màn hình, chuyển tab hoặc mở modal.

---

## 2. 🗺️ Sơ Đồ Tổng Thể Luồng Trải Nghiệm (Visual Master Flow)

Dưới đây là sơ đồ Mermaid tổng hợp toàn bộ 28 màn hình phân chia theo 5 cụm chức năng (Zones):

```mermaid
flowchart TD
    %% Styling tokens
    classDef bootstrap fill:#F5C3C9,stroke:#261333,stroke-width:1.5px,color:#261333;
    classDef wizard fill:#FFF7FD,stroke:#F47F72,stroke-width:1.5px,color:#261333;
    classDef auth fill:#FFF7FD,stroke:#A03F36,stroke-width:2px,color:#261333;
    classDef tabRoot fill:#FFFFFF,stroke:#F47F72,stroke-width:2.5px,color:#261333;
    classDef stateLayer fill:#FFFBF2,stroke:#A9D4E8,stroke-width:1.5px,stroke-dasharray: 4 2,color:#261333;
    classDef modalSheet fill:#FFFFFF,stroke:#0284C7,stroke-width:2px,color:#261333;
    classDef guarded fill:#FFFDF0,stroke:#D97706,stroke-width:2.5px,color:#261333;
    classDef transient fill:#F8F6FF,stroke:#7C3AED,stroke-width:2px,color:#261333;
    classDef workspace fill:#FFFFFF,stroke:#BEE1D0,stroke-width:2px,color:#261333;

    %% ZONE 1: Onboarding & Auth
    subgraph Z1 ["ZONE 1: Khởi Động & Xác Thực"]
        S01["[01] Splash Launch"]:::bootstrap
        S02["[02] Onboarding 1 (Record/Upload)"]:::wizard
        S03["[03] Onboarding 2 (Find Matters)"]:::wizard
        S04["[04] Onboarding 3 (Remember It)"]:::wizard
        S05["[05] Auth Sign In"]:::auth
        S06["[06] Auth Create Account"]:::auth
        S07["[07] Paywall Kitsune Plus"]:::modalSheet
    end

    %% ZONE 2: Main Floating Island Tab Bar
    subgraph Z2 ["ZONE 2: Bàn Học Chính & Floating Island Tab Bar"]
        S08["[08] Home Study Hub (Tab 1)"]:::tabRoot
        S09["[09] Home Offline State"]:::stateLayer
        S10["[10] Library Archive (Tab 2)"]:::tabRoot
        S11["[11] Library Empty State"]:::stateLayer
        S12["[12] Library Offline State"]:::stateLayer
        S20["[20] Subjects Archive (Tab 3)"]:::tabRoot
        S23["[23] Review Study Hub (Tab 4)"]:::tabRoot
        S27["[27] Profile Stats (Tab 5)"]:::tabRoot
        S28["[28] Settings Preferences"]:::workspace
    end

    %% ZONE 3: Audio Capture & Search
    subgraph Z3 ["ZONE 3: Ghi Âm & Tìm Kiếm"]
        S22["[22] Search Neural RAG"]:::modalSheet
        S13["[13] Audio Add Bottom Sheet"]:::modalSheet
        S14["[14] Audio Live Recording"]:::guarded
        S15["[15] Audio Processing Pipeline"]:::transient
    end

    %% ZONE 4: Lecture Workspace
    subgraph Z4 ["ZONE 4: Không Gian Bài Giảng & Ghi Chú"]
        S16["[16] Audio Detail: Transcript"]:::workspace
        S17["[17] Audio Detail: Key Highlights"]:::workspace
        S18["[18] Audio Detail: Cornell Overview"]:::workspace
        S19["[19] Audio Detail: Cornell Chapter"]:::workspace
        S21["[21] Course Detail: Macroeconomics"]:::workspace
    end

    %% ZONE 5: Active Recall & Flashcards
    subgraph Z5 ["ZONE 5: Ôn Tập Chủ Động (Flashcards)"]
        S24["[24] Flashcard Question (Front)"]:::guarded
        S25["[25] Flashcard Answer (Back)"]:::workspace
        S26["[26] Review Complete Celebration"]:::transient
    end

    %% Connectors - Ingress & Onboarding
    S01 -->|First Launch (replace)| S02
    S01 -->|Unauthenticated (replace)| S05
    S01 -->|Authenticated (replace)| S08

    S02 -->|Swipe Left / Continue| S03
    S03 -.->|Swipe Right / Back| S02

    S03 -->|Swipe Left / Continue| S04
    S04 -.->|Swipe Right / Back| S03

    S04 -->|Get started (replace)| S05
    S05 <-->|Toggle Sign In / Sign Up| S06
    S05 -->|Sign In Success (replace)| S08
    S06 -->|Offer Upgrade| S07
    S06 -->|Direct (replace)| S08
    S07 -.->|Dismiss (Pop Sheet)| S08

    %% Connectors - Tab Island Navigation
    S08 <--> S10
    S10 <--> S20
    S20 <--> S23
    S23 <--> S27

    S08 -.->|Network Lost| S09
    S10 -.->|Zero Lectures| S11
    S10 -.->|Network Lost| S12
    S27 -->|Open Settings| S28
    S28 -.->|Back (Rollback to Profile)| S27
    S27 -->|Upgrade Banner| S07

    %% Connectors - Search & Audio Capture
    S08 -->|Tap Search Bar| S22
    S22 -.->|Close (Rollback)| S08
    S08 -->|Tap + Audio| S13
    S10 -->|Tap Add| S13
    S11 -->|Tap CTA| S13
    S13 -.->|Dismiss (Pop Sheet)| S08

    S13 -->|Select Live Record| S14
    S13 -->|Upload Audio File| S15
    S14 -->|Stop & Submit (replace)| S15
    S14 -.->|Cancel (Guard Intercept)| S08

    S15 -->|ASR Complete (replace)| S16
    S15 -->|Run in Background (replace)| S10

    %% Connectors - Lecture Workspace
    S08 -->|Select Recent Lecture| S16
    S10 -->|Select Lecture Card| S16
    S21 -->|Select Course Lecture| S16
    S22 -->|Click [MM:SS] Citation| S16
    S16 -.->|Back (Rollback to Origin Parent)| S10

    S16 <-->|Sub-tab| S17
    S16 <-->|Sub-tab| S18
    S18 -->|Drilldown Chapter| S19
    S19 -.->|Back (Rollback to Cornell)| S18

    S20 -->|Select Course| S21
    S21 -.->|Back (Rollback to Subjects)| S20

    %% Connectors - Flashcard Active Recall
    S23 -->|Start Deck Session| S24
    S18 -->|Create Deck from Cornell| S23
    S24 -.->|Exit (Guard Intercept)| S23
    S24 <-->|Tap to Flip (In-Card)| S25
    S25 -->|Rate & Next Card (Replace)| S24
    S25 -->|Last Card Rated (replace)| S26
    S26 -->|Finish & Back to Hub (replace)| S23
```

---

## 3. 🛡️ Năm Định Luật Chống Kẹt Trang (The 5 Anti-Trap Laws)

Để giải quyết triệt để yêu cầu: **"Chuyển trang có logic và không có trang nào gặp tình trạng vào mà không rollback được"**, toàn bộ router và điều hướng phải tuân thủ nghiêm ngặt 5 định luật sau:

### Định Luật 1: Hierarchy Fallback Matrix (Bản Đồ Quay Lui Khi Vào Bằng Deep-Link)
- **Vấn đề:** Khi sinh viên truy cập trực tiếp bằng đường dẫn chia sẻ (ví dụ `https://lecturelens.app/lectures/123/cornell`), ngăn xếp trình duyệt `window.history.length === 1`. Nếu bấm nút `<` (Back) trong giao diện, `history.back()` sẽ không làm gì hoặc thoát khỏi trang web.
- **Quy tắc giải quyết:** Mọi route con đều có một **Parent Route Fallback** xác định trước:
  ```typescript
  export const ROUTE_PARENT_FALLBACK: Record<string, string> = {
    '/lectures/:id/transcript': '/library',
    '/lectures/:id/highlights': '/library',
    '/lectures/:id/cornell': '/library',
    '/lectures/:id/chapters/:chId': '/lectures/:id/cornell',
    '/subjects/:courseId': '/subjects',
    '/settings': '/profile',
    '/review/session/:deckId': '/review',
    '/review/complete/:deckId': '/review',
    '/search': '/home',
    '/auth/create-account': '/auth/sign-in',
  };
  ```
  Nếu `navigation.canGoBack()` trả về `false`, nút quay lại sẽ tự động kích hoạt `goTo(parentFallback)`.

### Định Luật 2: Replace on Terminal Transitions (Thay Thế Ngăn Xếp Khi Kết Thúc Luồng Trung Gian)
- **Vấn đề:** Sau khi kết thúc ghi âm tại `[14] Audio - Live Recording`, người dùng vào `[15] Audio - Processing Pipeline`. Khi PhoWhisper xử lý xong, hệ thống chuyển sang `[16] Audio Detail`. Nếu không dùng `replace`, bấm Back từ màn hình 16 sẽ đưa người dùng quay lại màn hình xử lý số 15 (đã kết thúc), gây lỗi lặp hoặc treo vòng quay xử lý!
- **Quy tắc giải quyết:**
  - Chuyển tiếp `[14] Recording -> [15] Processing` bắt buộc dùng `replace: true`.
  - Chuyển tiếp `[15] Processing -> [16] Detail` bắt buộc dùng `replace: true`.
  - Chuyển tiếp `[25] Last Card -> [26] Session Complete` bắt buộc dùng `replace: true`.
  - Chuyển tiếp `[26] Complete -> [23] Review Hub` bắt buộc dùng `replace: true`.
  - Bấm quay lại từ `[16] Audio Detail` sẽ luôn nhảy thẳng về `[10] Library` hoặc `[08] Home`.

### Định Luật 3: Synchronized Layered Sheet Stack (Đồng Bộ Ngăn Xếp Modal & Lịch Sử)
- **Vấn đề:** Các trang như `[13] Audio - Add Bottom Sheet` hay `[07] Paywall` là các tấm thẻ trượt (Bottom Sheet / Modal). Nếu bấm nút Back trên điện thoại Android hoặc vuốt cạnh màn hình mà URL bị đổi mà modal không tắt, hoặc modal tắt mà lịch sử bị nhảy sai, người dùng sẽ bị kẹt giao diện.
- **Quy tắc giải quyết:**
  - Modal Sheets được quản lý qua `modalStack: string[]` liên kết với tham số truy vấn URL `?sheet=add-audio` hoặc `?modal=paywall`.
  - Sự kiện `popstate` (hoặc phím Back) sẽ ưu tiên pop tấm sheet trên cùng (`closeSheet()`), giữ nguyên màn hình bên dưới.
  - Chạm vào backdrop mờ (Miruku Glass Backdrop) hoặc vuốt thanh drag-handle xuống sẽ gọi `closeSheet()`, đồng bộ hóa việc đóng modal và xóa tham số URL.

### Định Luật 4: Dirty Route Guard Interceptor (Khóa Bảo Vệ Khi Có Dữ Liệu Chưa Lưu)
- **Vấn đề:** Ở màn hình `[14] Audio - Live Recording` (đang ghi âm bài giảng 50 phút) hoặc `[24] Flashcard` (đang làm dở 18/20 thẻ), việc bấm nhầm nút Back hoặc thao tác vuốt vô ý sẽ xóa sạch dữ liệu.
- **Quy tắc giải quyết:**
  - Màn hình 14 và 24 tự động đăng ký `NavigationGuard`.
  - Bất kỳ thao tác chuyển trang nào (`popstate`, click link, chuyển tab) đều bị chặn lại; hệ thống hiển thị hộp thoại xác nhận **Kitsune Mochi Warning Dialog**:
    - *Tiêu đề:* "Đang ghi âm bài giảng!"
    - *Nội dung:* "Nếu quay lại bây giờ, bản ghi âm hiện tại sẽ bị hủy và không thể khôi phục."
    - *Lựa chọn:* [Tiếp tục ghi âm] (Hủy navigation) / [Hủy bản ghi] (Tiếp tục navigation).

### Định Luật 5: Auth Redirection Sanitization (Tránh Vòng Lặp Đăng Nhập)
- **Vấn đề:** Người dùng chưa đăng nhập bấm vào liên kết bài giảng `/lectures/999`. Guard chuyển hướng về `/auth/sign-in`. Nếu người dùng bấm Back ở màn hình đăng nhập, trình duyệt lại quay lại `/lectures/999`, và guard lại nhảy sang `/auth/sign-in`, tạo thành vòng lặp vĩnh viễn không thể thoát!
- **Quy tắc giải quyết:**
  - Khi chưa đăng nhập, guard chuyển sang `/auth/sign-in?returnTo=/lectures/999` bằng `replace: true`.
  - Khi người dùng bấm Back tại `/auth/sign-in`, hệ thống kiểm tra nếu nguồn gốc là redirect nội bộ, nó sẽ đưa người dùng về trang an toàn mặc định `[02] Onboarding` hoặc thoát ứng dụng, tuyệt đối không lặp lại trang bị cấm.

---

## 4. 📊 Ma Trận Đặc Tả Chi Tiết 28 Màn Hình (The 28 Screens UX Matrix)

| ID | Tên Màn Hình & Tệp Mẫu | Đường Dẫn URL | Loại Giao Diện | Lối Vào (Ingress) | Tương Tác Chính (Egress) | Chính Sách Quay Lui (Rollback Guarantee) | Trạng Thái Âm Thanh (Capsule Audio) |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `01 - Splash - App Launch` | `/` | Bootstrap Fullscreen | Khởi động app lần đầu hoặc mở tab mới | Tự động kiểm tra auth & onboarding sau 1.2s | **Root Origin:** Không thể rollback; đóng app hoặc giữ nguyên. | Tắt |
| **02** | `02 - Onboarding - Step 1` | `/(onboarding)/step-1` | Swipeable Carousel | Từ `[01]` Splash (lần đầu) | Lướt trái hoặc bấm `Continue` -> `[03]` (không có `Skip`) | **Lock:** Không rollback về Splash; nhấn Back hệ thống không tạo vòng lặp. | Tắt |
| **03** | `03 - Onboarding - Step 2` | `/(onboarding)/step-2` | Swipeable Carousel | Từ `[02]` Onboarding 1 | Lướt trái / bấm `Continue` -> `[04]`, lướt phải -> `[02]` (không có `Skip`) | **Deterministic Pop:** Lướt phải / Back -> về `[02]`. | Tắt |
| **04** | `04 - Onboarding - Step 3` | `/(onboarding)/step-3` | Swipeable Carousel | Từ `[03]` Onboarding 2 | Lướt phải -> `[03]`, bấm `Get started` -> `[05]` Sign In (hoặc `[08]` nếu đã đăng nhập) | **Deterministic Pop + Replace:** Lướt phải / Back -> về `[03]`; `Get started` dùng `replace`. | Tắt |
| **05** | `05 - Auth - Sign In` | `/auth/sign-in` | Form Entry | Từ `[04]`, `[01]`, hoặc bấm Đăng nhập | Đăng nhập thành công -> `[08]`, Chuyển -> `[06]` | **Safe Fallback:** Back -> về `[04]` Onboarding hoặc giữ form. | Tắt |
| **06** | `06 - Auth - Create Account` | `/auth/create-account` | Form Entry | Từ `[05]` Sign In | Đăng ký thành công -> `[07]` hoặc `[08]` | **Deterministic Pop:** Back -> về `[05]` Sign In. | Tắt |
| **07** | `07 - Paywall - Kitsune Plus` | `modal:paywall` (`?sheet=paywall`) | Miruku Modal Sheet | Từ `[06]`, `[27]` Profile, hoặc chạm tính năng VIP | Bấm "Đăng ký gói", hoặc bấm "X" / "Để sau" | **Layered Pop:** Đóng sheet, rollback về màn hình gọi trước đó. | Không ngắt |
| **08** | `08 - Home - Study Hub` | `/home` | Tab Root 1 (Bàn học) | Từ Auth, hoặc bấm Tab 1 trên Floating Island | Ghi âm nhanh -> `[13]`, Tìm kiếm -> `[22]`, Bài giảng -> `[16]` | **Tab Anchor:** Bấm Back tại Home hiển thị "Nhấn lần nữa để thoát". | Tiếp tục phát mini |
| **09** | `09 - Home - Offline State` | `/home` (chế độ offline) | State Overlay | Mất kết nối mạng / Local DB offline | Bấm "Thử kết nối lại", Học thẻ Flashcard offline -> `[23]` | **In-Place:** Không thay đổi URL, phục hồi ngay khi có mạng. | Phát file đã cache |
| **10** | `10 - Library - Lecture Archive` | `/library` | Tab Root 2 (Kho bài giảng) | Bấm Tab 2 trên Floating Island Tab Bar | Chọn bài giảng -> `[16]`, Bấm nút thêm -> `[13]` | **Tab Root:** Back -> chuyển về Tab chủ `[08] Home`. | Tiếp tục phát mini |
| **11** | `11 - Library - Empty State` | `/library` (kho rỗng) | State Layer | Khi tài khoản chưa có bài giảng nào | Bấm CTA "Ghi âm bài giảng đầu tiên" -> `[13]` | **Tab Root:** Back -> chuyển về Tab chủ `[08] Home`. | Tắt |
| **12** | `12 - Library - Offline State` | `/library` (chế độ offline) | State Layer | Mất mạng khi đang xem danh sách bài giảng | Lọc các bài giảng đã tải cục bộ, bấm nghe -> `[16]` | **Tab Root:** Back -> chuyển về Tab chủ `[08] Home`. | Phát offline |
| **13** | `13 - Audio - Add Bottom Sheet` | `modal:add-audio` (`?sheet=add-audio`) | Action Bottom Sheet | Bấm nút "+" nổi tại Home `[08]` hoặc Library `[10]` | Chọn "Ghi âm trực tiếp" -> `[14]`, "Tải file lên" -> `[15]` | **Layered Pop:** Bấm backdrop/kéo xuống -> đóng sheet về màn cũ. | Không ngắt |
| **14** | `14 - Audio - Live Recording` | `/audio/record` | Guarded Fullscreen | Từ `[13]` Add Audio Bottom Sheet | Dừng & phân tích -> `[15]`, Bấm Hủy -> Hiện hộp thoại | **Guarded Rollback:** Chặn Back! Chỉ rollback khi xác nhận Hủy. | Tạm dừng audio khác |
| **15** | `15 - Audio - Processing Pipeline` | `/audio/processing/:jobId` | Transient Pipeline | Từ `[14]` Record hoặc upload file từ `[13]` | Hoàn thành STT -> `[16]`, Chạy ngầm -> `[10]` | **Terminal Replace:** Back -> về `[10]` Library (xử lý ngầm). | Tắt |
| **16** | `16 - Audio Detail - Transcript` | `/lectures/:id/transcript` | Workspace Hub | Từ Library `[10]`, Home `[08]`, Search `[22]` | Đổi tab -> `[17]`, `[18]`, Nhảy mốc giờ `[MM:SS]` | **Parent Fallback:** Back -> về đúng màn hình đã bấm vào (hoặc `/library`). | Đồng bộ karaoke |
| **17** | `17 - Audio Detail - Key Highlights` | `/lectures/:id/highlights` | Workspace Sub-tab | Chuyển tab từ `[16]` hoặc `[18]` | Đọc ý chính, bấm trích đoạn -> nhảy audio player | **Parent Fallback:** Back -> về `[10]` Library. | Đồng bộ highlight |
| **18** | `18 - Audio Detail - Cornell Overview` | `/lectures/:id/cornell` | Workspace Sub-tab | Chuyển tab từ `[16]` hoặc `[17]` | Xem tóm tắt, chọn chương -> `[19]`, Tạo Flashcard -> `[23]` | **Parent Fallback:** Back -> về `[10]` Library. | Tiếp tục phát |
| **19** | `19 - Audio Detail - Chapter View` | `/lectures/:id/chapters/:chId` | Drilldown Detail | Bấm vào một chương cụ thể từ `[18]` Cornell | Xem chi tiết nội dung chương bài giảng | **Hierarchical Pop:** Back -> về thẳng `[18]` Cornell Overview. | Tiếp tục phát |
| **20** | `20 - Subjects - Course Archive` | `/subjects` | Tab Root 3 (Môn học) | Bấm Tab 3 trên Floating Island Tab Bar | Chọn môn học -> `[21]`, Thêm môn mới | **Tab Root:** Back -> chuyển về Tab chủ `[08] Home`. | Tiếp tục phát mini |
| **21** | `21 - Subjects - Course Detail` | `/subjects/:courseId` | Detail Stack | Từ `[20]` Subjects Archive | Xem bài giảng môn -> `[16]`, Ôn flashcard môn -> `[23]` | **Deterministic Pop:** Back -> về thẳng `[20]` Subjects Archive. | Tiếp tục phát mini |
| **22** | `22 - Search - Neural RAG & Snippets` | `/search` | Global Search Overlay | Chạm vào ô tìm kiếm tại `[08]` Home hoặc phím tắt `/` | Nhập câu hỏi RAG, bấm vào snippet `[MM:SS]` -> `[16]` | **Overlay Pop:** Bấm X hoặc Back -> về màn hình trước đó. | Tạm dừng khi phát snippet |
| **23** | `23 - Review - Study Hub` | `/review` | Tab Root 4 (Ôn tập) | Bấm Tab 4 trên Floating Island Tab Bar | Bấm "Ôn tập ngay" -> `[24]`, Xem bộ thẻ môn | **Tab Root:** Back -> chuyển về Tab chủ `[08] Home`. | Tiếp tục phát mini |
| **24** | `24 - Flashcard - Question (Front)` | `/review/session/:deckId?face=front` | Guarded Study Session | Từ `[23]` Review Study Hub | Chạm lật thẻ -> `[25]`, Thoát phiên ôn tập | **Guarded Rollback:** Chặn Back! Lưu tiến độ đã ôn rồi về `[23]`. | Tắt để tập trung |
| **25** | `25 - Flashcard - Answer (Back)` | `/review/session/:deckId?face=back` | In-Card Flip State | Chạm vào thẻ từ `[24]` | Bấm độ khó (Lặp lại/Khó/Tốt/Dễ) -> chuyển thẻ tiếp | **In-Session State:** Không đẩy URL mới, lật ngược lại mặt trước. | Tắt |
| **26** | `26 - Review - Session Complete` | `/review/complete/:deckId` | Celebration Transient | Hoàn thành thẻ cuối cùng từ `[25]` | Bấm "Về Bàn học" -> `[08]`, "Xem kho thẻ" -> `[23]` | **Terminal Replace:** Back -> về thẳng `[23]`, không lặp lại thẻ. | Bật tiếng chúc mừng |
| **27** | `27 - Profile - Student Stats` | `/profile` | Tab Root 5 (Hồ sơ) | Bấm Tab 5 trên Floating Island Tab Bar | Xem chỉ số, mở Cài đặt -> `[28]`, Đăng xuất -> `[05]` | **Tab Root:** Back -> chuyển về Tab chủ `[08] Home`. | Tiếp tục phát mini |
| **28** | `28 - Settings - App Preferences` | `/settings` | Detail Stack | Bấm icon Cài đặt từ `[27]` Profile hoặc `[08]` Home | Cấu hình Local AI, dọn bộ nhớ cache, đổi giao diện | **Deterministic Pop:** Back -> về thẳng `[27]` Profile. | Tiếp tục phát |

---

## 5. 🧱 Kiến Trúc Module Sâu (Matt Pocock Deep Module Design)

Để đảm bảo code clean, dễ bảo trì và kiểm thử tự động, toàn bộ hệ thống điều hướng được đóng gói thành một **Deep Module** với Interface tối giản nhưng Implementation cực sâu:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      INTERFACE: AppNavigator                           │
│  goTo(route, opts) | goBack() | openSheet(name) | registerGuard(fn)     │
├────────────────────────────────────────────────────────────────────────┤
│                     DEEP IMPLEMENTATION:                               │
│  - History Stack Tracking & Depth Resolver                            │
│  - Parent Route Fallback Resolver (Chống kẹt khi vào Deep-Link)         │
│  - Layered Sheet Stack Coordinator (Pop modal trước khi pop trang)     │
│  - Dirty Guard Interceptor (Xác nhận Mochi Dialog chống mất ghi âm)    │
│  - Capsule Audio Player Session Anchor (Giữ nhạc không ngắt quãng)     │
│  - Browser Popstate Sanitizer & Android Back Button Bridge             │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.1. Định Nghĩa Interface TypeScript Chuẩn (`mobile/src/navigation/types.ts`)

```typescript
export type TabRoute = '/(tabs)/home' | '/(tabs)/library' | '/(tabs)/subjects' | '/(tabs)/review' | '/(tabs)/profile'

export type AppRoute =
  | '/'
  | '/(onboarding)/step-1'
  | '/(onboarding)/step-2'
  | '/(onboarding)/step-3'
  | '/(auth)/sign-in'
  | '/(auth)/create-account'
  | TabRoute
  | '/home'
  | '/library'
  | '/subjects'
  | '/review'
  | '/profile'
  | '/(guarded)/audio/record'
  | `/audio/processing/${string}`
  | `/lectures/${string}/transcript`
  | `/lectures/${string}/highlights`
  | `/lectures/${string}/cornell`
  | `/lectures/${string}/chapters/${string}`
  | `/subjects/${string}`
  | '/(modal)/search'
  | '/search'
  | `/(guarded)/review/session/${string}`
  | `/(guarded)/review/complete/${string}`
  | '/settings'

export type ModalSheetType = 'paywall' | 'add-audio' | 'search' | null

export interface NavigateOptions {
  /** Ghi đè lịch sử thay vì push (dùng cho các màn hình chuyển tiếp terminal) */
  replace?: boolean
  /** Đường dẫn cần chuyển tiếp sau khi đăng nhập thành công */
  returnTo?: string
  /** State tùy chọn gửi kèm navigation */
  params?: Record<string, string | number>
}

/** Hàm kiểm tra bảo vệ điều hướng (Route Guard). Trả về false để chặn điều hướng */
export type NavigationGuardFn = () => Promise<boolean> | boolean

export interface GuardConfig {
  id: string
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirmExit?: () => void
  guard: NavigationGuardFn
}

/**
 * Interface Seam của AppNavigator (Matt Pocock Deep Module)
 * Giao diện tối giản - ẩn toàn bộ độ phức tạp bên trong Implementation
 */
export interface AppNavigator {
  /** Đường dẫn hiện tại */
  readonly currentRoute: string
  /** Tab gốc hiện tại (nếu đang ở một trong 5 tab chính) */
  readonly activeTab: TabRoute | null
  /** Modal sheet đang mở trên cùng (nếu có) */
  readonly activeSheet: ModalSheetType
  /** Có thể quay lại an toàn trong lịch sử không */
  readonly canGoBack: boolean

  /** Điều hướng tới route mới */
  goTo(route: AppRoute | string, options?: NavigateOptions): void

  /**
   * Quay lui an toàn (Zero-Dead-End Rollback Guarantee).
   * 1. Ưu tiên đóng Modal Sheet nếu đang mở
   * 2. Kiểm tra Route Guard nếu có dữ liệu chưa lưu
   * 3. Pop history nếu có lịch sử
   * 4. Fallback về Parent Route nếu vào bằng Deep-link
   */
  goBack(): void

  /** Mở modal / action sheet */
  openSheet(sheet: ModalSheetType, params?: Record<string, unknown>): void

  /** Đóng modal sheet trên cùng */
  closeSheet(): void

  /**
   * Đăng ký bộ bảo vệ chống mất dữ liệu khi đang ở màn hình nhạy cảm (Ghi âm, Làm thẻ).
   * Trả về hàm unregister để dọn dẹp khi unmount.
   */
  registerGuard(config: GuardConfig): () => void
}
```

---

## 6. 📱 Trải Nghiệm Điều Khiển Kitsune Soft Đặc Thù

### 6.1. Capsule Audio Player: Neo Giữ Âm Thanh Toàn Cục
- Vị trí: Đặt cố định ở cấp Layout cao nhất (`mobile/src/app/(tabs)/_layout.tsx` và `mobile/src/app/_layout.tsx`), nổi ngay trên thanh `Floating Island Tab Bar`.
- Hành vi khi chuyển trang:
  - Khi xem bài giảng tại `[16] Transcript`: Player mở rộng tích hợp thanh tua sóng âm và nhảy timestamp đồng bộ.
  - Khi người dùng bấm về `[08] Home` hoặc chuyển sang `[20] Subjects`: Player tự động thu nhỏ thành con nhộng **Capsule Pill** (`height: 52px`), tiếp tục phát bài giảng ngầm qua `expo-audio`.
  - Khi vào màn hình `[14] Audio - Live Recording`: Player tự động tạm dừng (Pause) để giải phóng micro và tránh lẫn tạp âm vào bài giảng mới.

### 6.2. Floating Island Tab Bar: Thanh Điều Hướng 5 Đảo Lơ Lửng
- Vị trí: Ghim đáy màn hình, lơ lửng cách đáy `16px`, bo tròn viên thuốc tuyệt đối (`rounded-full`), bề mặt kính sữa **Miruku Glass** (`rgba(255,255,255,0.88)` + `BlurView` của `expo-blur`).
- Tự động ẩn:
  - Ẩn hoàn toàn khi ở các màn hình tập trung cao: `[01-04]` Onboarding, `[05-06]` Auth, `[14]` Live Recording, `[24-25]` Flashcard Session.
  - Hiện diện và trượt êm ái khi ở 5 Tab chính và các màn hình duyệt bài giảng.

---

## 7. 🚀 Hướng Dẫn Dành Cho AI & Kỹ Sư Khi Triển Khai Màn Hình (Engineering Blueprint)

Khi một AI Agent hoặc lập trình viên triển khai thêm màn hình hoặc component mới, hãy thực hiện theo thứ tự 4 bước sau:

1. **Bước 1: Sử dụng Seam điều hướng chuẩn hóa**
   - Sử dụng `useAppNavigation()` từ `mobile/src/navigation/NavigationContext.tsx`.
   - Luôn định nghĩa `ROUTE_PARENT_FALLBACK` trong `parentFallback.ts` cho mọi route con mới để bảo đảm không bao giờ cụt đường.
2. **Bước 2: Đối chiếu asset đồ họa**
   - Đọc đối chiếu tên màn hình và layout trong [`docs/design-assets/screens/png/`](./design-assets/screens/png/) tương ứng với số thứ tự `[01]` đến `[28]`.
3. **Bước 3: Gắn Route Guard ở các màn hình nhạy cảm**
   - Tại component màn hình đang ghi âm hoặc đang làm bài, bắt buộc gọi `navigator.registerGuard(...)` trong `useEffect` để kích hoạt hộp thoại `MochiConfirmDialog` khi người dùng bấm Back bất ngờ.
4. **Bước 4: Kiểm tra khả năng Rollback 100%**
   - Kiểm tra mọi nút Back trong giao diện: Tuyệt đối không gọi lệnh chuyển trang thô ráp; toàn bộ phải gọi qua `navigator.goBack()`. Chạy bài test `parentFallback.test.ts` để xác minh.
