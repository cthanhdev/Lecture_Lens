import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAuthRoute,
  parsePreviewOverrideParam,
  resolveAuthTransitionDirection,
  resolveServiceAvailability,
  sanitizeReturnTo,
  SERVICE_ISSUE_COPY,
} from '../connectionResilience.ts'

describe('Connection Resilience & Auth Return Sanitization Seam', () => {
  it('resolves explicit preview overrides ahead of live connectivity state', () => {
    assert.deepEqual(
      resolveServiceAvailability({
        isConnected: true,
        previewOverride: 'skeleton',
      }),
      { status: 'loading' },
    )

    assert.deepEqual(
      resolveServiceAvailability({
        isConnected: true,
        previewOverride: 'offline',
      }),
      { status: 'offline' },
    )

    assert.deepEqual(
      resolveServiceAvailability({
        isConnected: true,
        previewOverride: 'server_error',
      }),
      {
        status: 'server_error',
        detail: SERVICE_ISSUE_COPY.server_error.subtitle,
      },
    )
  })

  it('resolves offline when network disconnects or internet is unreachable', () => {
    assert.deepEqual(
      resolveServiceAvailability({
        isConnected: false,
        isInternetReachable: false,
      }),
      { status: 'offline' },
    )

    assert.deepEqual(
      resolveServiceAvailability({
        isConnected: true,
        isInternetReachable: false,
      }),
      { status: 'offline' },
    )

    // Mock bypass allows testing offline locally once user taps "Continue in Demo Mode"
    assert.deepEqual(
      resolveServiceAvailability({
        isConnected: false,
        authMode: 'mock',
        allowOfflineInMockMode: true,
      }),
      { status: 'ready' },
    )
  })

  it('resolves loading and server_error states accurately in auto mode', () => {
    assert.deepEqual(
      resolveServiceAvailability({
        isConnected: true,
        isLoading: true,
      }),
      { status: 'loading' },
    )

    assert.deepEqual(
      resolveServiceAvailability({
        isConnected: true,
        lastErrorCode: 'SERVER_UNREACHABLE',
      }),
      {
        status: 'server_error',
        detail: SERVICE_ISSUE_COPY.server_error.subtitle,
      },
    )

    assert.deepEqual(
      resolveServiceAvailability({
        isConnected: true,
        isInternetReachable: true,
        serverReachable: true,
      }),
      { status: 'ready' },
    )
  })

  it('provides English Kitsune Soft recovery copy for offline and server_error', () => {
    assert.equal(SERVICE_ISSUE_COPY.offline.badge, 'NO CONNECTION')
    assert.equal(SERVICE_ISSUE_COPY.offline.primaryActionLabel, 'Retry connection')
    assert.equal(
      SERVICE_ISSUE_COPY.offline.secondaryActionLabel,
      'Continue in Demo Mode',
    )

    assert.equal(SERVICE_ISSUE_COPY.server_error.badge, 'SERVER ISSUE')
    assert.equal(SERVICE_ISSUE_COPY.server_error.primaryActionLabel, 'Try again')
    assert.equal(
      SERVICE_ISSUE_COPY.server_error.secondaryActionLabel,
      'Continue in Demo Mode',
    )
  })

  it('sanitizes returnTo targets per UX Law 5 to prevent auth loops and external redirects', () => {
    assert.equal(sanitizeReturnTo(undefined), '/(tabs)/home')
    assert.equal(sanitizeReturnTo(''), '/(tabs)/home')
    assert.equal(sanitizeReturnTo('https://evil.com'), '/(tabs)/home')
    assert.equal(sanitizeReturnTo('//evil.com'), '/(tabs)/home')
    assert.equal(sanitizeReturnTo('/(auth)/sign-in'), '/(tabs)/home')
    assert.equal(sanitizeReturnTo('/(auth)/create-account'), '/(tabs)/home')
    assert.equal(sanitizeReturnTo('/sign-in'), '/(tabs)/home')
    assert.equal(sanitizeReturnTo('/'), '/(tabs)/home')
    assert.equal(sanitizeReturnTo(['/(tabs)/library', '/other']), '/(tabs)/library')
    assert.equal(sanitizeReturnTo('/(tabs)/ask-ai'), '/(tabs)/ask-ai')
  })

  it('parses URL ?preview query parameters cleanly with safe auto fallback', () => {
    assert.equal(parsePreviewOverrideParam(undefined), 'auto')
    assert.equal(parsePreviewOverrideParam('unknown'), 'auto')
    assert.equal(parsePreviewOverrideParam('skeleton'), 'skeleton')
    assert.equal(parsePreviewOverrideParam(['offline', 'skeleton']), 'offline')
    assert.equal(parsePreviewOverrideParam('server_error'), 'server_error')
  })

  it('resolves synchronized Auth transition direction safely', () => {
    assert.equal(resolveAuthTransitionDirection(undefined), 'neutral')
    assert.equal(resolveAuthTransitionDirection('forward'), 'forward')
    assert.equal(resolveAuthTransitionDirection(['back']), 'back')
    assert.equal(resolveAuthTransitionDirection('other'), 'neutral')
  })

  it('builds Auth route hrefs preserving direction and returnTo without dropping params', () => {
    assert.equal(buildAuthRoute('/(auth)/create-account'), '/(auth)/create-account')
    assert.equal(
      buildAuthRoute('/(auth)/create-account', {
        dir: 'forward',
        returnTo: '/(tabs)/review',
      }),
      '/(auth)/create-account?dir=forward&returnTo=%2F%28tabs%29%2Freview',
    )
    assert.equal(
      buildAuthRoute('/(auth)/sign-in', { dir: 'back' }),
      '/(auth)/sign-in?dir=back',
    )
  })
})
