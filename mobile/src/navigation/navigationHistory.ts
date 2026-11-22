export type NavigationDirection = 'forward' | 'back'

export const BACK_EXIT_WINDOW_MS = 2000

/**
 * Normalizes Expo Router paths so grouped routes and stripped URLs resolve
 * identically (e.g. `/(tabs)/home` === `/home`, `/(tabs)/library?tab=all` === `/library`).
 */
export function normalizeNavigationRoute(route: string): string {
  const trimmedInput = route.trim()
  if (!trimmedInput) {
    return '/'
  }

  const withoutQueryOrHash = trimmedInput.split(/[?#]/)[0] ?? '/'
  const withoutGroups = withoutQueryOrHash.replace(/\/\([^/]+\)/g, '')
  const collapsedSlashes = withoutGroups.replace(/\/{2,}/g, '/')
  const withLeadingSlash = collapsedSlashes.startsWith('/')
    ? collapsedSlashes
    : `/${collapsedSlashes}`
  const normalized =
    withLeadingSlash.length > 1
      ? withLeadingSlash.replace(/\/+$/, '')
      : withLeadingSlash

  return normalized || '/'
}

export interface BackExitEvaluation {
  readonly shouldExit: boolean
  readonly nextLastPressAtMs: number | null
}

/**
 * Pure double-back exit evaluator for root `/(tabs)/home`:
 * pressing Back twice within `windowMs` (default 2000ms) confirms app exit
 * instead of trapping or looping navigation.
 */
export function evaluateDoubleBackExit(
  lastPressAtMs: number | null,
  nowMs: number,
  windowMs: number = BACK_EXIT_WINDOW_MS,
): BackExitEvaluation {
  if (
    lastPressAtMs !== null &&
    Number.isFinite(lastPressAtMs) &&
    Number.isFinite(nowMs) &&
    nowMs >= lastPressAtMs &&
    nowMs - lastPressAtMs <= windowMs
  ) {
    return {
      shouldExit: true,
      nextLastPressAtMs: null,
    }
  }

  return {
    shouldExit: false,
    nextLastPressAtMs: nowMs,
  }
}

/**
 * Deep Module managing the in-session visited route stack and actual transition
 * direction (`forward` | `back`). Deduplicates in-place state morphs where the
 * normalized route matches the top of the stack.
 */
export class NavigationHistoryTracker {
  private stack: string[]
  private direction: NavigationDirection

  constructor(initialRoute: string = '/') {
    this.stack = [normalizeNavigationRoute(initialRoute)]
    this.direction = 'forward'
  }

  get routeHistoryStack(): readonly string[] {
    return [...this.stack]
  }

  get currentRoute(): string {
    return this.stack[this.stack.length - 1] ?? '/'
  }

  get previousRoute(): string | null {
    return this.peekPrevious()
  }

  get canGoBack(): boolean {
    return this.stack.length > 1
  }

  get lastDirection(): NavigationDirection {
    return this.direction
  }

  get depth(): number {
    return this.stack.length
  }

  /**
   * Pushes a visited route onto the history stack.
   * In-place state changes where normalized route === top of stack are ignored
   * so neither duplicate entries nor bogus direction flips occur.
   */
  push(route: string): boolean {
    const normalized = normalizeNavigationRoute(route)
    if (normalized === this.currentRoute) {
      return false
    }

    this.stack.push(normalized)
    this.direction = 'forward'
    return true
  }

  /**
   * Replaces the top entry of the history stack (e.g. terminal processing
   * screens or deep-link fallback transitions).
   */
  replace(route: string, direction: NavigationDirection = 'forward'): void {
    const normalized = normalizeNavigationRoute(route)
    if (this.stack.length === 0) {
      this.stack = [normalized]
    } else {
      this.stack[this.stack.length - 1] = normalized
    }
    this.direction = direction
  }

  /**
   * Returns the previously visited route without mutating the stack,
   * or `null` when at a single-entry root / deep-link screen.
   */
  peekPrevious(): string | null {
    if (this.stack.length <= 1) {
      return null
    }
    return this.stack[this.stack.length - 2] ?? null
  }

  /**
   * Pops the current route and returns the destination route to roll back to,
   * setting `lastDirection` to `'back'`. Returns `null` when stack length <= 1.
   */
  pop(): string | null {
    if (this.stack.length <= 1) {
      return null
    }

    this.stack.pop()
    this.direction = 'back'
    return this.currentRoute
  }

  /**
   * Resets history to a clean single-entry route.
   */
  reset(route: string, direction: NavigationDirection = 'forward'): void {
    this.stack = [normalizeNavigationRoute(route)]
    this.direction = direction
  }
}
