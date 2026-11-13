// Launch & Onboarding Orchestrator (Deep Module Seam)
// Resolves S01 -> S02 / S05 / S08 transitions per docs/UX-NAVIGATION-FLOW.md
import {
  ONBOARDING_STORAGE_KEY,
  isOnboardingCompleted,
  markOnboardingCompleted,
} from './onboardingStorage.ts'
import { ONBOARDING_SLIDES } from './onboardingSlides.ts'
import type {
  LaunchOrchestratorDeps,
  LaunchResolutionInput,
  LaunchTargetRoute,
  OnboardingStepIndex,
} from './types.ts'

export { ONBOARDING_SLIDES, ONBOARDING_STORAGE_KEY, isOnboardingCompleted, markOnboardingCompleted }

/**
 * Pure launch decision matrix matching Zone 1 of UX Navigation Flow:
 * - First launch (`!onboardingCompleted`) -> Onboarding Step 1
 * - Returning & unauthenticated -> Auth Sign In (S05)
 * - Returning & authenticated -> Home Study Hub (S08)
 */
export function resolveLaunchRoute({
  onboardingCompleted,
  hasSession,
}: LaunchResolutionInput): LaunchTargetRoute {
  if (!onboardingCompleted) {
    return '/(onboarding)/step-1'
  }
  return hasSession ? '/(tabs)/home' : '/(auth)/sign-in'
}

/**
 * Clamps any arbitrary step index into valid Onboarding carousel bounds [0..2].
 */
export function clampOnboardingStep(step: number): OnboardingStepIndex {
  if (step <= 0) return 0
  if (step >= 2) return 2
  return Math.round(step) as OnboardingStepIndex
}

async function safeHasSession(
  authSeam: LaunchOrchestratorDeps['authSeam']
): Promise<boolean> {
  try {
    const session = await authSeam.getCurrentSession()
    return Boolean(session?.success && session?.token)
  } catch {
    return false
  }
}

/**
 * Hydrates onboarding and auth session state during Splash (01) bootstrap.
 */
export async function hydrateLaunchRoute({
  storage,
  authSeam,
}: LaunchOrchestratorDeps): Promise<LaunchTargetRoute> {
  const [onboardingCompleted, hasSession] = await Promise.all([
    isOnboardingCompleted(storage),
    safeHasSession(authSeam),
  ])

  return resolveLaunchRoute({ onboardingCompleted, hasSession })
}

/**
 * Persists onboarding completion when pressing "Get started" on Step 3 (04)
 * and resolves the terminal replace target (`/(auth)/sign-in` or `/(tabs)/home`).
 */
export async function completeOnboarding({
  storage,
  authSeam,
}: LaunchOrchestratorDeps): Promise<LaunchTargetRoute> {
  await markOnboardingCompleted(storage)
  const hasSession = await safeHasSession(authSeam)
  return resolveLaunchRoute({ onboardingCompleted: true, hasSession })
}
