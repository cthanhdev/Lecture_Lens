// Pure Deep Module computing continuous scroll-linked backdrop orb keyframes
// Zero React Native / Reanimated imports — 100% testable through Node test runner.

export const BACKDROP_BASE_ORB_SIZE = 240
export const BACKDROP_REFERENCE_WIDTH = 390
export const ONBOARDING_MAX_PROGRESS = 2

export interface OnboardingOrbInterpolationSpec {
  id: 'orb-coral-sakura' | 'orb-mist-peach' | 'orb-blush-accent'
  inputRange: readonly [0, 1, 2]
  translateX: readonly [number, number, number]
  translateY: readonly [number, number, number]
  scale: readonly [number, number, number]
  opacity: readonly [number, number, number]
  colors: readonly [string, string, string]
}

interface OrbKeyframe {
  leftOn390: number
  top: number
  size: number
  color: string
  opacity: number
}

interface OrbTrackTemplate {
  id: OnboardingOrbInterpolationSpec['id']
  keyframes: readonly [OrbKeyframe, OrbKeyframe, OrbKeyframe]
}

// Each persistent orb flows organically across Step 1 (0) -> Step 2 (1) -> Step 3 (2).
// Right-anchored SVGs on 390px are normalized to leftOn390 = 390 - right - size.
const ONBOARDING_ORB_TEMPLATES: readonly [
  OrbTrackTemplate,
  OrbTrackTemplate,
  OrbTrackTemplate,
] = [
  {
    id: 'orb-coral-sakura',
    keyframes: [
      { leftOn390: 51, top: -54, size: 288, color: 'rgba(244, 127, 114, 0.20)', opacity: 1 },
      { leftOn390: -58, top: 92, size: 208, color: 'rgba(253, 203, 209, 0.42)', opacity: 1 },
      { leftOn390: -44, top: 24, size: 220, color: 'rgba(253, 203, 209, 0.55)', opacity: 1 },
    ],
  },
  {
    id: 'orb-mist-peach',
    keyframes: [
      { leftOn390: -56, top: 112, size: 224, color: 'rgba(162, 205, 225, 0.30)', opacity: 1 },
      { leftOn390: 214, top: 224, size: 224, color: 'rgba(190, 233, 253, 0.55)', opacity: 1 },
      { leftOn390: 224, top: 184, size: 204, color: 'rgba(255, 218, 213, 0.48)', opacity: 1 },
    ],
  },
  {
    id: 'orb-blush-accent',
    keyframes: [
      { leftOn390: 214, top: 176, size: 240, color: 'rgba(253, 203, 209, 0.28)', opacity: 1 },
      { leftOn390: 96, top: 178, size: 192, color: 'rgba(255, 180, 170, 0.30)', opacity: 1 },
      { leftOn390: 111, top: 260, size: 168, color: 'rgba(245, 195, 201, 0.20)', opacity: 0 },
    ],
  },
]

const ORB_INPUT_RANGE: readonly [0, 1, 2] = [0, 1, 2]

/** Clamp horizontal pager progress strictly inside [0, 2]. */
export function clampOnboardingProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0
  if (progress <= 0) return 0
  if (progress >= ONBOARDING_MAX_PROGRESS) return ONBOARDING_MAX_PROGRESS
  return progress
}

function projectKeyframe(
  keyframe: OrbKeyframe,
  widthScale: number,
  stageOffsetX: number
): { translateX: number; translateY: number; scale: number } {
  const halfBase = BACKDROP_BASE_ORB_SIZE / 2
  const scaledSize = keyframe.size * widthScale
  const scaledLeft = stageOffsetX + keyframe.leftOn390 * widthScale
  const centerX = scaledLeft + scaledSize / 2
  const centerY = keyframe.top + scaledSize / 2

  return {
    translateX: centerX - halfBase,
    translateY: centerY - halfBase,
    scale: scaledSize / BACKDROP_BASE_ORB_SIZE,
  }
}

/**
 * Convert reference 390px orb keyframes into Reanimated interpolation vectors
 * positioned around the centered mobile stage.
 */
export function buildOnboardingOrbTracks(
  frameWidth: number,
  stageOffsetX = 0
): readonly OnboardingOrbInterpolationSpec[] {
  const safeFrameWidth =
    Number.isFinite(frameWidth) && frameWidth > 0
      ? frameWidth
      : BACKDROP_REFERENCE_WIDTH
  const safeStageOffsetX = Number.isFinite(stageOffsetX) ? stageOffsetX : 0
  const widthScale = Math.max(0.5, safeFrameWidth / BACKDROP_REFERENCE_WIDTH)

  return ONBOARDING_ORB_TEMPLATES.map((template) => {
    const [k0, k1, k2] = template.keyframes
    const p0 = projectKeyframe(k0, widthScale, safeStageOffsetX)
    const p1 = projectKeyframe(k1, widthScale, safeStageOffsetX)
    const p2 = projectKeyframe(k2, widthScale, safeStageOffsetX)

    return {
      id: template.id,
      inputRange: ORB_INPUT_RANGE,
      translateX: [p0.translateX, p1.translateX, p2.translateX],
      translateY: [p0.translateY, p1.translateY, p2.translateY],
      scale: [p0.scale, p1.scale, p2.scale],
      opacity: [k0.opacity, k1.opacity, k2.opacity],
      colors: [k0.color, k1.color, k2.color],
    }
  })
}
