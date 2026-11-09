import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout.tsx'
import { AuthLayout } from '../layouts/AuthLayout.tsx'
import { FullscreenLayout } from '../layouts/FullscreenLayout.tsx'
import { RouteSlot } from './RouteSlot.tsx'
import { useEffect } from 'react'
import { useAppNavigation } from './useAppNavigation.ts'

/**
 * RouteSlot có kích hoạt Route Guard để kiểm tra tính năng chặn thoát khi đang ghi âm
 */
function GuardedRecordingSlot() {
  const nav = useAppNavigation()

  useEffect(() => {
    // Đăng ký guard ngăn chặn vô tình thoát khi đang ghi âm (Định luật 4)
    const unregister = nav.registerGuard({
      id: 'active-recording',
      title: 'Đang ghi âm bài giảng!',
      message: 'Nếu rời khỏi trang bây giờ, tiến trình ghi âm trực tiếp sẽ bị dừng và dữ liệu chưa phân tích sẽ bị hủy.',
      confirmText: 'Hủy bản ghi & Thoát',
      cancelText: 'Tiếp tục ghi âm',
      guard: () => false, // Luôn kích hoạt cảnh báo khi cố gắng thoát
    })
    return unregister
  }, [nav])

  return (
    <RouteSlot
      id="S14"
      number="14"
      name="Audio - Live Recording"
      category="Guarded Screen (Định luật 4)"
      description="Màn hình ghi âm bài giảng thời gian thực. Đã kích hoạt Route Guard: Thử bấm phím Quay lại hoặc chuyển trang để kiểm tra hộp thoại Mochi cảnh báo."
    />
  )
}

/**
 * RouteSlot có kích hoạt Route Guard để kiểm tra tính năng bảo vệ phiên ôn tập flashcards
 */
