// Splash Preflight Pipeline Seam (Pure TypeScript, Zero RN Dependencies)
// Orchestrates network check, server health ping, startup preparers, and route hydration
import { hydrateLaunchRoute } from './launchOrchestrator.ts'
import type {
  LaunchBootstrapDeps,
  LaunchBootstrapResult,
  LaunchTargetRoute,
  StartupPreparer,
} from './types.ts'

const DEFAULT_STEP_TIMEOUT_MS = 1200
const DEFAULT_MIN_DISPLAY_MS = 1100

function defaultDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runWithTimeout<T>(
  task: () => Promise<T>,
  timeoutMs: number
): Promise<{ ok: true; value: T } | { ok: false }> {
  let timerId: ReturnType<typeof setTimeout> | undefined
  try {
    const result = await Promise.race([
      task().then((value) => ({ ok: true as const, value })),
      new Promise<{ ok: false }>((resolve) => {
        timerId = setTimeout(() => resolve({ ok: false }), timeoutMs)
      }),
    ])
    return result
  } catch {
    return { ok: false }
  } finally {
    if (timerId !== undefined) {
      clearTimeout(timerId)
    }
  }
}

async function runPreparers(
  preparers: readonly StartupPreparer[],
  timeoutMs: number
): Promise<{ completedPreparers: string[]; failedPreparers: string[] }> {
  if (preparers.length === 0) {
    return { completedPreparers: [], failedPreparers: [] }
  }

  const outcomes = await Promise.all(
    preparers.map(async (preparer) => {
      const outcome = await runWithTimeout(preparer.run, timeoutMs)
      return { id: preparer.id, ok: outcome.ok }
    })
  )

  const completedPreparers: string[] = []
  const failedPreparers: string[] = []
  for (const item of outcomes) {
    if (item.ok) {
      completedPreparers.push(item.id)
    } else {
      failedPreparers.push(item.id)
    }
  }
  return { completedPreparers, failedPreparers }
}

/**
 * Executes the multi-stage Splash preflight sequence and never throws.
 * Future server pre-calls can be added via `deps.preparers`.
 */
export async function runLaunchBootstrap({
  storage,
  authSeam,
  checkNetwork,
  checkServerHealth,
  preparers = [],
  onProgress,
  stepTimeoutMs = DEFAULT_STEP_TIMEOUT_MS,
  minDisplayMs = DEFAULT_MIN_DISPLAY_MS,
  delayFn = defaultDelay,
  nowFn = Date.now,
}: LaunchBootstrapDeps): Promise<LaunchBootstrapResult> {
  const startedAt = nowFn()

  onProgress?.({
    stage: 'network',
    progress: 0.15,
    statusText: 'Checking connection...',
  })

  const networkOutcome = checkNetwork
    ? await runWithTimeout(checkNetwork, stepTimeoutMs)
    : ({ ok: true as const, value: true })
  const networkConnected = networkOutcome.ok ? networkOutcome.value : true

  let serverReachable = false
  let serverLatencyMs: number | null = null

  if (networkConnected && checkServerHealth) {
    const pingStart = nowFn()
    const healthOutcome = await runWithTimeout(checkServerHealth, stepTimeoutMs)
    serverReachable = healthOutcome.ok && healthOutcome.value
    serverLatencyMs = serverReachable ? Math.max(0, nowFn() - pingStart) : null
  }

  onProgress?.({
    stage: 'server',
    progress: 0.45,
    statusText: serverReachable
      ? 'Connected to server...'
      : 'Preparing offline mode...',
  })

  const { completedPreparers, failedPreparers } = await runPreparers(
    preparers,
    stepTimeoutMs
  )

  onProgress?.({
    stage: 'prepare',
    progress: 0.78,
    statusText: 'Getting things ready...',
  })

  let targetRoute: LaunchTargetRoute = '/(onboarding)/step-1'
  try {
    targetRoute = await hydrateLaunchRoute({ storage, authSeam })
  } catch {
    targetRoute = '/(onboarding)/step-1'
  }

  const elapsed = Math.max(0, nowFn() - startedAt)
  const remaining = minDisplayMs - elapsed
  if (remaining > 0) {
    await delayFn(remaining)
  }

  onProgress?.({
    stage: 'session',
    progress: 1,
    statusText: 'Ready!',
  })

  return {
    targetRoute,
    diagnostics: {
      networkConnected,
      serverReachable,
      serverLatencyMs,
      completedPreparers,
      failedPreparers,
    },
  }
}
