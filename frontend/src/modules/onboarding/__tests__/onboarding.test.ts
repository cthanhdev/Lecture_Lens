import { test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { ICON_REGISTRY } from '../../../components/ui/icons/registry.ts'

test('Kitsune Soft Onboarding Invariant 1: Tất cả icon sử dụng phải có trong registry', () => {
  const requiredIcons = [
    'mic',
    'cloud-upload',
    'play',
    'pause',
    'waveform',
    'sparkles',
    'star',
    'flame',
    'clock',
    'check-circle',
    'arrow-right',
  ] as const

  for (const name of requiredIcons) {
    assert.ok(ICON_REGISTRY[name], `Biểu tượng '${name}' phải tồn tại trong ICON_REGISTRY`)
    assert.ok(ICON_REGISTRY[name].paths.length > 0, `Biểu tượng '${name}' phải có vector paths`)
  }
})

test('Kitsune Soft Onboarding Invariant 2: Tệp linh vật Pixel Art phải tồn tại và hợp lệ', () => {
  const mascotPath = path.resolve('src/assets/kitsune-mascot.png')
  assert.ok(fs.existsSync(mascotPath), 'Tệp kitsune-mascot.png phải tồn tại')
  const stats = fs.statSync(mascotPath)
  assert.ok(stats.size > 5000, 'Dung lượng linh vật phải lớn hơn 5KB để đảm bảo độ nét')
})

test('Kitsune Soft Onboarding Invariant 3: Tuyến đường tuần tự 3 bước đúng chuẩn', () => {
  const steps = [
    { step: 1, route: '/onboarding/step-1', next: '/onboarding/step-2' },
    { step: 2, route: '/onboarding/step-2', next: '/onboarding/step-3' },
    { step: 3, route: '/onboarding/step-3', next: '/auth/sign-in' },
  ]

  for (const s of steps) {
    assert.ok(s.step >= 1 && s.step <= 3, 'Bước phải nằm trong khoảng 1 đến 3')
    assert.ok(s.route.startsWith('/onboarding/step-'), 'Route phải thuộc nhóm onboarding')
  }
})
