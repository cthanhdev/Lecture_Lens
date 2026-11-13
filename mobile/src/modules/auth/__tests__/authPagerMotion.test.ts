import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  AUTH_BASE_ORB_SIZE,
  AUTH_PAGER_MAX_PROGRESS,
  AUTH_REFERENCE_WIDTH,
  authKeyFromStep,
  authStepFromKey,
  buildAuthOrbTracks,
  buildAuthParallaxElements,
  clampAuthProgress,
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
})
