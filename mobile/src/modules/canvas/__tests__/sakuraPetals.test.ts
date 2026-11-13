import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  SAKURA_PETAL_PALETTE,
  SAKURA_PETAL_SVG_PATH,
  SAKURA_PETALS,
} from '../sakuraPetals.ts'

describe('Sakura Falling Petals Geometry & Physics Spec', () => {
  it('defines a closed SVG teardrop petal silhouette matching Kitsune Soft curves', () => {
    assert.ok(SAKURA_PETAL_SVG_PATH.startsWith('M '))
    assert.ok(SAKURA_PETAL_SVG_PATH.includes('C '))
    assert.ok(SAKURA_PETAL_SVG_PATH.endsWith('Z'))
  })

  it('provides balanced depth-layered falling petals across Kitsune Soft colors', () => {
    assert.ok(SAKURA_PETALS.length >= 12)
    const paletteSet = new Set<string>(SAKURA_PETAL_PALETTE)
    const usedColors = new Set<string>()

    for (const petal of SAKURA_PETALS) {
      assert.ok(paletteSet.has(petal.color), `Unexpected color ${petal.color}`)
      usedColors.add(petal.color)
      assert.ok(petal.xRatio > 0 && petal.xRatio < 1)
      assert.ok(petal.initialProgress >= 0 && petal.initialProgress < 1)
      assert.ok(petal.width >= 6 && petal.height > petal.width)
      assert.ok(petal.opacity >= 0.4 && petal.opacity <= 0.85)
      assert.ok(petal.speedMultiplier >= 0.6 && petal.speedMultiplier <= 1.6)
      assert.ok(Number.isFinite(petal.parallaxFactor))
    }

    // Ensures contrast variety across Sakura blush & Coral accent petals
    assert.ok(usedColors.has('#FDCBD1'))
    assert.ok(usedColors.has('#F47F72'))
  })
})
