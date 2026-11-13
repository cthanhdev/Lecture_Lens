import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  FLOATING_TAB_SLOTS,
  TAB_BAR_GEOMETRY,
  getFloatingPillWidth,
  getFloatingTabBarBottomOffset,
  getFloatingTabBarClearance,
  resolveTabBarState,
} from '../tabBarModel.ts'

describe('FloatingIslandTabBar Model Seam', () => {
  it('cung cấp bố cục đối xứng 2 tab trái + 2 tab phải với nhãn và icon chuẩn thiết kế', () => {
    assert.equal(FLOATING_TAB_SLOTS.left.length, 2)
    assert.equal(FLOATING_TAB_SLOTS.right.length, 2)

    assert.deepEqual(
      FLOATING_TAB_SLOTS.left.map((t) => ({ id: t.id, label: t.label, icon: t.icon })),
      [
        { id: 'home', label: 'Home', icon: 'home' },
        { id: 'library', label: 'Library', icon: 'library' },
      ]
    )

    assert.deepEqual(
      FLOATING_TAB_SLOTS.right.map((t) => ({ id: t.id, label: t.label, icon: t.icon })),
      [
        { id: 'review', label: 'Review', icon: 'cards' },
        { id: 'search', label: 'Search', icon: 'search' },
      ]
    )
  })

  it('nhận diện chính xác tab active cho cả grouped route lẫn stripped pathname của Expo Router', () => {
    assert.equal(resolveTabBarState('/').activeTabId, 'home')
    assert.equal(resolveTabBarState('/home').activeTabId, 'home')
    assert.equal(resolveTabBarState('/(tabs)/home').activeTabId, 'home')
    assert.equal(resolveTabBarState('/library').activeTabId, 'library')
    assert.equal(resolveTabBarState('/(tabs)/library').activeTabId, 'library')
    assert.equal(resolveTabBarState('/review').activeTabId, 'review')
    assert.equal(resolveTabBarState('/(tabs)/review').activeTabId, 'review')
    assert.equal(resolveTabBarState('/search').activeTabId, 'search')
    assert.equal(resolveTabBarState('/(tabs)/search').activeTabId, 'search')
    assert.equal(resolveTabBarState('/lectures/macro-101/transcript').activeTabId, null)
  })

  it('ẩn tab bar trên các màn hình tập trung cao, xác thực và stack chi tiết', () => {
    assert.equal(resolveTabBarState('/home').isVisible, true)
    assert.equal(resolveTabBarState('/library').isVisible, true)
    assert.equal(resolveTabBarState('/review').isVisible, true)
    assert.equal(resolveTabBarState('/search').isVisible, true)

    assert.equal(resolveTabBarState('/(guarded)/audio/record').isVisible, false)
    assert.equal(resolveTabBarState('/audio/record').isVisible, false)
    assert.equal(resolveTabBarState('/(guarded)/review/session/deck-1').isVisible, false)
    assert.equal(resolveTabBarState('/(onboarding)/step-1').isVisible, false)
    assert.equal(resolveTabBarState('/(auth)/sign-in').isVisible, false)
    assert.equal(resolveTabBarState('/subjects').isVisible, false)
    assert.equal(resolveTabBarState('/profile').isVisible, false)
    assert.equal(resolveTabBarState('/settings').isVisible, false)
  })

  it('cung cấp thông số hình học chuẩn và khoảng đệm an toàn tránh che nút + bởi Audio Player', () => {
    assert.equal(TAB_BAR_GEOMETRY.barHeight, 64)
    assert.equal(TAB_BAR_GEOMETRY.fabSize, 56)
    assert.equal(TAB_BAR_GEOMETRY.fabProtrusion, 14)
    assert.ok(TAB_BAR_GEOMETRY.centerGapWidth >= TAB_BAR_GEOMETRY.fabSize)

    assert.equal(getFloatingTabBarBottomOffset(0), 16)
    assert.equal(getFloatingTabBarBottomOffset(34), 34)
    assert.equal(getFloatingPillWidth(390), 350)
    assert.equal(getFloatingPillWidth(430), 390)
    assert.equal(getFloatingPillWidth(480, 400), 400)

    const minClearanceNoInset =
      Math.max(0, 16) + TAB_BAR_GEOMETRY.barHeight + TAB_BAR_GEOMETRY.fabProtrusion
    const minClearanceIphone =
      Math.max(34, 16) + TAB_BAR_GEOMETRY.barHeight + TAB_BAR_GEOMETRY.fabProtrusion

    assert.ok(getFloatingTabBarClearance(0) > minClearanceNoInset)
    assert.ok(getFloatingTabBarClearance(34) > minClearanceIphone)
  })
})
