import { KITSUNE_MOTION } from '../theme/tokens.ts'
import type { NavigationDirection } from './navigationHistory.ts'

export const STACK_TRANSITION_DURATION_MS = KITSUNE_MOTION.stackSlide.durationMs
export const STACK_UNDERLAY_PARALLAX_FACTOR = KITSUNE_MOTION.stackSlide.underlayParallaxFactor
export const STACK_EASING_BEZIER = KITSUNE_MOTION.stackSlide.easingBezier

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

export interface BookPageTurnInput {
  readonly screenWidth: number
  readonly progress: number
  readonly nextProgress?: number
  readonly isClosing?: boolean
  readonly actionDirection: NavigationDirection
  readonly reducedMotion?: boolean
}

export interface BookPageTurnMetrics {
  readonly durationMs: number
  readonly easingBezier: readonly [number, number, number, number]
  readonly perspective: number
  readonly focusedTranslateX: number
  readonly unfocusedTranslateX: number
  readonly focusedRotateYDeg: number
  readonly unfocusedRotateYDeg: number
  readonly focusedScale: number
  readonly unfocusedScale: number
  readonly spineShadowOpacity: number
  readonly focusedOpacity: number
  readonly unfocusedOpacity: number
}

/**
 * Pure Kitsune Soft Book Page-Turn kinematics driven by `KITSUNE_MOTION.bookPageTurn`:
 * - `forward`: incoming page turns in from the right (+width -> 0, rotateY -7.5deg -> 0deg)
 *   while the underlying page shifts left with parallax (0.28), subtle 3D fold (+3.5deg), and scale (0.965).
 * - `back`: outgoing page peels away to the right when closing, or incoming page turns in from
 *   the left (-width -> 0, rotateY +7.5deg -> 0deg) for replace/pager transitions.
 * - `reducedMotion`: eliminates 3D rotation, parallax translation, and scale shrink; settles at 0ms.
 */
export function computeBookPageTurnMetrics(
  input: BookPageTurnInput,
): BookPageTurnMetrics {
  const book = KITSUNE_MOTION.bookPageTurn
  const width =
    Number.isFinite(input.screenWidth) && input.screenWidth > 0
      ? input.screenWidth
      : 390
  const progress = clampUnit(input.progress)
  const nextProgress = clampUnit(input.nextProgress ?? 0)

  if (input.reducedMotion) {
    return {
      durationMs: KITSUNE_MOTION.reducedMotion.durationMs,
      easingBezier: book.easingBezier,
      perspective: book.perspective,
      focusedTranslateX: 0,
      unfocusedTranslateX: 0,
      focusedRotateYDeg: 0,
      unfocusedRotateYDeg: 0,
      focusedScale: 1,
      unfocusedScale: 1,
      spineShadowOpacity: 0,
      focusedOpacity: progress,
      unfocusedOpacity: 1,
    }
  }

  const remaining = 1 - progress
  const isClosing = Boolean(input.isClosing)
  const enterFromRight =
    (input.actionDirection === 'forward' && !isClosing) ||
    (input.actionDirection === 'back' && isClosing)

  const focusSign = enterFromRight ? 1 : -1
  const focusedTranslateX = normalizeZero(focusSign * remaining * width)
  const focusedRotateYDeg = normalizeZero(
    focusSign * remaining * book.incomingRotateYDeg,
  )

  const underlayDirection = input.actionDirection === 'forward' ? -1 : 1
  const unfocusedTranslateX = normalizeZero(
    underlayDirection * nextProgress * width * book.underlayParallaxFactor,
  )
  const unfocusedRotateYDeg = normalizeZero(
    -underlayDirection * nextProgress * book.underlayRotateYDeg,
  )
  const unfocusedScale = normalizeZero(
    1 - nextProgress * (1 - book.underlayMinScale),
  )

  const spineShadowOpacity = normalizeZero(
    Math.sin(Math.PI * progress) * book.spineShadowMaxOpacity,
  )

  return {
    durationMs: book.durationMs,
    easingBezier: book.easingBezier,
    perspective: book.perspective,
    focusedTranslateX,
    unfocusedTranslateX,
    focusedRotateYDeg,
    unfocusedRotateYDeg,
    focusedScale: 1,
    unfocusedScale,
    spineShadowOpacity,
    focusedOpacity: 1,
    unfocusedOpacity: 1,
  }
}
