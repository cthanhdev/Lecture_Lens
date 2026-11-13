// Pure Deep Module computing continuous swipe-linked backdrop & micro-element motion for Auth (05 <-> 06).
// Zero React Native / Reanimated imports — 100% unit-testable through Node test runner.

export const AUTH_PAGER_MAX_PROGRESS = 1
export const AUTH_REFERENCE_WIDTH = 390
export const AUTH_BASE_ORB_SIZE = 220

export type AuthScreenKey = 'sign-in' | 'create-account'
export type AuthScreenStep = 0 | 1

export interface AuthOrbInterpolationSpec {
  id: 'orb-sakura-wash' | 'orb-coral-glow' | 'orb-blush-crown'
  baseHex: string
  peakOpacity: number
  inputRange: readonly [0, 1]
  translateX: readonly [number, number]
  translateY: readonly [number, number]
  scale: readonly [number, number]
  opacity: readonly [number, number]
  colors: readonly [string, string]
}

export interface AuthParallaxElementSpec {
  id: string
  kind: 'petal' | 'sparkle' | 'dew-dot'
  size: number
  color: string
  inputRange: readonly [0, 0.5, 1]
  translateX: readonly [number, number, number]
  translateY: readonly [number, number, number]
  rotateDeg: readonly [number, number, number]
  scale: readonly [number, number, number]
  opacity: readonly [number, number, number]
}

interface OrbKeyframe {
  leftOn390: number
  top: number
  size: number
  color: string
  opacity: number
}

interface AuthOrbTrackTemplate {
  id: AuthOrbInterpolationSpec['id']
  baseHex: string
  peakOpacity: number
  keyframes: readonly [OrbKeyframe, OrbKeyframe]
}

interface ParallaxElementTemplate {
  id: string
  kind: AuthParallaxElementSpec['kind']
  size: number
  color: string
  leftOn390: readonly [number, number, number]
  top: readonly [number, number, number]
  rotateDeg: readonly [number, number, number]
  scale: readonly [number, number, number]
  opacity: readonly [number, number, number]
}

// Calibrated to 05 - Auth - Sign In.svg (0) and 06 - Auth - Create Account.svg (1).
const AUTH_ORB_TEMPLATES: readonly [
  AuthOrbTrackTemplate,
  AuthOrbTrackTemplate,
  AuthOrbTrackTemplate,
] = [
  {
    id: 'orb-sakura-wash',
    baseHex: '#FDCBD1',
    peakOpacity: 0.62,
    keyframes: [
      { leftOn390: -56, top: -6, size: 204, color: 'rgba(253, 203, 209, 0.42)', opacity: 1 },
      { leftOn390: 3, top: -24, size: 384, color: 'rgba(253, 203, 209, 0.50)', opacity: 0.96 },
    ],
  },
  {
    id: 'orb-coral-glow',
    baseHex: '#F47F72',
    peakOpacity: 0.34,
    keyframes: [
      { leftOn390: 196, top: 8, size: 228, color: 'rgba(244, 127, 114, 0.22)', opacity: 1 },
      { leftOn390: 238, top: 96, size: 192, color: 'rgba(244, 127, 114, 0.16)', opacity: 0.88 },
    ],
  },
  {
    id: 'orb-blush-crown',
    baseHex: '#F5C3C9',
    peakOpacity: 0.44,
    keyframes: [
      { leftOn390: 84, top: -82, size: 222, color: 'rgba(245, 195, 201, 0.30)', opacity: 0.92 },
      { leftOn390: -60, top: 108, size: 184, color: 'rgba(255, 212, 218, 0.34)', opacity: 0.94 },
    ],
  },
]

const PARALLAX_ELEMENT_TEMPLATES: readonly ParallaxElementTemplate[] = [
  {
    id: 'auth-petal-upper-left',
    kind: 'petal',
    size: 13,
    color: '#FDCBD1',
    leftOn390: [42, 68, 34],
    top: [112, 98, 122],
    rotateDeg: [-28, 14, -18],
    scale: [1, 1.2, 0.96],
    opacity: [0.76, 0.92, 0.72],
  },
  {
    id: 'auth-petal-upper-right',
    kind: 'petal',
    size: 11,
    color: '#F47F72',
    leftOn390: [316, 284, 330],
    top: [130, 116, 146],
    rotateDeg: [24, -16, 36],
    scale: [0.95, 1.24, 1.02],
    opacity: [0.66, 0.86, 0.64],
  },
  {
    id: 'auth-petal-hero-left',
    kind: 'petal',
    size: 11,
    color: '#EBBAC0',
    leftOn390: [64, 46, 78],
    top: [204, 190, 186],
    rotateDeg: [18, 48, 22],
    scale: [0.92, 1.18, 1],
    opacity: [0.62, 0.84, 0.68],
  },
  {
    id: 'auth-petal-hero-right',
    kind: 'petal',
    size: 12,
    color: '#FDCBD1',
    leftOn390: [298, 256, 310],
    top: [212, 198, 222],
    rotateDeg: [-22, -52, -16],
    scale: [1, 1.22, 0.95],
    opacity: [0.74, 0.9, 0.76],
  },
  {
    id: 'auth-sparkle-coral',
    kind: 'sparkle',
    size: 10,
    color: '#F47F72',
    leftOn390: [120, 194, 268],
    top: [108, 92, 110],
    rotateDeg: [0, 45, 90],
    scale: [0.75, 1.25, 0.8],
    opacity: [0.46, 0.88, 0.48],
  },
  {
    id: 'auth-dew-dot-accent',
    kind: 'dew-dot',
    size: 6,
    color: '#F5C3C9',
    leftOn390: [256, 186, 114],
    top: [164, 152, 166],
    rotateDeg: [0, 0, 0],
    scale: [0.85, 1.35, 0.9],
    opacity: [0.58, 0.92, 0.6],
  },
]

