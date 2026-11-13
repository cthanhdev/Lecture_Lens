import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  BACKDROP_BASE_ORB_SIZE,
  BACKDROP_REFERENCE_WIDTH,
  buildOnboardingOrbTracks,
  clampOnboardingProgress,
} from '../backdropMotion.ts'

describe('Onboarding Backdrop Motion Seam', () => {
  it('chặn tiến độ lướt hợp lệ trong đoạn [0, 2] và chống NaN/Infinity', () => {
    assert.equal(clampOnboardingProgress(-0.5), 0)
    assert.equal(clampOnboardingProgress(0), 0)
    assert.equal(clampOnboardingProgress(0.625), 0.625)
    assert.equal(clampOnboardingProgress(1.5), 1.5)
    assert.equal(clampOnboardingProgress(2.8), 2)
    assert.equal(clampOnboardingProgress(Number.NaN), 0)
    assert.equal(clampOnboardingProgress(Number.POSITIVE_INFINITY), 0)
  })

  it('tạo đúng 3 orb track liên tục khớp tọa độ SVG gốc tại màn tham chiếu 390px', () => {
    const tracks = buildOnboardingOrbTracks(BACKDROP_REFERENCE_WIDTH, 0)
    assert.equal(tracks.length, 3)

    const halfBase = BACKDROP_BASE_ORB_SIZE / 2
    const getVisualBounds = (trackIdx: number, stepIdx: 0 | 1 | 2) => {
      const track = tracks[trackIdx]
      const size = track.scale[stepIdx] * BACKDROP_BASE_ORB_SIZE
      const left = track.translateX[stepIdx] + halfBase - size / 2
      const top = track.translateY[stepIdx] + halfBase - size / 2
      return { left, top, size, opacity: track.opacity[stepIdx] }
    }

    // Step 1: top coral (51, -54, 288), mist left (-56, 112, 224), sakura right (214, 176, 240)
    assert.deepEqual(getVisualBounds(0, 0), { left: 51, top: -54, size: 288, opacity: 1 })
    assert.deepEqual(getVisualBounds(1, 0), { left: -56, top: 112, size: 224, opacity: 1 })
    assert.deepEqual(getVisualBounds(2, 0), { left: 214, top: 176, size: 240, opacity: 1 })

    // Step 2: sakura left (-58, 92, 208), sky right (214, 224, 224), coral center (96, 178, 192)
    assert.deepEqual(getVisualBounds(0, 1), { left: -58, top: 92, size: 208, opacity: 1 })
    assert.deepEqual(getVisualBounds(1, 1), { left: 214, top: 224, size: 224, opacity: 1 })
    assert.deepEqual(getVisualBounds(2, 1), { left: 96, top: 178, size: 192, opacity: 1 })

    // Step 3: sakura left (-44, 24, 220), peach right (224, 184, 204), orb thứ 3 mờ dần về 0
    assert.deepEqual(getVisualBounds(0, 2), { left: -44, top: 24, size: 220, opacity: 1 })
    assert.deepEqual(getVisualBounds(1, 2), { left: 224, top: 184, size: 204, opacity: 1 })
    assert.equal(getVisualBounds(2, 2).opacity, 0)
  })

  it('căn giữa đúng stageOffsetX trên màn hình rộng mà giữ nguyên scale/translateY', () => {
    const baseTracks = buildOnboardingOrbTracks(390, 0)
    const centeredTracks = buildOnboardingOrbTracks(390, 200)

    for (let i = 0; i < 3; i += 1) {
      for (const step of [0, 1, 2] as const) {
        assert.equal(
          centeredTracks[i].translateX[step],
          baseTracks[i].translateX[step] + 200
        )
        assert.equal(centeredTracks[i].translateY[step], baseTracks[i].translateY[step])
        assert.equal(centeredTracks[i].scale[step], baseTracks[i].scale[step])
      }
    }
  })

  it('bảo toàn giá trị hữu hạn hợp lệ khi frameWidth không hợp lệ (<= 0 hoặc NaN)', () => {
    const fallbackTracks = buildOnboardingOrbTracks(0, Number.NaN)
    assert.equal(fallbackTracks.length, 3)

    for (const track of fallbackTracks) {
      assert.deepEqual(track.inputRange, [0, 1, 2])
      for (const step of [0, 1, 2] as const) {
        assert.ok(Number.isFinite(track.translateX[step]))
        assert.ok(Number.isFinite(track.translateY[step]))
        assert.ok(Number.isFinite(track.scale[step]) && track.scale[step] > 0)
        assert.ok(track.opacity[step] >= 0 && track.opacity[step] <= 1)
        assert.ok(track.colors[step].startsWith('rgba('))
      }
    }
  })
})
