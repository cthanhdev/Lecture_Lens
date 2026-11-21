export const DEFAULT_BACK_EXIT_WINDOW_MS = 2000

/**
 * Tab Anchor double-back exit guard for Home Study Hub.
 * Returns true only when the second back press occurs within windowMs of the first.
 */
export function shouldExitOnBack(
  lastPressAt: number | null,
  now: number,
  windowMs: number = DEFAULT_BACK_EXIT_WINDOW_MS,
): boolean {
  if (lastPressAt === null || !Number.isFinite(lastPressAt)) {
    return false
  }
  const elapsed = now - lastPressAt
  return elapsed >= 0 && elapsed <= windowMs
}
