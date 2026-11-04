# Danh Mục & Ánh Xạ Màn Hình Thiết Kế (Screen Catalog & Mapping)
## LectureLens App Design System

* **Dự án Stitch**: `LectureLens App Design System`
* **Mã Project ID**: `4698105823854324833`
* **Phong cách Thiết kế**: **Pastel Stationery Study Companion**
* **Tổng số màn hình hoạt động**: **45 màn hình mobile** (+ 1 asset token + 1 thư viện biểu tượng icon)
* **Tệp mã nguồn định danh**: `src/core/constants/stitchScreenMap.ts`

---

## 🧭 Cấu Trúc Bố Cục Canvas Trên Stitch (Canvas Layout Matrix)

Các màn hình được sắp xếp theo dạng lưới 2D trực quan trên Canvas của Google Stitch:
* **Khu vực Trục Trái (`X: 0 – 3,500px`)**: Gồm 7 luồng UX chức năng chính (Flows 1 – 7) xếp theo từng hàng ngang riêng biệt, có khoảng cách thở đồng nhất (`COL_STEP = 500px`).
* **Khu vực Trục Phải (`X: 4,300 – 4,800px`)**: Khu vực tài liệu tổng quan, Design System Tokens và Bảng biểu tượng chuẩn hóa (Icon Library).
* **Khu vực Dự phòng (`X: 12,000px`)**: Các màn hình Web/Desktop cũ đã được ẩn (`hidden: true`) để không gây xao nhãng không gian thiết kế Mobile.

---

## 📱 Chi Tiết 8 Cụm Luồng Chức Năng (UX Flows)

### Flow 1: Khởi Động & Nhập Môn (Splash & Onboarding)
> **Tọa độ trục Y**: `0px` | **Mô tả**: Toàn bộ chu kỳ khởi động ứng dụng, tải dữ liệu AI và hướng dẫn người dùng mới.

| STT | Tên Màn Hình | Tọa độ (X, Y) | Stitch Screen ID | Component Mã Nguồn (`FE/src/`) | Route Điều Hướng | Trạng thái |
|:---|:---|:---|:---|:---|:---|:---|
| 01 | **Splash - Đang tải** | `X: 0, Y: 0` | `7f5eab66a8e847a4873aa7ca59514fa3` | `features/splash/SplashScreen.tsx` | `Splash` | ✅ Hoàn thành |
| 02 | **Splash - AI khởi động** | `X: 500, Y: 0` | `e0751cd5967842d08e87cb80cb4959ca` | `features/splash/SplashScreen.tsx` | `Splash` | ✅ Hoàn thành |
| 03 | **Splash & Loading (Mobile)** | `X: 1000, Y: 0` | `647587edb504420b80d33dc085dd40a6` | `features/splash/SplashScreen.tsx` | `Splash` | ✅ Hoàn thành |
| 04 | **Splash - Mạng chậm** | `X: 1500, Y: 0` | `bd028f822b7041e186fed9ebdf2fe25a` | `features/splash/SplashScreen.tsx` | `Splash` | ✅ Hoàn thành |
| 05 | **Splash - Lỗi kết nối** | `X: 2000, Y: 0` | `360d5eba2edb42b58e6083aaba0bfa1a` | `features/splash/SplashScreen.tsx` | `Splash` | ✅ Hoàn thành |
| 06 | **Onboarding (3 slides)** | `X: 2500, Y: 0` | `7620fcc2e8bd40fba1c9f24b38140068` | `features/onboarding/OnboardingScreen.tsx` | `Onboarding` | ✅ Hoàn thành |

---

### Flow 2: Xác Thực & Tài Khoản (Authentication & Password)
> **Tọa độ trục Y**: `1,100px` | **Mô tả**: Đăng nhập, đăng ký, xác thực form lỗi và quy trình khôi phục mật khẩu.

