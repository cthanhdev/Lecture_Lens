// Persistence Seam for Onboarding completion state via KeyValueStorage
import type { KeyValueStorage } from '../storage/types.ts'

export const ONBOARDING_STORAGE_KEY = 'lecturelens.onboarding.completed'

/**
 * Checks whether the student has completed the onboarding carousel.
 * Fails safe to `false` if storage reads throw or contain unexpected data.
 */
export async function isOnboardingCompleted(
  storage: KeyValueStorage
): Promise<boolean> {
  try {
    const raw = await storage.getItem(ONBOARDING_STORAGE_KEY)
    return raw === 'true'
  } catch {
    return false
  }
}

/**
 * Marks onboarding as completed via the KeyValueStorage seam.
 */
export async function markOnboardingCompleted(
  storage: KeyValueStorage
): Promise<void> {
  await storage.setItem(ONBOARDING_STORAGE_KEY, 'true')
}
