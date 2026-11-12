# 📱 LectureLens Mobile — Expo SDK 58 / React Native

Ứng dụng khách chính thức của **LectureLens**: ứng dụng di động native 100% xây dựng trên **Expo SDK 58** (React Native 0.88.1, React 19.3, New Architecture), áp dụng hệ thống thiết kế **Kitsune Soft** và chiều rộng tham chiếu **390px**.

> [!IMPORTANT]
> Đây là ứng dụng **di động**, không phải web desktop. Mọi màn hình phải tối ưu cho **Thumb Zone** (vùng chạm ≥ 44–52px), tôn trọng Safe Area (`react-native-safe-area-context`) và đối chiếu với 28 màn hình mẫu tại [`docs/design-assets/screens/`](../docs/design-assets/screens/). Xem [AGENTS.md](../AGENTS.md) và [ADR 0003](../docs/adr/0003-native-mobile-architecture-expo-sdk58.md).

---

## 1. Khởi Chạy Nhanh

Chạy từ **thư mục gốc** repository (scripts uỷ quyền vào `mobile/` qua `npm --prefix mobile`):

```bash
npm install --prefix mobile   # Cài phụ thuộc lần đầu

npm run start        # Expo Dev Server (tương đương: npm run dev)
npm run android      # Mở trên Android emulator / thiết bị
npm run ios          # Mở trên iOS simulator
npm run web          # Xem trước qua react-native-web (chỉ để kiểm tra nhanh)

npm test             # Node Native Test Runner: src/**/__tests__/*.test.ts
npm run typecheck    # tsc --noEmit (strict)
npm run lint         # expo lint
```

> [!NOTE]
> `npm run lint` lần đầu sẽ tự cài `eslint` + `eslint-config-expo` vì repo chưa có cấu hình ESLint.

### Kết nối Gateway

`ApiClient` tự chọn Base URL theo nền tảng (`resolveDefaultBaseUrl`):

| Môi trường | Base URL mặc định |
| :--- | :--- |
| `EXPO_PUBLIC_GATEWAY_URL` (nếu đặt) | Giá trị biến môi trường |
| Android Emulator | `http://10.0.2.2:8080/api/v1` |
| iOS Simulator / Web | `http://localhost:8080/api/v1` |

### EAS Build (`eas.json`)

| Profile | Mục đích |
| :--- | :--- |
| `development` | Dev client, APK nội bộ, iOS simulator, `EXPO_PUBLIC_GATEWAY_URL=http://10.0.2.2:8080/api/v1` |
| `preview` | APK phân phối nội bộ |
| `production` | Android App Bundle, tự tăng build number |

Cấu hình native trong `app.json`: bundle id `vn.lecturelens.app`, scheme `lecturelens`, portrait, `newArchEnabled`, `typedRoutes` + `reactCompiler`, quyền microphone và phát âm thanh nền (`UIBackgroundModes: audio`, `FOREGROUND_SERVICE_MICROPHONE`).

---

## 2. Cấu Trúc Thư Mục

```
mobile/
├── app.json / eas.json / tsconfig.json
├── assets/                      # Icon ứng dụng, splash, ảnh
└── src/
    ├── app/                     # Expo Router (file-based routes) — 28 màn hình
    ├── components/
    │   ├── canvas/              # Skia 2D: KitsuneMascotCanvas, FloatingPetals2D
    │   ├── navigation/          # FloatingIslandTabBar, RouteSlot
    │   └── ui/
    │       ├── button/          # Button (pill)
    │       ├── chip/            # Chip, TimestampChip [MM:SS]
    │       ├── icons/           # 74 Native Icons + SoftBlob — xem icons/README.md
    │       └── input/           # FormInputPill, KawaiiCheckbox
    ├── modules/
    │   ├── audio/               # AudioProvider, useAudioPlayer, CapsuleAudioPlayer
    │   ├── auth/                # domain/ (validation, passwordEntropy) + infrastructure/ (AuthSeam)
    │   └── storage/             # KeyValueStorage seam + adapters
    ├── navigation/              # NavigationProvider, useAppNavigation, parentFallback, MochiConfirmDialog
    ├── services/                # ApiClient, AudioPipelineService, NetworkMonitor, types
    └── theme/                   # tokens.ts (KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS)
```

---

## 3. Bản Đồ Route (Expo Router v58)

| Nhóm route | Tệp | Màn hình mẫu |
| :--- | :--- | :--- |
| Khởi động | `app/index.tsx` | `[01]` Splash |
| `(onboarding)` | `step-1`, `step-2`, `step-3` | `[02]`–`[04]` |
| `(auth)` | `sign-in`, `create-account` | `[05]`, `[06]` |
| `(modal)` | `paywall`, `add-audio`, `search` | `[07]`, `[13]`, `[22]` |
| `(tabs)` | `home`, `library`, `subjects`, `review`, `profile` | `[08]`–`[12]`, `[20]`, `[23]`, `[27]` |
| `(guarded)` | `audio/record`, `audio/processing/[jobId]` | `[14]`, `[15]` |
| `(guarded)` | `review/session/[deckId]`, `review/complete/[deckId]` | `[24]`–`[26]` |
| `lectures/[id]` | `transcript`, `highlights`, `cornell`, `chapters/[chId]` | `[16]`–`[19]` |
| `subjects/[courseId]` | `subjects/[courseId].tsx` | `[21]` |
| Cài đặt | `settings.tsx` | `[28]` |

