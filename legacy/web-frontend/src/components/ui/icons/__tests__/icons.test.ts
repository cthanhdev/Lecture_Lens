import { test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ICON_REGISTRY, SOFT_BLOB_PALETTE, ORGANIC_BLOB_PATH } from '../registry.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rawSvgDir = path.resolve(__dirname, '../../../../assets/icons')

test('Kitsune Soft Icon Registry Integrity', async (t) => {
  await t.test('Registry chứa đúng 74 biểu tượng chuẩn hóa', () => {
    const iconNames = Object.keys(ICON_REGISTRY)
    assert.strictEqual(iconNames.length, 74)
  })

  await t.test('Mọi biểu tượng đều có title, category hợp lệ và ít nhất 1 vector path', () => {
    const validCategories = new Set(['navigation', 'audio', 'ai', 'study', 'review', 'mascot', 'system'])

    for (const [name, def] of Object.entries(ICON_REGISTRY)) {
      assert.ok(def.title, `Icon "${name}" thiếu title`)
      assert.ok(validCategories.has(def.category), `Icon "${name}" có category không hợp lệ: ${def.category}`)
      assert.ok(Array.isArray(def.paths) && def.paths.length > 0, `Icon "${name}" không có paths`)

      for (const p of def.paths) {
        assert.ok(p.d && p.d.length > 2, `Icon "${name}" có path d không hợp lệ: "${p.d}"`)
      }
    }
  })

  await t.test('Soft-Blob Palette có đầy đủ 6 gam màu pastel chuẩn Kitsune Soft', () => {
    const expectedColors = ['sakura', 'mist', 'mochi', 'matcha', 'coral', 'plum']
    for (const c of expectedColors) {
      assert.ok((SOFT_BLOB_PALETTE as Record<string, string>)[c], `Thiếu màu blob "${c}"`)
    }
    assert.ok(ORGANIC_BLOB_PATH.length > 10, 'ORGANIC_BLOB_PATH không hợp lệ')
  })

  await t.test('Toàn bộ 74 tệp SVG tồn tại trên đĩa và là tệp SVG hợp lệ', () => {
    for (const name of Object.keys(ICON_REGISTRY)) {
      const svgPath = path.join(rawSvgDir, `${name}.svg`)
      assert.ok(fs.existsSync(svgPath), `Thiếu tệp SVG: ${name}.svg`)

      const content = fs.readFileSync(svgPath, 'utf-8')
      assert.ok(content.startsWith('<svg'), `${name}.svg không bắt đầu bằng thẻ <svg>`)
      assert.ok(content.includes('viewBox="0 0 24 24"'), `${name}.svg thiếu viewBox 0 0 24 24`)
      assert.ok(content.includes('</svg>'), `${name}.svg thiếu thẻ đóng </svg>`)
    }
  })
})
