import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  STACK_EASING_BEZIER,
  STACK_TRANSITION_DURATION_MS,
  STACK_UNDERLAY_PARALLAX_FACTOR,
  computeBookPageTurnMetrics,
  computeDirectionalSlideMetrics,
  resolveReplaceAnimationType,
} from '../stackTransitionSpec.ts'

describe('Stack Directional Transition Spec (Slide Page Left on Back)', () => {
  it('defines smooth 280ms Kitsune cubic-bezier timing constants', () => {
    assert.equal(STACK_TRANSITION_DURATION_MS, 280)
    assert.equal(STACK_UNDERLAY_PARALLAX_FACTOR, 0.25)
    assert.deepEqual(STACK_EASING_BEZIER, [0.22, 1, 0.36, 1])
  })

  it('slides incoming screen in from the right (+width -> 0) with scale=1 when pushing forward', () => {
    const start = computeDirectionalSlideMetrics({
      screenWidth: 390,
      progress: 0,
      nextProgress: 0,
      isClosing: false,
    })
    assert.deepEqual(start, {
      focusedTranslateX: 390,
      unfocusedTranslateX: 0,
      scale: 1,
      opacity: 1,
    })

    const mid = computeDirectionalSlideMetrics({
      screenWidth: 390,
      progress: 0.5,
      nextProgress: 0,
      isClosing: false,
    })
    assert.deepEqual(mid, {
      focusedTranslateX: 195,
      unfocusedTranslateX: 0,
      scale: 1,
      opacity: 1,
    })

    const settledCovered = computeDirectionalSlideMetrics({
      screenWidth: 390,
      progress: 1,
      nextProgress: 1,
      isClosing: false,
    })
    assert.deepEqual(settledCovered, {
      focusedTranslateX: 0,
      unfocusedTranslateX: -97.5,
      scale: 1,
      opacity: 1,
    })
  })

  it('slides outgoing screen completely to the left (0 -> -width) with scale=1 when going back', () => {
    const startBack = computeDirectionalSlideMetrics({
      screenWidth: 390,
      progress: 1,
      nextProgress: 0,
      isClosing: true,
    })
    assert.deepEqual(startBack, {
      focusedTranslateX: 0,
      unfocusedTranslateX: 0,
      scale: 1,
      opacity: 1,
    })

    const midBack = computeDirectionalSlideMetrics({
      screenWidth: 390,
      progress: 0.5,
      nextProgress: 0,
      isClosing: true,
    })
    assert.deepEqual(midBack, {
      focusedTranslateX: -195,
      unfocusedTranslateX: 0,
      scale: 1,
      opacity: 1,
    })

    const endBack = computeDirectionalSlideMetrics({
      screenWidth: 390,
      progress: 0,
      nextProgress: 0,
      isClosing: true,
    })
    assert.deepEqual(endBack, {
      focusedTranslateX: -390,
      unfocusedTranslateX: 0,
      scale: 1,
      opacity: 1,
    })

    // Underlying screen returns from parallax -97.5 -> 0 as top screen closes
    const revealed = computeDirectionalSlideMetrics({
      screenWidth: 390,
      progress: 1,
      nextProgress: 0.5,
      isClosing: false,
    })
    assert.equal(revealed.unfocusedTranslateX, -48.75)
    assert.equal(revealed.scale, 1)
  })

  it('resolves replace animation type cleanly for back vs forward directions', () => {
    assert.equal(resolveReplaceAnimationType('back'), 'pop')
    assert.equal(resolveReplaceAnimationType('pop'), 'pop')
    assert.equal(resolveReplaceAnimationType('forward'), 'push')
    assert.equal(resolveReplaceAnimationType('push'), 'push')
    assert.equal(resolveReplaceAnimationType(null), 'push')
    assert.equal(resolveReplaceAnimationType(undefined), 'push')
  })
})

describe('Book Page-Turn Transition Spec (KITSUNE_MOTION.bookPageTurn)', () => {
  it('computes forward book page-turn kinematics and underlay parallax/tilt', () => {
    const start = computeBookPageTurnMetrics({
      screenWidth: 390,
      progress: 0,
      nextProgress: 0,
      isClosing: false,
      actionDirection: 'forward',
    })
    assert.equal(start.durationMs, 320)
    assert.deepEqual(start.easingBezier, [0.22, 1, 0.36, 1])
    assert.equal(start.perspective, 1100)
    assert.equal(start.focusedTranslateX, 390)
    assert.equal(start.focusedRotateYDeg, -7.5)
    assert.equal(start.focusedScale, 1)
    assert.equal(start.spineShadowOpacity, 0)

    const mid = computeBookPageTurnMetrics({
      screenWidth: 390,
      progress: 0.5,
      nextProgress: 0,
      isClosing: false,
      actionDirection: 'forward',
    })
    assert.equal(mid.focusedTranslateX, 195)
    assert.equal(mid.focusedRotateYDeg, -3.75)
    assert.ok(Math.abs(mid.spineShadowOpacity - 0.14) < 1e-9)

    const covered = computeBookPageTurnMetrics({
      screenWidth: 390,
      progress: 1,
      nextProgress: 1,
      isClosing: false,
      actionDirection: 'forward',
    })
    assert.equal(covered.focusedTranslateX, 0)
    assert.equal(covered.focusedRotateYDeg, 0)
    assert.ok(Math.abs(covered.unfocusedTranslateX - -109.2) < 1e-6)
    assert.equal(covered.unfocusedRotateYDeg, 3.5)
    assert.equal(covered.unfocusedScale, 0.965)
    assert.ok(covered.spineShadowOpacity < 1e-9)
  })

  it('computes backward book page-turn metrics for closing stack cards and left-entering replace/pager pages', () => {
    // Closing stack card peels right (0 -> +390, 0 -> -7.5deg)
    const closingMid = computeBookPageTurnMetrics({
      screenWidth: 390,
      progress: 0.5,
      isClosing: true,
      actionDirection: 'back',
    })
    assert.equal(closingMid.focusedTranslateX, 195)
    assert.equal(closingMid.focusedRotateYDeg, -3.75)

    // Left-entering page for back replace / pager (-390 -> 0, +7.5deg -> 0deg)
    const backStart = computeBookPageTurnMetrics({
      screenWidth: 390,
      progress: 0,
      isClosing: false,
      actionDirection: 'back',
    })
    assert.equal(backStart.focusedTranslateX, -390)
    assert.equal(backStart.focusedRotateYDeg, 7.5)

    const backSettled = computeBookPageTurnMetrics({
      screenWidth: 390,
      progress: 1,
      isClosing: false,
      actionDirection: 'back',
    })
    assert.equal(backSettled.focusedTranslateX, 0)
    assert.equal(backSettled.focusedRotateYDeg, 0)
  })

  it('eliminates 3D rotation, parallax, and duration when reducedMotion is enabled', () => {
    const reduced = computeBookPageTurnMetrics({
      screenWidth: 390,
      progress: 0.5,
      nextProgress: 0.5,
      isClosing: false,
      actionDirection: 'forward',
      reducedMotion: true,
    })
    assert.equal(reduced.durationMs, 0)
    assert.equal(reduced.focusedTranslateX, 0)
    assert.equal(reduced.unfocusedTranslateX, 0)
    assert.equal(reduced.focusedRotateYDeg, 0)
    assert.equal(reduced.unfocusedRotateYDeg, 0)
    assert.equal(reduced.focusedScale, 1)
    assert.equal(reduced.unfocusedScale, 1)
    assert.equal(reduced.spineShadowOpacity, 0)
    assert.equal(reduced.focusedOpacity, 0.5)
  })
})
