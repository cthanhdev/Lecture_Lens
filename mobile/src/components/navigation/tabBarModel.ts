import type { IconName } from '../ui/icons/types.ts'

export type FloatingTabId = 'home' | 'library' | 'review' | 'search'

export interface FloatingTabItem {
  readonly id: FloatingTabId
  readonly route: `/(tabs)/${FloatingTabId}`
  readonly label: string
  readonly icon: IconName
}

export interface FloatingTabSlots {
  readonly left: readonly [FloatingTabItem, FloatingTabItem]
  readonly right: readonly [FloatingTabItem, FloatingTabItem]
}

export interface TabBarState {
  readonly isVisible: boolean
  readonly activeTabId: FloatingTabId | null
}

export const TAB_BAR_GEOMETRY = {
  barHeight: 64,
  barMaxWidth: 390,
  horizontalMargin: 20,
  horizontalInnerPadding: 8,
  minBottomMargin: 16,
  fabSize: 56,
  fabProtrusion: 14,
  fabBorderWidth: 3,
  centerGapWidth: 68,
  activePillWidth: 60,
  activePillHeight: 52,
  playerClearanceGap: 12,
} as const

export function getFloatingPillWidth(
  windowWidth: number,
  maxWidth: number = TAB_BAR_GEOMETRY.barMaxWidth
): number {
  const safeWidth = Number.isFinite(windowWidth) ? windowWidth : TAB_BAR_GEOMETRY.barMaxWidth
  const available = Math.max(safeWidth - TAB_BAR_GEOMETRY.horizontalMargin * 2, 280)
  return Math.min(available, maxWidth)
}

export function getFloatingTabBarBottomOffset(bottomInset: number): number {
  const safeInset = Number.isFinite(bottomInset) ? Math.max(0, bottomInset) : 0
  return Math.max(safeInset, TAB_BAR_GEOMETRY.minBottomMargin)
}

export function getFloatingTabBarClearance(bottomInset: number): number {
  return (
    getFloatingTabBarBottomOffset(bottomInset) +
    TAB_BAR_GEOMETRY.barHeight +
    TAB_BAR_GEOMETRY.fabProtrusion +
    TAB_BAR_GEOMETRY.playerClearanceGap
  )
}

export const FLOATING_TAB_SLOTS: FloatingTabSlots = {
  left: [
    { id: 'home', route: '/(tabs)/home', label: 'Home', icon: 'home' },
    { id: 'library', route: '/(tabs)/library', label: 'Library', icon: 'library' },
  ],
  right: [
    { id: 'review', route: '/(tabs)/review', label: 'Review', icon: 'cards' },
    { id: 'search', route: '/(tabs)/search', label: 'Search', icon: 'search' },
  ],
}

const ALL_TABS: readonly FloatingTabItem[] = [
  ...FLOATING_TAB_SLOTS.left,
  ...FLOATING_TAB_SLOTS.right,
]

const HIDDEN_ROUTE_SEGMENTS = new Set([
  'record',
  'session',
  'onboarding',
  'auth',
  'processing',
  'subjects',
  'profile',
  'settings',
])

function stripQueryAndHash(pathname: string): string {
  return pathname.split(/[?#]/)[0] || '/'
}

function normalizeRoutePath(pathname: string): string {
  const withoutQuery = stripQueryAndHash(pathname)
  const withoutGroups = withoutQuery.replace(/\/\([^/]+\)/g, '')
  const trimmed = withoutGroups.length > 1 ? withoutGroups.replace(/\/+$/, '') : withoutGroups
  return trimmed || '/'
}

function isHiddenTabBarRoute(pathname: string): boolean {
  const withoutQuery = stripQueryAndHash(pathname).toLowerCase()
  const segments = withoutQuery
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/^\((.*)\)$/, '$1'))

  return segments.some((segment) => HIDDEN_ROUTE_SEGMENTS.has(segment))
}

export function resolveTabBarState(pathname: string): TabBarState {
  if (isHiddenTabBarRoute(pathname)) {
    return {
      isVisible: false,
      activeTabId: null,
    }
  }

  const normalized = normalizeRoutePath(pathname)
  const effectivePath = normalized === '/' ? '/home' : normalized

  const matched = ALL_TABS.find((tab) => normalizeRoutePath(tab.route) === effectivePath)

  return {
    isVisible: true,
    activeTabId: matched ? matched.id : null,
  }
}
