import type {
  AuthAdapterMode,
  AuthErrorCode,
} from '../auth/domain/auth.types.ts'

export type ServiceIssueKind = 'offline' | 'server_error'

export type PreviewOverrideState =
  | 'auto'
  | 'skeleton'
  | 'offline'
  | 'server_error'

export type AuthTransitionDirection = 'forward' | 'back' | 'neutral'

export type ServiceAvailability =
  | { status: 'ready' }
  | { status: 'loading' }
  | { status: 'offline' }
  | { status: 'server_error'; detail?: string }

export interface ServiceAvailabilityInput {
  isConnected: boolean
  isInternetReachable?: boolean | null
  isLoading?: boolean
  serverReachable?: boolean
  lastErrorCode?: AuthErrorCode | string | null
  previewOverride?: PreviewOverrideState
  allowOfflineInMockMode?: boolean
  authMode?: AuthAdapterMode
}

export interface ServiceIssueDescriptor {
  badge: string
  title: string
  subtitle: string
  primaryActionLabel: string
  secondaryActionLabel: string
  iconName: 'wifi-off' | 'kitsune-fox'
}

export const SERVICE_ISSUE_COPY: Record<
  ServiceIssueKind,
  ServiceIssueDescriptor
> = {
  offline: {
    badge: 'NO CONNECTION',
    title: "You're offline right now",
    subtitle:
      'Check your Wi-Fi or cellular connection to reach the LectureLens gateway, or keep testing locally in Demo Mode.',
    primaryActionLabel: 'Retry connection',
    secondaryActionLabel: 'Continue in Demo Mode',
    iconName: 'wifi-off',
  },
  server_error: {
    badge: 'SERVER ISSUE',
    title: 'Server is taking a breather',
    subtitle:
      "We couldn't reach the LectureLens gateway on port 8080 right now. Try again or continue in Demo Mode.",
    primaryActionLabel: 'Try again',
    secondaryActionLabel: 'Continue in Demo Mode',
    iconName: 'kitsune-fox',
  },
}

/**
 * Resolve unified screen availability from live NetInfo state, loading status,
 * Spring Boot server error state, and explicit QA preview overrides.
 */
export function resolveServiceAvailability(
  input: ServiceAvailabilityInput,
): ServiceAvailability {
  const override = input.previewOverride ?? 'auto'

  if (override === 'skeleton') {
    return { status: 'loading' }
  }
  if (override === 'offline') {
    return { status: 'offline' }
  }
  if (override === 'server_error') {
    return {
      status: 'server_error',
      detail: SERVICE_ISSUE_COPY.server_error.subtitle,
    }
  }

  if (input.isLoading) {
    return { status: 'loading' }
  }

  const isOffline =
    !input.isConnected || input.isInternetReachable === false
  const canRunOfflineDemo =
    Boolean(input.allowOfflineInMockMode) && input.authMode === 'mock'

  if (isOffline && !canRunOfflineDemo) {
    return { status: 'offline' }
  }

  if (
    input.serverReachable === false ||
    input.lastErrorCode === 'SERVER_UNREACHABLE'
  ) {
    return {
      status: 'server_error',
      detail: SERVICE_ISSUE_COPY.server_error.subtitle,
    }
  }

  return { status: 'ready' }
}

const DISALLOWED_AUTH_RETURN_PREFIXES = [
  '/(auth)',
  '/auth',
  '/sign-in',
  '/create-account',
  '/(onboarding)',
  '/onboarding',
] as const

/**
 * Law 5 Auth Redirection Sanitization: rejects external URLs, empty values,
 * root splash, onboarding, and auth routes to guarantee loop-free post-auth navigation.
 */
export function sanitizeReturnTo(
  rawReturnTo?: string | string[] | null,
): string {
  const candidate = Array.isArray(rawReturnTo) ? rawReturnTo[0] : rawReturnTo
  if (!candidate) {
    return '/(tabs)/home'
  }

  const trimmed = candidate.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed === '/') {
    return '/(tabs)/home'
  }

  const normalized = trimmed.split('?')[0].toLowerCase()
  const isAuthOrOnboarding = DISALLOWED_AUTH_RETURN_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
  if (isAuthOrOnboarding) {
    return '/(tabs)/home'
  }

  return trimmed
}

const VALID_PREVIEW_OVERRIDES = new Set<PreviewOverrideState>([
  'auto',
  'skeleton',
  'offline',
  'server_error',
])

/**
 * Parse ?preview= query string safely for QA testing of Skeleton / Offline / Server Error states.
 */
export function parsePreviewOverrideParam(
  rawPreview?: string | string[] | null,
): PreviewOverrideState {
  const candidate = Array.isArray(rawPreview) ? rawPreview[0] : rawPreview
  if (!candidate) {
    return 'auto'
  }
  const normalized = candidate.trim().toLowerCase() as PreviewOverrideState
  return VALID_PREVIEW_OVERRIDES.has(normalized) ? normalized : 'auto'
}

/**
 * Resolve synchronized transition direction between Screen 05 (Sign In) & Screen 06 (Create Account).
 */
export function resolveAuthTransitionDirection(
  rawDirection?: string | string[] | null,
): AuthTransitionDirection {
  const candidate = Array.isArray(rawDirection) ? rawDirection[0] : rawDirection
  if (!candidate) {
    return 'neutral'
  }
  const normalized = candidate.trim().toLowerCase()
  if (normalized === 'forward' || normalized === 'back') {
    return normalized
  }
  return 'neutral'
}

/**
 * Construct an Auth route preserving optional returnTo and directional transition metadata.
 */
export function buildAuthRoute(
  pathname: '/(auth)/sign-in' | '/(auth)/create-account',
  options?: { dir?: AuthTransitionDirection; returnTo?: string },
): string {
  const search = new URLSearchParams()
  if (options?.dir && options.dir !== 'neutral') {
    search.set('dir', options.dir)
  }
  if (options?.returnTo && options.returnTo.trim().length > 0) {
    search.set('returnTo', options.returnTo)
  }
  const query = search.toString()
  return query ? `${pathname}?${query}` : pathname
}
