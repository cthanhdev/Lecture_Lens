# ADR 0003: Native Mobile Client on Expo SDK 58 (Web Client Archived)

## Status
Accepted

## Context
LectureLens is used where lectures happen: students record in a lecture hall, review on the move, and listen to long recordings with the screen off. The first client was a web study portal (React 19, Vite 8, Tailwind CSS v4, Three.js mascot). That client could not reliably record audio in the background, play audio with the screen locked, give haptic feedback, or respect device safe areas. Its WebGL 3D mascot was also too heavy for mid-range phones.

## Decision
1. **The official LectureLens client is a 100% native mobile app** in `mobile/`, built on Expo SDK 58 (React Native 0.88, React 19.3, New Architecture enabled), with a 390px reference width and one-handed **Thumb Zone** ergonomics.
2. **Navigation uses Expo Router v58 file-based routes** (`(onboarding)`, `(auth)`, `(tabs)`, `(modal)`, `(guarded)`, `lectures/[id]`, `subjects/[courseId]`). The routes sit behind the `AppNavigator` seam, which guarantees there are no dead ends: the parent fallback matrix handles deep links, and route guards protect recording and review sessions.
3. **2D graphics use Shopify Skia instead of Three.js / WebGL.** The Kitsune Fox Companion (`KitsuneMascotCanvas`) and falling petals (`FloatingPetals2D`) target 60–120 FPS.
4. **Device capabilities come from Expo modules:** `expo-audio` for background playback and recording, `expo-haptics` for Mochi Tactile Press, `expo-blur` for Miruku Glass, and `react-native-safe-area-context` for notches and home indicators.
5. **The old web client is archived** in `legacy/web-frontend/`. It is read-only history and must not receive new features.

The privacy constraint of ADR 0001 is unchanged. The mobile client only talks to the Spring Boot Gateway over HTTPS. It never reaches the database, the AI Service, or model weights directly.

## Consequences
- **Positive:** native background audio, microphone, haptics and safe areas; lighter rendering than WebGL; one codebase for iOS and Android, built and distributed through EAS profiles (`development`, `preview`, `production`).
- **Negative:** UI tests need a device or simulator. Web-only libraries (Tailwind, Three.js, lucide-react) cannot be reused, so icons are rebuilt in the native icon registry (`mobile/src/components/ui/icons/`).
- **Requirement:** the Gateway must be reachable from devices and emulators (Android emulator: `10.0.2.2`). Override the address with `EXPO_PUBLIC_GATEWAY_URL`.
