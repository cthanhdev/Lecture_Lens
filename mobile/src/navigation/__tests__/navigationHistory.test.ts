import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  BACK_EXIT_WINDOW_MS,
  NavigationHistoryTracker,
  evaluateDoubleBackExit,
  normalizeNavigationRoute,
} from '../navigationHistory.ts'

describe('NavigationHistoryTracker Deep Module', () => {
  it('normalizes grouped Expo Router paths identically to stripped paths', () => {
    assert.equal(normalizeNavigationRoute('/(tabs)/home'), '/home')
    assert.equal(normalizeNavigationRoute('/home'), '/home')
    assert.equal(normalizeNavigationRoute('/(tabs)/library/'), '/library')
    assert.equal(normalizeNavigationRoute('/(tabs)/library?filter=downloaded#top'), '/library')
    assert.equal(normalizeNavigationRoute('/(guarded)/audio/record'), '/audio/record')
    assert.equal(normalizeNavigationRoute('/(auth)/sign-in'), '/sign-in')
    assert.equal(normalizeNavigationRoute('/'), '/')
  })

  it('tracks A -> B -> Back -> A and A -> C -> Back -> A accurately', () => {
    const tracker = new NavigationHistoryTracker('/(tabs)/home')
    assert.deepEqual(tracker.routeHistoryStack, ['/home'])
    assert.equal(tracker.canGoBack, false)
    assert.equal(tracker.peekPrevious(), null)
    assert.equal(tracker.lastDirection, 'forward')

    // A -> B
    assert.equal(tracker.push('/(tabs)/library'), true)
    assert.deepEqual(tracker.routeHistoryStack, ['/home', '/library'])
    assert.equal(tracker.canGoBack, true)
    assert.equal(tracker.peekPrevious(), '/home')
    assert.equal(tracker.lastDirection, 'forward')

    // Back -> A
    assert.equal(tracker.pop(), '/home')
    assert.deepEqual(tracker.routeHistoryStack, ['/home'])
    assert.equal(tracker.canGoBack, false)
    assert.equal(tracker.peekPrevious(), null)
    assert.equal(tracker.lastDirection, 'back')

    // A -> C
    assert.equal(tracker.push('/(tabs)/review'), true)
    assert.deepEqual(tracker.routeHistoryStack, ['/home', '/review'])
    assert.equal(tracker.canGoBack, true)
    assert.equal(tracker.peekPrevious(), '/home')
    assert.equal(tracker.lastDirection, 'forward')

    // Back -> A
    assert.equal(tracker.pop(), '/home')
    assert.deepEqual(tracker.routeHistoryStack, ['/home'])
    assert.equal(tracker.canGoBack, false)
    assert.equal(tracker.lastDirection, 'back')
  })

  it('supports replace semantics so terminal screens do not remain in back history', () => {
    const tracker = new NavigationHistoryTracker('/(tabs)/home')
    tracker.push('/(guarded)/audio/record')
    tracker.push('/audio/processing/job-42')
    assert.deepEqual(tracker.routeHistoryStack, [
      '/home',
      '/audio/record',
      '/audio/processing/job-42',
    ])

    // Replace processing screen with lecture transcript
    tracker.replace('/lectures/job-42/transcript')
    assert.deepEqual(tracker.routeHistoryStack, [
      '/home',
      '/audio/record',
      '/lectures/job-42/transcript',
    ])
    assert.equal(tracker.lastDirection, 'forward')

    // Back skips the replaced processing route
    assert.equal(tracker.pop(), '/audio/record')
    assert.equal(tracker.lastDirection, 'back')
  })

  it('does not push duplicate entries on in-place state morphs or grouped/stripped equivalents', () => {
    const tracker = new NavigationHistoryTracker('/(tabs)/home')
    assert.equal(tracker.push('/home'), false)
    assert.equal(tracker.push('/(tabs)/home?offline=1'), false)
    assert.deepEqual(tracker.routeHistoryStack, ['/home'])

    assert.equal(tracker.push('/(tabs)/library'), true)
    assert.equal(tracker.push('/library'), false)
    assert.equal(tracker.push('/(tabs)/library#list'), false)
    assert.deepEqual(tracker.routeHistoryStack, ['/home', '/library'])

    // Popping back to /home sets lastDirection='back'; duplicate push must not clobber it
    assert.equal(tracker.pop(), '/home')
    assert.equal(tracker.lastDirection, 'back')
    assert.equal(tracker.push('/(tabs)/home'), false)
    assert.equal(tracker.lastDirection, 'back')
  })

  it('preserves deep-link single-entry behavior without underflowing stack', () => {
    const tracker = new NavigationHistoryTracker('/lectures/macro-101/cornell')
    assert.deepEqual(tracker.routeHistoryStack, ['/lectures/macro-101/cornell'])
    assert.equal(tracker.canGoBack, false)
    assert.equal(tracker.peekPrevious(), null)
    assert.equal(tracker.pop(), null)
    assert.deepEqual(tracker.routeHistoryStack, ['/lectures/macro-101/cornell'])
  })

  it('evaluates double-back exit guard within 2000ms window on root home', () => {
    assert.equal(BACK_EXIT_WINDOW_MS, 2000)

    const firstPress = evaluateDoubleBackExit(null, 10_000)
    assert.equal(firstPress.shouldExit, false)
    assert.equal(firstPress.nextLastPressAtMs, 10_000)

    const secondPressTooLate = evaluateDoubleBackExit(firstPress.nextLastPressAtMs, 12_500)
    assert.equal(secondPressTooLate.shouldExit, false)
    assert.equal(secondPressTooLate.nextLastPressAtMs, 12_500)

    const secondPressInWindow = evaluateDoubleBackExit(
      secondPressTooLate.nextLastPressAtMs,
      13_900,
    )
    assert.equal(secondPressInWindow.shouldExit, true)
    assert.equal(secondPressInWindow.nextLastPressAtMs, null)
  })
})