| STT | Tên Màn Hình | Tọa độ (X, Y) | Stitch Screen ID | Component Mã Nguồn (`FE/src/`) | Route Điều Hướng | Trạng thái |
|:---|:---|:---|:---|:---|:---|:---|
| 07 | **Đăng nhập** | `X: 0, Y: 1100` | `6d82ce4604634707993eb82c95f59f26` | `features/auth/AuthScreens.tsx` | `Login` | ✅ Hoàn thành |
| 08 | **Đăng nhập - Email không hợp lệ** | `X: 500, Y: 1100` | `0013c18feca045d8a0bd728ebc9e097e` | `features/auth/AuthScreens.tsx` | `Login` | ✅ Hoàn thành |
| 09 | **Đăng nhập - Sai mật khẩu** | `X: 1000, Y: 1100` | `f55ce14b3d4c4975bf27152559f3b332` | `features/auth/AuthScreens.tsx` | `Login` | ✅ Hoàn thành |
| 10 | **Đăng ký** | `X: 1500, Y: 1100` | `1c7d34b9e8ed42a59b622624f5c16ef9` | `features/auth/AuthScreens.tsx` | `Register` | ✅ Hoàn thành |
| 11 | **Đăng ký - Lỗi xác thực & mật khẩu** | `X: 2000, Y: 1100` | `b44a7ecea3d34689905615aa53950042` | `features/auth/AuthScreens.tsx` | `Register` | ✅ Hoàn thành |
| 12 | **Quên mật khẩu** | `X: 2500, Y: 1100` | `cf66e065fd2e48a1bf297101dbf83814` | `features/auth/AuthScreens.tsx` | Sub-modal/State | ✅ Hoàn thành |
| 13 | **Kiểm tra email** | `X: 3000, Y: 1100` | `c52c473fdd33468aa247fcd0d7ea1105` | `features/auth/AuthScreens.tsx` | Sub-modal/State | ✅ Hoàn thành |
| 14 | **Đặt mật khẩu mới** | `X: 3500, Y: 1100` | `584777f361f24597a91ff343fa6d3c2a` | `features/auth/AuthScreens.tsx` | Sub-modal/State | ✅ Hoàn thành |

---

### Flow 3: Ghi Âm, Tải Lên & Xử Lý (Recording, Upload & Processing)
> **Tọa độ trục Y**: `2,350px` | **Mô tả**: Quyền micro, sóng âm ghi trực tiếp, tải file và trạng thái AI xử lý bài giảng.

| STT | Tên Màn Hình | Tọa độ (X, Y) | Stitch Screen ID | Component Mã Nguồn (`FE/src/`) | Route Điều Hướng | Trạng thái |
|:---|:---|:---|:---|:---|:---|:---|
| 15 | **Cho phép micro** | `X: 0, Y: 2350` | `cc4b223765c042ee8c2568d8daaae6e0` | `features/upload/UploadScreen.tsx` | `Upload` | ✅ Hoàn thành |
| 16 | **Đang ghi âm** | `X: 500, Y: 2350` | `ebb3464a1192468db3be01e8c6ec7d92` | `features/upload/UploadScreen.tsx` | `Upload` | ✅ Hoàn thành |
| 17 | **Lưu bản ghi** | `X: 1000, Y: 2350` | `4f498de92fae486aba86e412a7527976` | `features/upload/UploadScreen.tsx` | `Upload` | ✅ Hoàn thành |
| 18 | **Tải bản ghi lên & Xử lý** | `X: 1500, Y: 2350` | `1092b941d25f41af8ceb491db1a3388c` | `features/upload/UploadScreen.tsx` | `Upload` | ✅ Hoàn thành |
| 19 | **Đang xử lý bài giảng** | `X: 2000, Y: 2350` | `6730715a35c84953913dff6d555a09bd` | `features/processing/ProcessingScreen.tsx` | `Processing` | ✅ Hoàn thành |
| 20 | **Xử lý bài giảng - Thất bại** | `X: 2500, Y: 2350` | `0d1a22e1ce5c445abe864f183262bc9c` | `features/processing/ProcessingScreen.tsx` | `Processing` | ✅ Hoàn thành |

---

### Flow 4: Thư Viện & Chi Tiết Bài Giảng (Library & Lecture Details)
> **Tọa độ trục Y**: `3,900px` | **Mô tả**: Thư viện bài giảng, skeleton loading, bản ghi chép đồng bộ audio và tổng quan ôn tập.

| STT | Tên Màn Hình | Tọa độ (X, Y) | Stitch Screen ID | Component Mã Nguồn (`FE/src/`) | Route Điều Hướng | Trạng thái |
|:---|:---|:---|:---|:---|:---|:---|
| 21 | **Thư viện - Bài giảng** | `X: 0, Y: 3900` | `4acb0ef6e8b4457eb250086ded0c9189` | `features/library/LibraryScreen.tsx` | `Library` | ✅ Hoàn thành |
| 22 | **Thư viện (Trạng thái trống)** | `X: 500, Y: 3900` | `cc8ef54c07ef4b3b8476fb47d64797fa` | `features/library/LibraryScreen.tsx` | `Library` | ✅ Hoàn thành |
| 23 | **Thư viện (Đang tải - Skeleton)** | `X: 1000, Y: 3900` | `e76dfcbb6737405cbeb58dd94a2d2bc4` | `features/library/LibraryScreen.tsx` | `Library` | ✅ Hoàn thành |
| 24 | **Chi tiết bài giảng (Bản ghi)** | `X: 1500, Y: 3900` | `3810bb0cc1b342fbbf4bf25436051625` | `features/lecture_detail/LectureDetailScreen.tsx` | `LectureDetail` | ✅ Hoàn thành |
| 25 | **Chi tiết bài giảng (Đang tải - Skeleton)** | `X: 2000, Y: 3900` | `173c7c7d9ba347848b813a0e4d848c3a` | `features/lecture_detail/LectureDetailScreen.tsx` | `LectureDetail` | ✅ Hoàn thành |
| 26 | **Ôn tập - Tổng quan bài giảng** | `X: 2500, Y: 3900` | `12884c2f87fb4d408527bc2056ebd923` | `features/lecture_detail/LectureDetailScreen.tsx` | Tab Overview | ✅ Hoàn thành |