Các trạng thái Offline (`[09]`, `[12]`) và Empty (`[11]`) là lớp trạng thái của tab tương ứng, không phải route riêng. Đặc tả điều hướng đầy đủ: [docs/UX-NAVIGATION-FLOW.md](../docs/UX-NAVIGATION-FLOW.md).

Root layout (`app/_layout.tsx`) nạp phông **Plus Jakarta Sans**, bọc toàn bộ cây trong `NavigationProvider` → `AudioProvider`, và khai báo `Stack` với nền `washiCream`. `(tabs)/_layout.tsx` gắn `FloatingIslandTabBar` và `CapsuleAudioPlayer`, nên âm thanh tiếp tục phát khi chuyển tab.

---

## 4. Seams & Adapters (Deep Modules)

Theo kỹ năng [`codebase-design`](../.agents/skills/codebase-design/SKILL.md): interface nhỏ, implementation sâu, kiểm thử qua seam.

| Seam (Interface) | Adapters | Ghi chú |
| :--- | :--- | :--- |
| `KeyValueStorage` (`modules/storage`) | `AsyncStorageAdapter` (runtime, export `appStorage`), `MemoryStorageAdapter` (test) | 4 phương thức: `getItem`, `setItem`, `removeItem`, `clear` |
| `AuthSeam` (`modules/auth`) | `MockAuthAdapter`, `BackendAuthAdapter` | Chọn adapter qua `getAuthSeam()` / `setAuthSeam()` |
| `NetworkProvider` (`services/networkMonitor`) | `MockNetworkProvider` | `NetworkMonitor.setProvider()` để thay provider; hook `useNetworkStatus()` |
| `AppNavigator` (`navigation`) | `NavigationProvider` (trên Expo Router) | `goTo`, `goBack`, `openSheet`, `closeSheet`, `registerGuard` |

> [!WARNING]
> `NetworkMonitor` hiện mặc định dùng `MockNetworkProvider`. Gói `@react-native-community/netinfo` đã được cài nhưng **chưa có adapter NetInfo** gắn vào seam này.

Các module dịch vụ:
- **`ApiClient`**: chuẩn hoá Base URL, tự gắn `Authorization: Bearer <JWT>` đọc từ `KeyValueStorage` được inject (mặc định `MemoryStorageAdapter`, đổi bằng `setStorage()`), timeout 15s, ném `ApiError` chuẩn, hỗ trợ upload multipart audio.
- **`AudioPipelineService`**: `uploadLectureAudio`, `getJobManifest` (`/audio/{jobId}/manifest`), `getLectureTranscript`, `pollJobUntilComplete` (mặc định 60 lần × 2000ms, dừng khi `stt.status` là `COMPLETED` hoặc `FAILED`).

---

## 5. Thiết Kế & Đồ Hoạ

- **Tokens**: `src/theme/tokens.ts` là nguồn sự thật trong code cho [docs/design-system.md](../docs/design-system.md) — `KITSUNE_COLORS`, `KITSUNE_RADII` (`pill: 9999`, `squircleCard: 28`, `sheetTop: 32`), `KITSUNE_SHADOWS` (`miruku`, `plumModal`).
- **Icons**: chỉ dùng `<Icon name="..." />` từ `components/ui/icons` — [tra cứu 74 biểu tượng](./src/components/ui/icons/README.md). Không vẽ inline SVG, không thêm thư viện icon ngoài.
- **Skia 2D Canvas**: `@shopify/react-native-skia` dựng `KitsuneMascotCanvas` và `FloatingPetals2D` (thay cho Three.js của bản web cũ).
- **Mochi Tactile Press**: `react-native-reanimated` (scale 0.97 / 150ms) + `expo-haptics`.
- **Miruku Glass**: `BlurView` của `expo-blur` (dùng trong `FloatingIslandTabBar` và `CapsuleAudioPlayer`) trên nền `rgba(255,255,255,0.76)`. Gói `expo-glass-effect` đã được cài nhưng chưa dùng.

---

## 6. Kiểm Thử

`npm test` chạy **31 test / 6 suite** bằng Node Native Test Runner (không Jest), test qua interface của seam:

| Suite | Tệp |
| :--- | :--- |
| Icon Registry Integrity (74 icon ↔ 74 SVG nguồn) | `components/ui/icons/__tests__/icons.test.ts` |
| AuthSeam & MockAuthAdapter, Password Entropy, Validation | `modules/auth/__tests__/*.test.ts` |
| KeyValueStorage & MemoryStorageAdapter | `modules/storage/__tests__/storage.test.ts` |
| Hierarchy Fallback Matrix | `navigation/__tests__/parentFallback.test.ts` |
| ApiClient, AudioPipelineService, NetworkMonitor | `services/__tests__/apiClient.test.ts` |
| Kitsune Soft Tokens | `theme/__tests__/tokens.test.ts` |

> [!NOTE]
> Node in cảnh báo `MODULE_TYPELESS_PACKAGE_JSON` khi chạy test vì `package.json` không khai báo `"type": "module"`. Cảnh báo này vô hại.
