/**
 * LectureLens Mobile Navigation Types & Interfaces (Deep Module Pattern)
 * Tuân thủ Hiến chương điều hướng tại docs/UX-NAVIGATION-FLOW.md
 */

export type TabRoute = '/(tabs)/home' | '/(tabs)/library' | '/(tabs)/review' | '/(tabs)/search'

export type AppRoute =
  | '/'
  | '/(onboarding)/step-1'
  | '/(onboarding)/step-2'
  | '/(onboarding)/step-3'
  | '/(auth)/sign-in'
  | '/(auth)/create-account'
  | TabRoute
  | '/(tabs)/subjects'
  | '/(tabs)/profile'
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
  /** Tab gốc hiện tại (nếu đang ở một trong 4 tab chính) */
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
