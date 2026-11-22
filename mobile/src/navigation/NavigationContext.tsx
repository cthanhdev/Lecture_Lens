// NavigationProvider & useAppNavigation (Matt Pocock Deep Module for Expo Router)
import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { BackHandler, Platform, ToastAndroid } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import type {
  AppNavigator,
  AppRoute,
  TabRoute,
  ModalSheetType,
  NavigateOptions,
  GuardConfig,
  NavigationDirection,
} from './types'
import { getParentFallback } from './parentFallback'
import { MochiConfirmDialog } from './MochiConfirmDialog'
import {
  BACK_EXIT_WINDOW_MS,
  NavigationHistoryTracker,
  evaluateDoubleBackExit,
  normalizeNavigationRoute,
} from './navigationHistory'
import {
  resolveTabBarState,
  type FloatingTabId,
} from '../components/navigation/tabBarModel'

const TAB_ROUTE_BY_ID: Record<FloatingTabId, TabRoute> = {
  home: '/(tabs)/home',
  library: '/(tabs)/library',
  review: '/(tabs)/review',
  search: '/(tabs)/search',
}

const TAB_EXPO_TARGET_BY_NORMALIZED: Record<string, string> = {
  '/home': '/(tabs)/home',
  '/library': '/(tabs)/library',
  '/review': '/(tabs)/review',
  '/search': '/(tabs)/search',
  '/subjects': '/(tabs)/subjects',
  '/profile': '/(tabs)/profile',
}

function isTabNormalizedRoute(normalizedRoute: string): boolean {
  return normalizedRoute in TAB_EXPO_TARGET_BY_NORMALIZED
}

function toExpoNavigationTarget(normalizedRoute: string): string {
  return TAB_EXPO_TARGET_BY_NORMALIZED[normalizedRoute] ?? normalizedRoute
}

interface PendingNavAction {
  readonly kind: 'push' | 'replace' | 'back'
  readonly target: string
}

interface HistorySnapshot {
  readonly canGoBack: boolean
  readonly previousRoute: string | null
  readonly transitionDirection: NavigationDirection
}