function GuardedFlashcardSlot() {
  const nav = useAppNavigation()

  useEffect(() => {
    // Đăng ký guard ngăn chặn thoát đột ngột làm mất tiến độ ôn tập
    const unregister = nav.registerGuard({
      id: 'active-flashcard-session',
      title: 'Tạm dừng phiên ôn tập?',
      message: 'Tiến độ ôn tập các thẻ hiện tại đã được ghi nhận. Bạn có chắc muốn quay về bàn học?',
      confirmText: 'Kết thúc ôn tập',
      cancelText: 'Học tiếp',
      guard: () => false,
    })
    return unregister
  }, [nav])

  return (
    <RouteSlot
      id="S24_25"
      number="24-25"
      name="Flashcard - Active Recall Session"
      category="Guarded Session (Định luật 4)"
      description="Phiên ôn tập thẻ nhớ Spaced Repetition (Mặt trước [24] & Mặt sau [25]). Đã kích hoạt Route Guard bảo vệ tiến độ học."
    />
  )
}

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. KHỞI ĐỘNG & XÁC THỰC (AuthLayout) */}
      <Route element={<AuthLayout />}>
        <Route
          path="/"
          element={
            <RouteSlot
              id="S01"
              number="01"
              name="Splash - App Launch"
              category="Bootstrap Entry"
              description="Điểm khởi chạy ứng dụng ban đầu. Tự động kiểm tra phiên đăng nhập và onboarding."
            />
          }
        />
        <Route
          path="/onboarding/step-1"
          element={
            <RouteSlot
              id="S02"
              number="02"
              name="Onboarding - Step 1 (Record or Upload)"
              category="Linear Wizard"
              description="Giới thiệu tính năng ghi âm và trích xuất ASR tiếng Việt với PhoWhisper."
            />
          }
        />
        <Route
          path="/onboarding/step-2"
          element={
            <RouteSlot
              id="S03"
              number="03"
              name="Onboarding - Step 2 (Find What Matters)"
              category="Linear Wizard"
              description="Giới thiệu tính năng tìm kiếm ngữ nghĩa 2-Stage Neural RAG kèm mốc thời gian [MM:SS]."
            />
          }
        />
        <Route
          path="/onboarding/step-3"
          element={
            <RouteSlot
              id="S04"
              number="04"
              name="Onboarding - Step 3 (Remember It)"
              category="Linear Wizard"
              description="Giới thiệu phương pháp ghi chép Cornell và thẻ học lặp lại ngắt quãng Spaced Repetition."
            />
          }
        />
        <Route
          path="/auth/sign-in"
          element={
            <RouteSlot
              id="S05"
              number="05"
              name="Auth - Sign In"
              category="Authentication"
              description="Đăng nhập tài khoản sinh viên với email và mật khẩu."
            />
          }
        />
        <Route
          path="/auth/create-account"
          element={
            <RouteSlot
              id="S06"
              number="06"
              name="Auth - Create Account"
              category="Authentication"
              description="Tạo tài khoản học tập LectureLens mới."
            />
          }
        />
      </Route>

      {/* 2. CÁC MÀN HÌNH CHÍNH & KHÔNG GIAN BÀI GIẢNG (AppLayout - Có Floating Tab Bar & Capsule Player) */}
      <Route element={<AppLayout />}>
        {/* 5 Tab Gốc */}
        <Route
          path="/home"
          element={
            <RouteSlot
              id="S08_09"
              number="08-09"
              name="Home - Study Hub Dashboard"
              category="Tab Root 1"
              description="Bàn học điện tử trung tâm. Bao gồm cả trạng thái Offline [09] khi mất kết nối."
            />
          }
        />
        <Route
          path="/library"
          element={
            <RouteSlot
              id="S10_12"
              number="10-12"
              name="Library - Lecture Archive"
              category="Tab Root 2"
              description="Kho lưu trữ toàn bộ bài giảng đại học. Bao gồm Empty State [11] và Offline State [12]."
            />
          }
        />
        <Route
          path="/subjects"
          element={
            <RouteSlot
              id="S20"
              number="20"
              name="Subjects - Course Archive"
              category="Tab Root 3"
              description="Danh sách các môn học theo học kỳ và tín chỉ."
            />
          }
        />
        <Route
          path="/subjects/:courseId"
          element={
            <RouteSlot
              id="S21"
              number="21"
              name="Subjects - Course Detail (Macroeconomics)"
              category="Detail Stack"
              description="Chi tiết môn học: bài giảng trong môn và bộ thẻ ôn tập tương ứng."
            />
          }
        />
        <Route
          path="/review"
          element={
            <RouteSlot
              id="S23"
              number="23"
              name="Review - Spaced Repetition Study Hub"
              category="Tab Root 4"
              description="Trung tâm ôn tập chủ động Active Recall và quản lý tiến độ chuỗi ngày (Streak)."
            />
          }
        />
        <Route
          path="/profile"
          element={
            <RouteSlot
              id="S27"
              number="27"
              name="Profile - Student Stats & Activity"
              category="Tab Root 5"
              description="Hồ sơ sinh viên, biểu đồ thời gian nghe và chỉ số ghi nhớ."
            />
          }
        />
        <Route
          path="/settings"
          element={
            <RouteSlot
              id="S28"
              number="28"
              name="Settings - App Preferences"
              category="Detail Stack"
              description="Cài đặt mô hình AI cục bộ, dung lượng bộ nhớ đệm và giao diện Kitsune Soft."
            />
          }
        />

        {/* Global Search Neural RAG */}
        <Route
          path="/search"
          element={
            <RouteSlot
              id="S22"
              number="22"
              name="Search - Neural RAG & Audio Snippets"
              category="Global Search Overlay"
              description="Truy vấn ngữ nghĩa 2 giai đoạn (BGE-M3 + BGE-Reranker-v2-m3) kèm trích đoạn âm thanh."
            />
          }
        />

        {/* Pipeline Xử lý ASR */}
        <Route
          path="/audio/processing/:jobId"
          element={
            <RouteSlot
              id="S15"
              number="15"
              name="Audio - Processing Pipeline"
              category="Transient Pipeline (Định luật 2)"
              description="Tiến trình chuẩn hóa âm thanh, nhận dạng PhoWhisper và tạo nhúng vector BGE-M3."
            />
          }
        />

        {/* Không gian bài giảng & Ghi chú Cornell */}
        <Route
          path="/lectures/:id/transcript"
          element={
            <RouteSlot
              id="S16"
              number="16"
              name="Audio Detail - Synchronized Transcript"
              category="Lecture Workspace"
              description="Văn bản bài giảng đồng bộ karaoke theo thời gian thực kèm Capsule Audio Player."
            />
          }
        />
        <Route
          path="/lectures/:id/highlights"
          element={
            <RouteSlot
              id="S17"
              number="17"
              name="Audio Detail - Key Highlights"
              category="Lecture Workspace"
              description="Các điểm nhấn trọng tâm, công thức và trích đoạn quan trọng trích xuất tự động."
            />
          }
        />
        <Route
          path="/lectures/:id/cornell"
          element={
            <RouteSlot
              id="S18"
              number="18"
              name="Audio Detail - Cornell Summary Overview"
              category="Lecture Workspace"
              description="Tóm tắt bài học theo phương pháp ghi chép 3 phần Cornell Notes."
            />
          }
        />
        <Route
          path="/lectures/:id/chapters/:chId"
          element={
            <RouteSlot
              id="S19"
              number="19"
              name="Audio Detail - Cornell Chapter View"
              category="Drilldown Stack"
              description="Đọc chi tiết một chương cụ thể trong bài giảng."
            />
          }
        />
      </Route>

      {/* 3. MÀN HÌNH TẬP TRUNG TOÀN CẢNH (FullscreenLayout - Có Route Guard) */}
      <Route element={<FullscreenLayout />}>
        <Route path="/audio/record" element={<GuardedRecordingSlot />} />
        <Route path="/review/session/:deckId" element={<GuardedFlashcardSlot />} />
        <Route
          path="/review/complete/:deckId"
          element={
            <RouteSlot
              id="S26"
              number="26"
              name="Review - Session Complete Celebration"
              category="Transient Stack (Định luật 2)"
              description="Màn hình ăn mừng hoàn thành phiên ôn tập thẻ ghi nhớ với Cáo Kitsune."
            />
          }
        />
      </Route>

      {/* Đường dẫn mặc định fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
