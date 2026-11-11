// NavigationProvider & useAppNavigation (Matt Pocock Deep Module for Expo Router)
import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { useRouter, usePathname } from 'expo-router'
import type {
  AppNavigator,
  AppRoute,
  TabRoute,
  ModalSheetType,
  NavigateOptions,
  GuardConfig,
} from './types'
import { getParentFallback } from './parentFallback'
import { MochiConfirmDialog } from './MochiConfirmDialog'

const TAB_ROUTES: TabRoute[] = [
  '/(tabs)/home',
  '/(tabs)/library',
  '/(tabs)/subjects',
  '/(tabs)/review',
  '/(tabs)/profile',
]

const NavigationContext = createContext<AppNavigator | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  // Theo dõi số bước di chuyển nội bộ trong phiên
  const [historyDepth, setHistoryDepth] = useState<number>(0)
  const isFirstRender = useRef<boolean>(true)

  // Danh sách các Guard đang kích hoạt
  const guardsRef = useRef<Map<string, GuardConfig>>(new Map())

  // Trạng thái modal sheet
  const [activeSheet, setActiveSheet] = useState<ModalSheetType>(null)

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
  }, [pathname])

  // Xác định active Tab nếu đang ở một trong 5 tab chính
  const activeTab: TabRoute | null = TAB_ROUTES.includes(pathname as TabRoute)
    ? (pathname as TabRoute)
    : null

  const canGoBack = historyDepth > 0

  // Đăng ký Guard (Định luật 4)
  const registerGuard = useCallback((config: GuardConfig) => {
    guardsRef.current.set(config.id, config)
    return () => {
      guardsRef.current.delete(config.id)
    }
  }, [])

  // Đóng modal sheet
  const closeSheet = useCallback(() => {
    setActiveSheet(null)
    if (router.canGoBack()) {
      router.back()
    }
  }, [router])

  // Mở modal sheet
  const openSheet = useCallback((sheet: ModalSheetType) => {
    if (!sheet) {
      closeSheet()
      return
    }
    setActiveSheet(sheet)
    if (sheet === 'paywall') {
      router.push('/(modal)/paywall' as any)
    } else if (sheet === 'add-audio') {
      router.push('/(modal)/add-audio' as any)
    } else if (sheet === 'search') {
      router.push('/(modal)/search' as any)
    }
  }, [closeSheet, router])

  // Kiểm tra Guards trước khi thực hiện hành động rời trang
  const checkGuardsBeforeExit = useCallback(async (proceedAction: () => void) => {
    if (guardsRef.current.size === 0) {
      proceedAction()
      return
    }

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
      if (activeSheet) {
        setActiveSheet(null)
      }

      if (options?.replace) {
        router.replace(route as any)
      } else {
        router.push(route as any)
      }
    })
  }, [activeSheet, checkGuardsBeforeExit, router])

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
      if (canGoBack && router.canGoBack()) {
        setHistoryDepth((prev) => Math.max(0, prev - 1))
        router.back()
        return
      }

      // 4. Nếu vào bằng Deep Link trực tiếp -> Fallback về Route cha (Định luật 1)
      const parentFallback = getParentFallback(pathname)
      router.replace(parentFallback as any)
    })
  }, [activeSheet, canGoBack, checkGuardsBeforeExit, closeSheet, pathname, router])

  const navigatorValue: AppNavigator = {
    currentRoute: pathname,
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

export function useAppNavigation(): AppNavigator {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useAppNavigation must be used within a NavigationProvider')
  }
  return context
}
