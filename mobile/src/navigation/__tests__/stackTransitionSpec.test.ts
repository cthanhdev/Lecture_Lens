import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  STACK_EASING_BEZIER,
  STACK_TRANSITION_DURATION_MS,
  STACK_UNDERLAY_PARALLAX_FACTOR,
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
