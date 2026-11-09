import {
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import {
  useNavigate,
  useLocation,
  useSearchParams,
} from 'react-router-dom'
import type {
  AppNavigator,
  AppRoute,
  TabRoute,
  ModalSheetType,
  NavigateOptions,
  GuardConfig,
} from './types.ts'
import { getParentFallback } from './parentFallback.ts'
import { MochiConfirmDialog } from './MochiConfirmDialog.tsx'
import { NavigationContext } from './useAppNavigation.ts'

const TAB_ROUTES: TabRoute[] = ['/home', '/library', '/subjects', '/review', '/profile']

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Theo dõi số bước di chuyển nội bộ trong phiên bằng state reactive
  const [historyDepth, setHistoryDepth] = useState<number>(0)
  const isFirstRender = useRef<boolean>(true)

  // Danh sách các Guard đang kích hoạt
  const guardsRef = useRef<Map<string, GuardConfig>>(new Map())

  // Trạng thái hiển thị Mochi Dialog
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    action?: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
  })

  // Cập nhật độ sâu lịch sử khi đổi pathname
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setHistoryDepth((prev) => prev + 1)
  }, [location.pathname])

  // Lấy Modal Sheet từ searchParams (?sheet=paywall hoặc ?sheet=add-audio)
  const activeSheetParam = searchParams.get('sheet')
  const activeSheet: ModalSheetType =
    activeSheetParam === 'paywall' || activeSheetParam === 'add-audio'
      ? activeSheetParam
      : null

  // Xác định active Tab nếu đang ở một trong 5 tab chính
  const activeTab: TabRoute | null = TAB_ROUTES.includes(location.pathname as TabRoute)
    ? (location.pathname as TabRoute)
    : null

  // Có thể back tự nhiên trong lịch sử không
  const canGoBack = historyDepth > 0

  // Đăng ký Guard
  const registerGuard = useCallback((config: GuardConfig) => {
    guardsRef.current.set(config.id, config)
    return () => {
      guardsRef.current.delete(config.id)
    }
  }, [])

  // Đóng modal sheet
  const closeSheet = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('sheet')
      return next
    }, { replace: true })
  }, [setSearchParams])

  // Mở modal sheet
  const openSheet = useCallback((sheet: ModalSheetType) => {
    if (!sheet) {
      closeSheet()
      return
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('sheet', sheet)
      return next
    }, { replace: false })
  }, [closeSheet, setSearchParams])

  // Kiểm tra Guards trước khi thực hiện hành động rời trang
  const checkGuardsBeforeExit = useCallback(async (proceedAction: () => void) => {
    if (guardsRef.current.size === 0) {
      proceedAction()
      return
    }

    // Lấy guard đầu tiên đang active
    const activeGuard = Array.from(guardsRef.current.values())[0]
    const canExit = await activeGuard.guard()

    if (canExit) {
      proceedAction()
      return
    }

    // Nếu không cho phép thoát trực tiếp, mở Mochi Confirm Dialog
    setDialogState({
      isOpen: true,
      title: activeGuard.title,
      message: activeGuard.message,
      confirmText: activeGuard.confirmText,
      cancelText: activeGuard.cancelText,
      action: () => {
        setDialogState((prev) => ({ ...prev, isOpen: false }))
        activeGuard.onConfirmExit?.()
        guardsRef.current.delete(activeGuard.id)
        proceedAction()
      },
    })
  }, [])

  // Điều hướng tới route
  const goTo = useCallback((route: AppRoute | string, options?: NavigateOptions) => {
    checkGuardsBeforeExit(() => {
      // Nếu có modal sheet đang mở, tự động đóng khi chuyển trang
      if (activeSheet) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.delete('sheet')
          return next
        }, { replace: true })
      }

      navigate(route, {
        replace: options?.replace ?? false,
        state: options?.state,
      })
    })
  }, [activeSheet, checkGuardsBeforeExit, navigate, setSearchParams])

  // Quay lui an toàn (Zero-Dead-End Guarantee)
  const goBack = useCallback(() => {
    // 1. Nếu có modal sheet đang mở, ưu tiên đóng sheet trước (Định luật 3)
    if (activeSheet) {
      closeSheet()
      return
    }

    // 2. Kiểm tra Route Guard
    checkGuardsBeforeExit(() => {
      // 3. Nếu có lịch sử trong phiên -> pop history
      if (canGoBack) {
        setHistoryDepth((prev) => Math.max(0, prev - 1))
        navigate(-1)
        return
      }

      // 4. Nếu vào bằng Deep Link trực tiếp -> Fallback về Route cha (Định luật 1)
      const parentFallback = getParentFallback(location.pathname)
      navigate(parentFallback, { replace: true })
    })
  }, [activeSheet, canGoBack, checkGuardsBeforeExit, closeSheet, location.pathname, navigate])

  const navigatorValue: AppNavigator = {
    currentRoute: location.pathname,
    activeTab,
    activeSheet,
    canGoBack,
    goTo,
    goBack,
    openSheet,
    closeSheet,
    registerGuard,
  }

  return (
    <NavigationContext.Provider value={navigatorValue}>
      {children}
      <MochiConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={() => dialogState.action?.()}
        onCancel={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
      />
    </NavigationContext.Provider>
  )
}