const NavigationContext = createContext<AppNavigator | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const historyTrackerRef = useRef<NavigationHistoryTracker | null>(null)
  const latestPathnameRef = useRef<string>(pathname || '/')

  const [historySnapshot, setHistorySnapshot] = useState<HistorySnapshot>({
    canGoBack: false,
    previousRoute: null,
    transitionDirection: 'forward',
  })

  const getTracker = useCallback((): NavigationHistoryTracker => {
    if (historyTrackerRef.current === null) {
      historyTrackerRef.current = new NavigationHistoryTracker(
        latestPathnameRef.current,
      )
    }
    return historyTrackerRef.current
  }, [])

  const isFirstRenderRef = useRef<boolean>(true)
  const pendingNavActionRef = useRef<PendingNavAction | null>(null)
  const lastBackExitPressRef = useRef<number | null>(null)

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

  const syncHistorySnapshot = useCallback(() => {
    const tracker = historyTrackerRef.current
    if (!tracker) return
    setHistorySnapshot((prev) => {
      const nextCanGoBack = tracker.canGoBack
      const nextPreviousRoute = tracker.previousRoute
      const nextDirection = tracker.lastDirection
      if (
        prev.canGoBack === nextCanGoBack &&
        prev.previousRoute === nextPreviousRoute &&
        prev.transitionDirection === nextDirection
      ) {
        return prev
      }
      return {
        canGoBack: nextCanGoBack,
        previousRoute: nextPreviousRoute,
        transitionDirection: nextDirection,
      }
    })
  }, [])

  // Đồng bộ lịch sử khi pathname thay đổi từ native gesture, deep-link, hoặc router trực tiếp
  useEffect(() => {
    latestPathnameRef.current = pathname || '/'
    const normalized = normalizeNavigationRoute(pathname || '/')
    const tracker = getTracker()

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      tracker.reset(normalized, 'forward')
      syncHistorySnapshot()
      return
    }

    const pending = pendingNavActionRef.current
    if (pending && pending.target === normalized) {
      pendingNavActionRef.current = null
      return
    }
    pendingNavActionRef.current = null

    // In-place state change / morph: normalized route matches top of stack -> do NOT duplicate
    if (normalized === tracker.currentRoute) {
      return
    }

    // Never leave Splash ('/') in back history once app transitions away from launch
    if (tracker.currentRoute === '/' && normalized !== '/') {
      tracker.replace(normalized, 'forward')
      syncHistorySnapshot()
      return
    }

    // Native gesture / system pop landing back on previous visited entry
    if (normalized === tracker.peekPrevious()) {
      tracker.pop()
      syncHistorySnapshot()
      return
    }

    tracker.push(normalized)
    syncHistorySnapshot()
  }, [getTracker, pathname, syncHistorySnapshot])

  // Xác định active Tab qua seam tabBarModel (chuẩn hóa grouped/stripped pathname của Expo Router)
  const { activeTabId } = resolveTabBarState(pathname)
  const activeTab: TabRoute | null = activeTabId ? TAB_ROUTE_BY_ID[activeTabId] : null

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
    const tracker = getTracker()
    if (tracker.canGoBack) {
      const targetRoute = tracker.pop()
      syncHistorySnapshot()
      if (targetRoute) {
        pendingNavActionRef.current = { kind: 'back', target: targetRoute }
      }
    }
    if (router.canGoBack()) {
      router.back()
    }
  }, [getTracker, router, syncHistorySnapshot])

  // Mở modal sheet
  const openSheet = useCallback(
    (sheet: ModalSheetType) => {
      if (!sheet) {
        closeSheet()
        return
      }
      setActiveSheet(sheet)
      const tracker = getTracker()
      if (sheet === 'paywall') {
        const pushed = tracker.push('/(modal)/paywall')
        if (pushed) {
          pendingNavActionRef.current = { kind: 'push', target: '/paywall' }
          syncHistorySnapshot()
        }
        router.push('/(modal)/paywall' as any)
      } else if (sheet === 'add-audio') {
        const pushed = tracker.push('/(modal)/add-audio')
        if (pushed) {
          pendingNavActionRef.current = { kind: 'push', target: '/add-audio' }
          syncHistorySnapshot()
        }
        router.push('/(modal)/add-audio' as any)
      } else if (sheet === 'search') {
        const pushed = tracker.push('/(modal)/search')
        if (pushed) {
          pendingNavActionRef.current = { kind: 'push', target: '/search' }
          syncHistorySnapshot()
        }
        router.push('/(modal)/search' as any)
      }
    },
    [closeSheet, getTracker, router, syncHistorySnapshot],
  )

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
  const goTo = useCallback(
    (route: AppRoute | string, options?: NavigateOptions) => {
      void checkGuardsBeforeExit(() => {
        if (activeSheet) {
          setActiveSheet(null)
        }

        const tracker = getTracker()
        const normalizedTarget = normalizeNavigationRoute(route)

        if (normalizedTarget === normalizeNavigationRoute(pathname || '/')) {
          return
        }

        if (options?.replace) {
          tracker.replace(route, 'forward')
          pendingNavActionRef.current = {
            kind: 'replace',
            target: normalizedTarget,
          }
          syncHistorySnapshot()
          router.replace(route as any)
          return
        }

        const pushed = tracker.push(route)
        if (pushed) {
          pendingNavActionRef.current = {
            kind: 'push',
            target: normalizedTarget,
          }
          syncHistorySnapshot()
        }
        router.push(route as any)
      })
    },
    [activeSheet, checkGuardsBeforeExit, getTracker, pathname, router, syncHistorySnapshot],
  )

  // Quay lui an toàn (Zero-Dead-End Guarantee)
  const goBack = useCallback(() => {
    // 1. Nếu có modal sheet đang mở, ưu tiên đóng sheet trước (Định luật 3)
    if (activeSheet) {
      closeSheet()
      return
    }

    // 2. Kiểm tra Route Guard
    void checkGuardsBeforeExit(() => {
      const tracker = getTracker()
      const normalizedCurrent = normalizeNavigationRoute(pathname || '/')

      // 3. Nếu có lịch sử trong phiên -> pop route thực sự đã ghé thăm
      if (tracker.canGoBack) {
        const targetRoute = tracker.pop()
        syncHistorySnapshot()

        if (targetRoute) {
          pendingNavActionRef.current = { kind: 'back', target: targetRoute }
          const canNativePopStack =
            !isTabNormalizedRoute(normalizedCurrent) && router.canGoBack()

          if (canNativePopStack) {
            router.back()
          } else {
            router.replace(toExpoNavigationTarget(targetRoute) as any)
          }
          return
        }
      }

      // 4. Nếu vào bằng Deep Link trực tiếp (stack.length === 1) -> Fallback về Route cha (Định luật 1)
      const parentFallback = getParentFallback(pathname)
      const normalizedFallback = normalizeNavigationRoute(parentFallback)
      tracker.replace(normalizedFallback, 'back')
      pendingNavActionRef.current = {
        kind: 'back',
        target: normalizedFallback,
      }
      syncHistorySnapshot()
      router.replace(toExpoNavigationTarget(normalizedFallback) as any)
    })
  }, [
    activeSheet,
    checkGuardsBeforeExit,
    closeSheet,
    getTracker,
    pathname,
    router,
    syncHistorySnapshot,
  ])

  // Android Hardware BackHandler với Double-Back Exit Guard tại gốc /(tabs)/home
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (dialogState.isOpen) {
        setDialogState((prev) => ({ ...prev, isOpen: false }))
        return true
      }

      if (activeSheet) {
        closeSheet()
        return true
      }

      const tracker = getTracker()
      const normalizedCurrent = normalizeNavigationRoute(pathname || '/')

      if (
        normalizedCurrent === '/home' &&
        !tracker.canGoBack &&
        guardsRef.current.size === 0
      ) {
        const evaluation = evaluateDoubleBackExit(
          lastBackExitPressRef.current,
          Date.now(),
          BACK_EXIT_WINDOW_MS,
        )
        lastBackExitPressRef.current = evaluation.nextLastPressAtMs

        if (evaluation.shouldExit) {
          BackHandler.exitApp()
          return true
        }

        if (Platform.OS === 'android' && typeof ToastAndroid?.show === 'function') {
          ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT)
        }
        return true
      }

      goBack()
      return true
    })

    return () => subscription.remove()
  }, [activeSheet, closeSheet, dialogState.isOpen, getTracker, goBack, pathname])

  const navigatorValue = useMemo<AppNavigator>(
    () => ({
      currentRoute: pathname,
      activeTab,
      activeSheet,
      canGoBack: historySnapshot.canGoBack,
      transitionDirection: historySnapshot.transitionDirection,
      previousRoute: historySnapshot.previousRoute,
      goTo,
      goBack,
      openSheet,
      closeSheet,
      registerGuard,
    }),
    [
      activeSheet,
      activeTab,
      closeSheet,
      goBack,
      goTo,
      historySnapshot.canGoBack,
      historySnapshot.previousRoute,
      historySnapshot.transitionDirection,
      openSheet,
      pathname,
      registerGuard,
    ],
  )

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
