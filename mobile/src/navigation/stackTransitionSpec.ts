export const STACK_TRANSITION_DURATION_MS = 280
export const STACK_UNDERLAY_PARALLAX_FACTOR = 0.25
export const STACK_EASING_BEZIER = [0.22, 1, 0.36, 1] as const

export interface DirectionalSlideInput {
  readonly screenWidth: number
  readonly progress: number
  readonly nextProgress?: number
  readonly isClosing: boolean
}

export interface DirectionalSlideMetrics {
  readonly focusedTranslateX: number
  readonly unfocusedTranslateX: number
  readonly scale: number
  readonly opacity: number
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value
}

/**
 * Pure directional horizontal slide kinematics for Stack routes:
 * - Forward push (isClosing = false): incoming page enters from +screenWidth -> 0.
 * - Backward pop/dismiss (isClosing = true): outgoing page exits completely LEFT (0 -> -screenWidth).
 * - Never animates scale (fixed at 1) to eliminate center-point shrink/collapse artifacts.
 */
export function computeDirectionalSlideMetrics(
  input: DirectionalSlideInput,
): DirectionalSlideMetrics {
  const width =
    Number.isFinite(input.screenWidth) && input.screenWidth > 0
      ? input.screenWidth
      : 390
  const progress = clampUnit(input.progress)
  const nextProgress = clampUnit(input.nextProgress ?? 0)

  const delta = (1 - progress) * width
  const focusedTranslateX = normalizeZero(
    input.isClosing ? -delta : delta,
  )
  const unfocusedTranslateX = normalizeZero(
    -nextProgress * width * STACK_UNDERLAY_PARALLAX_FACTOR,
  )

  return {
    focusedTranslateX,
    unfocusedTranslateX,
    scale: 1,
    opacity: 1,
  }
}

export function resolveReplaceAnimationType(
  direction?: 'push' | 'pop' | 'forward' | 'back' | null,
): 'push' | 'pop' {
  if (direction === 'back' || direction === 'pop') {
    return 'pop'
  }
  return 'push'
}