---

### Flow 5: Trợ Lý Cú Mèo AI & Ôn Tập (AI Companion & Flashcards)
> **Tọa độ trục Y**: `5,750px` | **Mô tả**: Khung hỏi đáp thông minh có trích dẫn mốc thời gian, thẻ ghi nhớ lật mặt và báo cáo kết quả ôn tập.

| STT | Tên Màn Hình | Tọa độ (X, Y) | Stitch Screen ID | Component Mã Nguồn (`FE/src/`) | Route Điều Hướng | Trạng thái |
|:---|:---|:---|:---|:---|:---|:---|
| 27 | **Hỏi đáp AI & Trích dẫn** | `X: 0, Y: 5750` | `727e543eeff043fd9811ebfe6f978399` | `features/lecture_detail/LectureDetailScreen.tsx` | Tab Q&A | ✅ Hoàn thành |
| 28 | **Hỏi đáp AI (Đang tải - Skeleton)** | `X: 500, Y: 5750` | `6355003eafdc481d8f68a00c6e1d3cb4` | `features/lecture_detail/LectureDetailScreen.tsx` | Tab Q&A | ✅ Hoàn thành |
| 29 | **Ôn tập - Thẻ ghi nhớ (Flashcards)** | `X: 1000, Y: 5750` | `c841502b59d84c95afa4482c2b05b40d` | `features/lecture_detail/LectureDetailScreen.tsx` | Tab Review | ✅ Hoàn thành |
| 30 | **Ôn tập - Kết quả ôn tập** | `X: 1500, Y: 5750` | `a0406835359942d7889664a7d5b3aae0` | `features/lecture_detail/LectureDetailScreen.tsx` | Modal Result | ✅ Hoàn thành |

---

### Flow 6: Tìm Kiếm, Thông Báo & Cài Đặt (Search, Notifications & Settings)
> **Tọa độ trục Y**: `7,400px` | **Mô tả**: Tìm kiếm toàn cục bài giảng, trung tâm thông báo, hồ sơ cá nhân và cài đặt ứng dụng.

| STT | Tên Màn Hình | Tọa độ (X, Y) | Stitch Screen ID | Component Mã Nguồn (`FE/src/`) | Route Điều Hướng | Trạng thái |
|:---|:---|:---|:---|:---|:---|:---|
| 31 | **Tìm kiếm toàn cục** | `X: 0, Y: 7400` | `70001baf4eb446bb88317086526d05f4` | `features/search/SearchScreen.tsx` | `Search` | ✅ Hoàn thành |
| 32 | **Tìm kiếm (Đang tải - Skeleton)** | `X: 500, Y: 7400` | `ce9dfae2e29c472e90fa199763e8eebe` | `features/search/SearchScreen.tsx` | `Search` | ✅ Hoàn thành |
| 33 | **Tìm kiếm - Có bài giảng đang xử lý** | `X: 1000, Y: 7400` | `ccd2a82db0af428f98cc1da9bd47aae7` | `features/search/SearchScreen.tsx` | `Search` | ✅ Hoàn thành |
| 34 | **Tìm kiếm - Không tìm thấy kết quả** | `X: 1500, Y: 7400` | `d1bd9554244841fbac27024c4ea7ca25` | `features/search/SearchScreen.tsx` | `Search` | ✅ Hoàn thành |
| 35 | **Thông báo** | `X: 2000, Y: 7400` | `d6ff6a83eaf34dc3b9b39dfa48f188c4` | `features/notifications/NotificationsScreen.tsx` | `Notifications` | ✅ Hoàn thành |
| 36 | **Hồ sơ sinh viên (User Profile)** | `X: 2500, Y: 7400` | `462e49b198b34a33a3114651701db789` | `features/settings/SettingsScreen.tsx` | Sub-section | ✅ Hoàn thành |
| 37 | **Cài đặt** | `X: 3000, Y: 7400` | `2b72515c1bd9447583c3cca01ba0c372` | `features/settings/SettingsScreen.tsx` | `Settings` | ✅ Hoàn thành |

---

