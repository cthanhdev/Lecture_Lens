import { test } from 'node:test'
import assert from 'node:assert'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../tokens.ts'

test('Kitsune Soft Design System Tokens Invariants', async (t) => {
  await t.test('Bảng màu cốt lõi Kitsune Soft chuẩn xác theo docs/design-system.md', () => {
    assert.strictEqual(KITSUNE_COLORS.washiCream, '#FFF7FD')
    assert.strictEqual(KITSUNE_COLORS.plumInk, '#261333')
    assert.strictEqual(KITSUNE_COLORS.kitsuneCoral, '#F47F72')
    assert.strictEqual(KITSUNE_COLORS.kitsuneCoralDark, '#A03F36')
    assert.strictEqual(KITSUNE_COLORS.sakuraPink, '#F5C3C9')
    assert.strictEqual(KITSUNE_COLORS.mistSky, '#A9D4E8')
    assert.strictEqual(KITSUNE_COLORS.mochiYellow, '#FFE27A')
    assert.strictEqual(KITSUNE_COLORS.matchaMint, '#BEE1D0')
  })

  await t.test('Hình dạng & Bo góc chuẩn Kitsune Soft (Pill 9999px & Squircle 28px)', () => {
    assert.strictEqual(KITSUNE_RADII.pill, 9999)
    assert.strictEqual(KITSUNE_RADII.squircleCard, 28)
    assert.strictEqual(KITSUNE_RADII.squircleSmall, 20)
    assert.strictEqual(KITSUNE_RADII.sheetTop, 32)
  })

  await t.test('Bóng đổ Miruku Glass sử dụng màu mực mận chín #261333', () => {
    assert.strictEqual(KITSUNE_SHADOWS.miruku.shadowColor, '#261333')
    assert.strictEqual(KITSUNE_SHADOWS.plumModal.shadowColor, '#261333')
  })
})
