import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  AUTH_BASE_ORB_SIZE,
  AUTH_CARD_DECK_SPEC,
  AUTH_PAGER_MAX_PROGRESS,
  AUTH_REFERENCE_WIDTH,
  authKeyFromStep,
  authStepFromKey,
  buildAuthOrbTracks,
  buildAuthParallaxElements,
  clampAuthProgress,
  computeAuthCardDeckTransform,
  detectAuthSwipeHapticPhase,
  resolveAuthScreenKey,
} from '../authPagerMotion.ts'

describe('Auth Pager Motion Seam (05 <-> 06)', () => {
  it('clamps horizontal pager progress within [0, 1] and guards NaN/Infinity', () => {
    assert.equal(AUTH_PAGER_MAX_PROGRESS, 1)
    assert.equal(clampAuthProgress(-0.4), 0)
    assert.equal(clampAuthProgress(0), 0)
    assert.equal(clampAuthProgress(0.5), 0.5)
    assert.equal(clampAuthProgress(1.8), 1)
    assert.equal(clampAuthProgress(Number.NaN), 0)
    assert.equal(clampAuthProgress(Number.POSITIVE_INFINITY), 0)
  })

  it('maps between AuthScreenKey and AuthScreenStep losslessly', () => {
    assert.equal(authStepFromKey('sign-in'), 0)
    assert.equal(authStepFromKey('create-account'), 1)
    assert.equal(authKeyFromStep(0), 'sign-in')
    assert.equal(authKeyFromStep(1), 'create-account')
    assert.equal(resolveAuthScreenKey('create-account'), 'create-account')
    assert.equal(resolveAuthScreenKey('sign-in'), 'sign-in')
    assert.equal(resolveAuthScreenKey('unexpected'), 'sign-in')
    assert.equal(resolveAuthScreenKey(undefined), 'sign-in')
  })

  it('builds 3 continuous orb tracks calibrated to 390px SVG 05 & 06 geometries', () => {
    const tracks = buildAuthOrbTracks(AUTH_REFERENCE_WIDTH, 0)
    assert.equal(tracks.length, 3)

    const halfBase = AUTH_BASE_ORB_SIZE / 2
    const getVisualBounds = (trackIdx: number, stepIdx: 0 | 1) => {
      const track = tracks[trackIdx]
      const size = track.scale[stepIdx] * AUTH_BASE_ORB_SIZE
      const left = track.translateX[stepIdx] + halfBase - size / 2
      const top = track.translateY[stepIdx] + halfBase - size / 2
      return { left, top, size, opacity: track.opacity[stepIdx] }
    }

    assert.deepEqual(getVisualBounds(0, 0), {
      left: -56,
      top: -6,
      size: 204,
      opacity: 1,
    })
    assert.deepEqual(getVisualBounds(1, 0), {
      left: 196,
      top: 8,
      size: 228,
      opacity: 1,
    })
    assert.equal(Math.round(getVisualBounds(0, 1).size), 384)
  })

  it('offsets orb translateX cleanly when frame is centered inside wider viewports', () => {
    const baseTracks = buildAuthOrbTracks(390, 0)
    const wideTracks = buildAuthOrbTracks(390, 180)

    for (let i = 0; i < baseTracks.length; i += 1) {
      for (const step of [0, 1] as const) {
        assert.equal(
          wideTracks[i].translateX[step],
          baseTracks[i].translateX[step] + 180
        )
        assert.equal(wideTracks[i].translateY[step], baseTracks[i].translateY[step])
        assert.equal(wideTracks[i].scale[step], baseTracks[i].scale[step])
      }
    }
  })

  it('builds finite parallax micro-elements that peak mid-transition (progress = 0.5)', () => {
    const elements = buildAuthParallaxElements(AUTH_REFERENCE_WIDTH)
    assert.ok(elements.length >= 6)

    for (const el of elements) {
      assert.deepEqual(el.inputRange, [0, 0.5, 1])
      assert.ok(el.size > 0)
      assert.ok(el.color.startsWith('#') || el.color.startsWith('rgba('))
      for (const idx of [0, 1, 2] as const) {
        assert.ok(Number.isFinite(el.translateX[idx]))
        assert.ok(Number.isFinite(el.translateY[idx]))
        assert.ok(Number.isFinite(el.rotateDeg[idx]))
        assert.ok(Number.isFinite(el.scale[idx]) && el.scale[idx] > 0)
        assert.ok(el.opacity[idx] >= 0 && el.opacity[idx] <= 1)
      }
      assert.ok(
        el.opacity[1] >= Math.min(el.opacity[0], el.opacity[2]),
        `${el.id} should remain clearly visible mid-transition`
      )
    }

    const safeFallback = buildAuthParallaxElements(-10)
    assert.equal(safeFallback.length, elements.length)
  })

  it('computes neutral identity flashcard deck transforms when page is centered at rest', () => {
    const signInAtRest = computeAuthCardDeckTransform(0, 0)
    assert.deepEqual(signInAtRest, {
      scale: 1,
      rotateZDeg: 0,
      rotateYDeg: 0,
      translateX: 0,
      translateY: 0,
      opacity: 1,
    })

    const createAccountAtRest = computeAuthCardDeckTransform(1, 1)
    assert.deepEqual(createAccountAtRest, {
      scale: 1,
      rotateZDeg: 0,
      rotateYDeg: 0,
      translateX: 0,
      translateY: 0,
      opacity: 1,
    })
  })

  it('keeps symmetric vertical height/scale/opacity and opposite lateral tilt at midpoint (progress = 0.5)', () => {
    const leftCard = computeAuthCardDeckTransform(0.5, 0)
    const rightCard = computeAuthCardDeckTransform(0.5, 1)

    assert.equal(leftCard.scale, AUTH_CARD_DECK_SPEC.midScale)
    assert.equal(rightCard.scale, AUTH_CARD_DECK_SPEC.midScale)
    assert.equal(leftCard.translateY, AUTH_CARD_DECK_SPEC.midTranslateY)
    assert.equal(rightCard.translateY, AUTH_CARD_DECK_SPEC.midTranslateY)
    assert.equal(leftCard.opacity, AUTH_CARD_DECK_SPEC.midOpacity)
    assert.equal(rightCard.opacity, AUTH_CARD_DECK_SPEC.midOpacity)

    assert.equal(leftCard.rotateZDeg, -AUTH_CARD_DECK_SPEC.midRotateZDeg)
    assert.equal(rightCard.rotateZDeg, AUTH_CARD_DECK_SPEC.midRotateZDeg)
    assert.equal(leftCard.rotateYDeg, AUTH_CARD_DECK_SPEC.midRotateYDeg)
    assert.equal(rightCard.rotateYDeg, -AUTH_CARD_DECK_SPEC.midRotateYDeg)
    assert.equal(leftCard.translateX, AUTH_CARD_DECK_SPEC.midTranslateX)
    assert.equal(rightCard.translateX, -AUTH_CARD_DECK_SPEC.midTranslateX)
  })

  it('interpolates smoothly at quarter progress and reaches full off-screen card depth bounds', () => {
    const quarterSignIn = computeAuthCardDeckTransform(0.25, 0)
    assert.equal(quarterSignIn.scale, 0.984)
    assert.equal(quarterSignIn.translateY, 3)
    assert.equal(quarterSignIn.opacity, 0.95)
    assert.equal(quarterSignIn.rotateZDeg, -0.55)
    assert.equal(quarterSignIn.rotateYDeg, 1.5)
    assert.equal(quarterSignIn.translateX, 4)

    const offscreenSignIn = computeAuthCardDeckTransform(1, 0)
    assert.deepEqual(offscreenSignIn, {
      scale: AUTH_CARD_DECK_SPEC.minScale,
      rotateZDeg: -AUTH_CARD_DECK_SPEC.maxRotateZDeg,
      rotateYDeg: AUTH_CARD_DECK_SPEC.maxRotateYDeg,
      translateX: AUTH_CARD_DECK_SPEC.maxTranslateX,
      translateY: AUTH_CARD_DECK_SPEC.maxTranslateY,
      opacity: AUTH_CARD_DECK_SPEC.minOpacity,
    })

    const offscreenCreate = computeAuthCardDeckTransform(0, 1)
    assert.deepEqual(offscreenCreate, {
      scale: AUTH_CARD_DECK_SPEC.minScale,
      rotateZDeg: AUTH_CARD_DECK_SPEC.maxRotateZDeg,
      rotateYDeg: -AUTH_CARD_DECK_SPEC.maxRotateYDeg,
      translateX: -AUTH_CARD_DECK_SPEC.maxTranslateX,
      translateY: AUTH_CARD_DECK_SPEC.maxTranslateY,
      opacity: AUTH_CARD_DECK_SPEC.minOpacity,
    })
  })

  it('detects 3-stage soft haptic swipe phases across lift, midpoint, and settle thresholds', () => {
    assert.equal(detectAuthSwipeHapticPhase(0, 0.05), 'lift')
    assert.equal(detectAuthSwipeHapticPhase(1, 0.95), 'lift')

    assert.equal(detectAuthSwipeHapticPhase(0.47, 0.51), 'midpoint')
    assert.equal(detectAuthSwipeHapticPhase(0.52, 0.49), 'midpoint')

    assert.equal(detectAuthSwipeHapticPhase(0.05, 0.01), 'settle')
    assert.equal(detectAuthSwipeHapticPhase(0.95, 0.99), 'settle')

    assert.equal(detectAuthSwipeHapticPhase(0.15, 0.25), 'none')
    assert.equal(detectAuthSwipeHapticPhase(0, 0), 'none')
    assert.equal(detectAuthSwipeHapticPhase(1, 1), 'none')
  })
})