/** Clamp horizontal pager progress strictly inside [0, 1]. */
export function clampAuthProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0
  if (progress <= 0) return 0
  if (progress >= AUTH_PAGER_MAX_PROGRESS) return AUTH_PAGER_MAX_PROGRESS
  return progress
}

export function authStepFromKey(screen: AuthScreenKey): AuthScreenStep {
  return screen === 'create-account' ? 1 : 0
}

export function authKeyFromStep(step: AuthScreenStep): AuthScreenKey {
  return step === 1 ? 'create-account' : 'sign-in'
}

export function resolveAuthScreenKey(raw: string | undefined): AuthScreenKey {
  return raw === 'create-account' ? 'create-account' : 'sign-in'
}

function projectOrbKeyframe(
  keyframe: OrbKeyframe,
  widthScale: number,
  stageOffsetX: number
): { translateX: number; translateY: number; scale: number } {
  const halfBase = AUTH_BASE_ORB_SIZE / 2
  const scaledSize = keyframe.size * widthScale
  const scaledLeft = stageOffsetX + keyframe.leftOn390 * widthScale
  const centerX = scaledLeft + scaledSize / 2
  const centerY = keyframe.top + scaledSize / 2

  return {
    translateX: centerX - halfBase,
    translateY: centerY - halfBase,
    scale: scaledSize / AUTH_BASE_ORB_SIZE,
  }
}

/**
 * Compute continuous scroll-linked orb tracks across Sign In (0) and Create Account (1).
 */
export function buildAuthOrbTracks(
  frameWidth: number,
  stageOffsetX = 0
): readonly AuthOrbInterpolationSpec[] {
  const safeFrameWidth =
    Number.isFinite(frameWidth) && frameWidth > 0
      ? frameWidth
      : AUTH_REFERENCE_WIDTH
  const safeStageOffsetX = Number.isFinite(stageOffsetX) ? stageOffsetX : 0
  const widthScale = Math.max(0.5, safeFrameWidth / AUTH_REFERENCE_WIDTH)

  return AUTH_ORB_TEMPLATES.map((template) => {
    const [k0, k1] = template.keyframes
    const p0 = projectOrbKeyframe(k0, widthScale, safeStageOffsetX)
    const p1 = projectOrbKeyframe(k1, widthScale, safeStageOffsetX)

    return {
      id: template.id,
      baseHex: template.baseHex,
      peakOpacity: template.peakOpacity,
      inputRange: [0, 1],
      translateX: [p0.translateX, p1.translateX],
      translateY: [p0.translateY, p1.translateY],
      scale: [p0.scale, p1.scale],
      opacity: [k0.opacity, k1.opacity],
      colors: [k0.color, k1.color],
    }
  })
}

/**
 * Compute continuous 3-point parallax tracks for small decorative petals & sparkles during 05 <-> 06 transitions.
 */
export function buildAuthParallaxElements(
  frameWidth: number
): readonly AuthParallaxElementSpec[] {
  const safeFrameWidth =
    Number.isFinite(frameWidth) && frameWidth > 0
      ? frameWidth
      : AUTH_REFERENCE_WIDTH
  const widthScale = Math.max(0.5, safeFrameWidth / AUTH_REFERENCE_WIDTH)

  return PARALLAX_ELEMENT_TEMPLATES.map((template) => ({
    id: template.id,
    kind: template.kind,
    size: template.size,
    color: template.color,
    inputRange: [0, 0.5, 1],
    translateX: [
      template.leftOn390[0] * widthScale,
      template.leftOn390[1] * widthScale,
      template.leftOn390[2] * widthScale,
    ],
    translateY: [...template.top] as [number, number, number],
    rotateDeg: [...template.rotateDeg] as [number, number, number],
    scale: [...template.scale] as [number, number, number],
    opacity: [...template.opacity] as [number, number, number],
  }))
}
