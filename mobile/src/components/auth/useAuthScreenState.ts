import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getAuthSeam,
  type AuthAdapterMode,
  type AuthErrorCode,
} from '../../modules/auth'
import {
  getActiveGatewayUrl,
  initAuthRuntime,
  switchAuthAdapterMode,
} from '../../modules/auth/infrastructure/authRuntime'
import {
  resolveServiceAvailability,
  sanitizeReturnTo,
  type PreviewOverrideState,
} from '../../modules/resilience'
import { useNetworkStatus } from '../../services/networkMonitor'

/**
 * Shared state & resilience coordinator for Auth Screens 05 (Sign In) and 06 (Create Account).
 */
export function useAuthScreenState() {
  const router = useRouter()
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>()
  const network = useNetworkStatus()

  const [authMode, setAuthMode] = useState<AuthAdapterMode>(() => getAuthSeam().mode)
  const [previewOverride, setPreviewOverride] =
    useState<PreviewOverrideState>('auto')
  const [isHydratingSkeleton, setIsHydratingSkeleton] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [lastErrorCode, setLastErrorCode] = useState<AuthErrorCode | null>(null)
  const [allowOfflineInMockMode, setAllowOfflineInMockMode] = useState(false)

  useEffect(() => {
    let mounted = true
    const bootstrap = async () => {
      const mode = await initAuthRuntime()
      if (!mounted) return
      setAuthMode(mode)
      // Brief initial shimmer shows Kitsune Soft skeleton before settling smoothly
      setTimeout(() => {
        if (mounted) {
          setIsHydratingSkeleton(false)
        }
      }, 260)
    }
    void bootstrap()
    return () => {
      mounted = false
    }
  }, [])

  const destinationRoute = useMemo(
    () => sanitizeReturnTo(params.returnTo),
    [params.returnTo],
  )

  const availability = useMemo(
    () =>
      resolveServiceAvailability({
        isConnected: network.isConnected,
        isInternetReachable: network.isInternetReachable,
        isLoading: isHydratingSkeleton,
        lastErrorCode,
        previewOverride,
        allowOfflineInMockMode,
        authMode,
      }),
    [
      network.isConnected,
      network.isInternetReachable,
      isHydratingSkeleton,
      lastErrorCode,
      previewOverride,
      allowOfflineInMockMode,
      authMode,
    ],
  )

  const changeAuthMode = useCallback(async (nextMode: AuthAdapterMode) => {
    const resolved = await switchAuthAdapterMode(nextMode)
    setAuthMode(resolved)
    setLastErrorCode(null)
  }, [])

  const replaySkeleton = useCallback((durationMs = 900) => {
    setPreviewOverride('auto')
    setIsHydratingSkeleton(true)
    setTimeout(() => {
      setIsHydratingSkeleton(false)
    }, durationMs)
  }, [])

  const handleRetry = useCallback(async () => {
    setIsRetrying(true)
    try {
      setPreviewOverride('auto')
      setLastErrorCode(null)
      if (authMode === 'spring') {
        const healthy = await getAuthSeam().checkBackendHealth()
        if (!healthy) {
          setLastErrorCode('SERVER_UNREACHABLE')
        }
      } else {
        await new Promise((r) => setTimeout(r, 250))
      }
    } finally {
      setIsRetrying(false)
    }
  }, [authMode])

  const handleContinueInDemo = useCallback(async () => {
    await switchAuthAdapterMode('mock')
    setAuthMode('mock')
    setAllowOfflineInMockMode(true)
    setPreviewOverride('auto')
    setLastErrorCode(null)
  }, [])

  const navigateAfterAuth = useCallback(() => {
    router.replace(destinationRoute as never)
  }, [router, destinationRoute])

  return {
    authMode,
    changeAuthMode,
    gatewayUrl: getActiveGatewayUrl(),
    isOnline:
      network.isConnected && network.isInternetReachable !== false,
    previewOverride,
    setPreviewOverride,
    availability,
    isRetrying,
    lastErrorCode,
    setLastErrorCode,
    replaySkeleton,
    handleRetry,
    handleContinueInDemo,
    destinationRoute,
    navigateAfterAuth,
  }
}
