import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ICON_REGISTRY } from '../../../components/ui/icons/registry.ts'
import type { IconName } from '../../../components/ui/icons/types.ts'

describe('Auth Module Integration & Invariants', () => {
  it('toàn bộ 13 biểu tượng sử dụng trong Auth module đều có mặt trong ICON_REGISTRY', () => {
    const requiredIcons: IconName[] = [
      'arrow-left',
      'profile',
      'mail',
      'lock',
      'eye',
      'eye-off',
      'check-circle',
      'check',
      'arrow-right',
      'apple',
      'google',
      'wifi-off',
      'refresh',
    ]

    for (const iconName of requiredIcons) {
      assert.ok(
        ICON_REGISTRY[iconName],
        `Biểu tượng [${iconName}] bắt buộc phải tồn tại trong ICON_REGISTRY`
      )
      assert.ok(
        ICON_REGISTRY[iconName].paths.length > 0,
        `Biểu tượng [${iconName}] phải chứa đường dẫn vector path`
      )
    }
  })
})
