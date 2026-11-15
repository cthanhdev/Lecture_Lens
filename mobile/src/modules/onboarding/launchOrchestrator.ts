// Launch & Onboarding Orchestrator (Deep Module Seam)
// Resolves S01 -> S02 / S05 / S08 transitions per docs/UX-NAVIGATION-FLOW.md
import {
  ONBOARDING_STORAGE_KEY,
  clearOnboardingCompleted,
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

export {
  ONBOARDING_SLIDES,
  ONBOARDING_STORAGE_KEY,
  clearOnboardingCompleted,
  isOnboardingCompleted,
  markOnboardingCompleted,
}

/**
 * Pure launch decision matrix matching Zone 1 of UX Navigation Flow:
 * - Unauthenticated (`!hasSession`) or incomplete onboarding (`!onboardingCompleted`) -> Onboarding Step 1 (Screens 02-04)
 * - Authenticated (`hasSession`) & completed onboarding -> Home Study Hub (S08)
 */
export function resolveLaunchRoute({
  onboardingCompleted,
  hasSession,
}: LaunchResolutionInput): LaunchTargetRoute {
  if (!hasSession || !onboardingCompleted) {
    return '/(onboarding)/step-1'
  }
  return '/(tabs)/home'
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
 * Unauthenticated launches always clear stale onboarding flags and present Screens 02-04.
 */
export async function hydrateLaunchRoute({
  storage,
  authSeam,
}: LaunchOrchestratorDeps): Promise<LaunchTargetRoute> {
  const hasSession = await safeHasSession(authSeam)
  if (!hasSession) {
    await clearOnboardingCompleted(storage)
    return '/(onboarding)/step-1'
  }

  await markOnboardingCompleted(storage)
  return '/(tabs)/home'
}

/**
 * Resolves the terminal replace target when pressing "Get started" on Step 3 (04):
 * - Unauthenticated -> clears stale lock so Screens 02-04 reappear until signed in, and goes to `/(auth)/sign-in`
 * - Authenticated -> persists completion and goes to `/(tabs)/home`
 */
export async function completeOnboarding({
  storage,
  authSeam,
}: LaunchOrchestratorDeps): Promise<LaunchTargetRoute> {
  const hasSession = await safeHasSession(authSeam)
  if (hasSession) {
    await markOnboardingCompleted(storage)
    return '/(tabs)/home'
  }

  await clearOnboardingCompleted(storage)
  return '/(auth)/sign-in'
}