### Flow 7: Xử Lý Lỗi & Ngoại Tuyến (Error States & Offline Handling)
> **Tọa độ trục Y**: `9,100px` | **Mô tả**: Kiểm soát toàn bộ các tình huống lỗi upload, kích thước quá tải, mất mạng ngoại tuyến và thông báo kết nối lại.

| STT | Tên Màn Hình | Tọa độ (X, Y) | Stitch Screen ID | Component Mã Nguồn (`FE/src/`) | Phân loại trạng thái | Trạng thái |
|:---|:---|:---|:---|:---|:---|:---|
| 38 | **Tải lên - Sai định dạng file (.pdf)** | `X: 0, Y: 9100` | `392d71ee429b44be9ecd981bbfb25787` | `features/upload/UploadScreen.tsx` | Form Error Alert | ✅ Hoàn thành |
| 39 | **Tải lên - File quá lớn (812MB)** | `X: 500, Y: 9100` | `07be991f808b4ac386a37b64b3b5f69a` | `features/upload/UploadScreen.tsx` | Size Limit Alert | ✅ Hoàn thành |
| 40 | **Tải lên - Tải lên bị gián đoạn (38%)** | `X: 1000, Y: 9100` | `850f74cd89154d019b97b6224bee7c2b` | `features/upload/UploadScreen.tsx` | Network Pause Alert | ✅ Hoàn thành |
| 41 | **Thư viện - Đang ngoại tuyến** | `X: 1500, Y: 9100` | `e22a738c4d8d47969aed4133b4035754` | `features/library/LibraryScreen.tsx` | Offline Banner/State | ✅ Hoàn thành |
| 42 | **Hỏi đáp AI - Đang ngoại tuyến** | `X: 2000, Y: 9100` | `d0928c14e68642889974fd5ff750401e` | `features/lecture_detail/LectureDetailScreen.tsx` | Offline Card/State | ✅ Hoàn thành |
| 43 | **Đã có mạng trở lại** | `X: 2500, Y: 9100` | `06d9fd96d33e402b851d558c5bb8bcfc` | `shared/widgets/navigation/LlAppBar.tsx` | Online Toast Pill | ✅ Hoàn thành |

---

### Flow 8: Tài Nguyên Thiết Kế & Biểu Tượng (Design System & Overview)
> **Tọa độ trục Y**: `0px – 1,100px` | **Trục X**: `4,300px – 4,800px` | **Mô tả**: Bảng tài nguyên cốt lõi, bảng màu, typography, thẻ washi tape và thư viện icon.

| STT | Tên Tài Nguyên | Tọa độ (X, Y) | Stitch Screen ID | Component Mã Nguồn (`FE/src/`) |
|:---|:---|:---|:---|:---|
| 44 | **LectureLens - Sổ Tay Học Tập Thông Minh** | `X: 4300, Y: 0` | `4551320da2234eb99d34b18600c07ceb` | `core/theme/` (Design Spec) |
| 45 | **Design System Token Asset** | `X: 4800, Y: 0` | `assets_8f3bd61bf6624d7088530c0761048f8b` | `core/theme/colors.ts`, `typography.ts` |
| 46 | **Thư viện Icon & Biểu tượng Chuẩn hóa** | `X: 4300, Y: 1100` | `988b02cb585d4780beb89edc0289cad2` | `shared/widgets/icons/LlIcon.tsx` |

---

## 🎨 Tóm Tắt Design System Tokens (Pastel Stationery Study Companion)

* **Bảng màu chủ đạo**:
  * `primary`: `#5445B6` / `primaryContainer`: `#6D5FD0` (Lavender Wisteria)
  * `secondary`: `#795462` / `secondaryContainer`: `#FECDDD` (Washi Pink)
  * `tertiary`: `#405C54` / `tertiaryContainer`: `#58756C` (Mint Sage)
  * `surface`: `#FDF7FF` / `canvasBackground`: `#FFFAF5` (Warm Cream Paper)
  * `cardSurface`: `#FFFFFF` (Bóng đổ lavender nhẹ, viền bo tròn 24px)
* **Kiểu chữ**:
  * Tiêu đề: `Quicksand` (Bold, SemiBold)
  * Nội dung & Nhãn: `Nunito Sans` (Regular, Bold)
* **Thành phần nhận diện độc quyền**:
  * `WashiTapeAccent`: Băng dính washi pastel dán đè mép trên thẻ (`#F8C8D8`).
  * `StickyNoteCard`: Thẻ ghi chú màu bơ `#FFF1C9` xoay góc tự nhiên `±1°`.
  * `AudioPlayerCapsule`: Thanh nghe bài giảng lơ lửng, hiệu ứng kính mờ (blur 16px).
  * `CuMeoWidget`: Mascot chú cú trắng đeo tai nghe pastel xoa dịu áp lực học tập.
