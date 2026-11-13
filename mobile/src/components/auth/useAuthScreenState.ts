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
  parsePreviewOverrideParam,
  resolveAuthTransitionDirection,
  resolveServiceAvailability,
  sanitizeReturnTo,
  type PreviewOverrideState,
} from '../../modules/resilience'
import { useNetworkStatus } from '../../services/networkMonitor'

// Track cold-start runtime hydration at module level so switching between
// Screen 05 (Sign In) and Screen 06 (Create Account) never flashes a skeleton.
let hasBootstrappedAuthRuntime = false

/**
 * Shared state, transition & resilience coordinator for Auth Screens 05 (Sign In) and 06 (Create Account).
 */
export function useAuthScreenState() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    returnTo?: string | string[]
    preview?: string | string[]
    dir?: string | string[]
  }>()
  const network = useNetworkStatus()

  const [authMode, setAuthMode] = useState<AuthAdapterMode>(() => getAuthSeam().mode)
  const [manualPreviewOverride, setManualPreviewOverride] =
    useState<PreviewOverrideState | null>(null)
  const [isHydratingSkeleton, setIsHydratingSkeleton] = useState(
    !hasBootstrappedAuthRuntime,
  )
  const [isRetrying, setIsRetrying] = useState(false)
  const [lastErrorCode, setLastErrorCode] = useState<AuthErrorCode | null>(null)
  const [allowOfflineInMockMode, setAllowOfflineInMockMode] = useState(false)

  const urlPreviewOverride = useMemo(
    () => parsePreviewOverrideParam(params.preview),
    [params.preview],
  )

  const previewOverride = manualPreviewOverride ?? urlPreviewOverride

  const transitionDirection = useMemo(
    () => resolveAuthTransitionDirection(params.dir),
    [params.dir],
  )

  useEffect(() => {
    let mounted = true
    const bootstrap = async () => {
      const mode = await initAuthRuntime()
      if (!mounted) return
      setAuthMode(mode)

      if (hasBootstrappedAuthRuntime) {
        setIsHydratingSkeleton(false)
        return
      }

      hasBootstrappedAuthRuntime = true
      setTimeout(() => {
        if (mounted) {
          setIsHydratingSkeleton(false)
        }
      }, 220)
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
    setManualPreviewOverride('auto')
    setIsHydratingSkeleton(true)
    setTimeout(() => {
      setIsHydratingSkeleton(false)
    }, durationMs)
  }, [])

  const handleRetry = useCallback(async () => {
    setIsRetrying(true)
    try {
      setManualPreviewOverride('auto')
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
    setManualPreviewOverride('auto')
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
    setPreviewOverride: setManualPreviewOverride,
    transitionDirection,
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
