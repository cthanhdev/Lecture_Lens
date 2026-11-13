import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { MemoryStorageAdapter } from '../../storage/MemoryStorageAdapter.ts'
import { MockAuthAdapter } from '../../auth/infrastructure/authSeam.ts'
import { runLaunchBootstrap } from '../launchPreflight.ts'
import type { PreflightProgressEvent, StartupPreparer } from '../types.ts'

describe('Launch Preflight Pipeline Seam (Screen 01)', () => {
  it('phát tiến trình tăng dần 0.15 -> 0.45 -> 0.78 -> 1.0 và kiểm tra server khi online', async () => {
    const storage = new MemoryStorageAdapter()
    const authSeam = new MockAuthAdapter(new MemoryStorageAdapter(), 0)
    const events: PreflightProgressEvent[] = []
    let healthChecked = false

    const preparers: StartupPreparer[] = [
      {
        id: 'sync-preferences',
        label: 'Sync preferences',
        run: async () => {
          healthChecked = healthChecked && true
        },
      },
    ]

    const result = await runLaunchBootstrap({
      storage,
      authSeam,
      checkNetwork: async () => true,
      checkServerHealth: async () => {
        healthChecked = true
        return true
      },
      preparers,
      onProgress: (ev) => events.push(ev),
      minDisplayMs: 0,
      delayFn: async () => {},
    })

    assert.equal(healthChecked, true)
    assert.equal(result.targetRoute, '/(onboarding)/step-1')
    assert.equal(result.diagnostics.networkConnected, true)
    assert.equal(result.diagnostics.serverReachable, true)
    assert.deepEqual(result.diagnostics.completedPreparers, ['sync-preferences'])
    assert.deepEqual(result.diagnostics.failedPreparers, [])

    assert.deepEqual(
      events.map((e) => e.stage),
      ['network', 'server', 'prepare', 'session']
    )
    assert.deepEqual(
      events.map((e) => e.progress),
      [0.15, 0.45, 0.78, 1]
    )
    assert.equal(events[1].statusText, 'Connected to server...')
    assert.equal(events[3].statusText, 'Ready!')
  })

  it('bỏ qua ping server khi offline và vẫn hoàn tất 100% ở offline mode', async () => {
    const storage = new MemoryStorageAdapter()
    await storage.setItem('lecturelens.onboarding.completed', 'true')
    const authSeam = new MockAuthAdapter(new MemoryStorageAdapter(), 0)
    const events: PreflightProgressEvent[] = []
    let serverPinged = false

    const result = await runLaunchBootstrap({
      storage,
      authSeam,
      checkNetwork: async () => false,
      checkServerHealth: async () => {
        serverPinged = true
        return true
      },
      onProgress: (ev) => events.push(ev),
      minDisplayMs: 0,
      delayFn: async () => {},
    })

    assert.equal(serverPinged, false)
    assert.equal(result.diagnostics.networkConnected, false)
    assert.equal(result.diagnostics.serverReachable, false)
    assert.equal(result.diagnostics.serverLatencyMs, null)
    assert.equal(result.targetRoute, '/(auth)/sign-in')
    assert.equal(events[1].statusText, 'Preparing offline mode...')
    assert.equal(events.at(-1)?.progress, 1)
  })

  it('cô lập lỗi/timeout của server check và preparer để Splash không bao giờ bị treo', async () => {
    const storage = new MemoryStorageAdapter()
    await storage.setItem('lecturelens.onboarding.completed', 'true')
    const authSeam = new MockAuthAdapter(new MemoryStorageAdapter(), 0)
    await authSeam.signIn({
      email: 'linh.le@university.edu',
      password: 'Password123',
    })

    const preparers: StartupPreparer[] = [
      {
        id: 'ok-task',
        label: 'OK task',
        run: async () => {},
      },
      {
        id: 'failing-task',
        label: 'Failing task',
        run: async () => {
          throw new Error('Server 503')
        },
      },
      {
        id: 'hanging-task',
        label: 'Hanging task',
        run: () => new Promise<void>(() => {}),
      },
    ]

    const result = await runLaunchBootstrap({
      storage,
      authSeam,
      checkNetwork: async () => true,
      checkServerHealth: () => new Promise<boolean>(() => {}),
      preparers,
      stepTimeoutMs: 25,
      minDisplayMs: 0,
      delayFn: async () => {},
    })

    assert.equal(result.targetRoute, '/(tabs)/home')
    assert.equal(result.diagnostics.networkConnected, true)
    assert.equal(result.diagnostics.serverReachable, false)
    assert.deepEqual(result.diagnostics.completedPreparers, ['ok-task'])
    assert.deepEqual(result.diagnostics.failedPreparers, [
      'failing-task',
      'hanging-task',
    ])
  })

  it('đảm bảo thời gian chờ tối thiểu minDisplayMs bằng delayFn khi khởi động quá nhanh', async () => {
    const storage = new MemoryStorageAdapter()
    const authSeam = new MockAuthAdapter(new MemoryStorageAdapter(), 0)
    let waitedMs = 0
    let fakeNow = 1000

    await runLaunchBootstrap({
      storage,
      authSeam,
      checkNetwork: async () => true,
      checkServerHealth: async () => {
        fakeNow += 150
        return false
      },
      minDisplayMs: 1100,
      nowFn: () => fakeNow,
      delayFn: async (ms) => {
        waitedMs = ms
      },
    })

    assert.equal(waitedMs, 950)
  })
})
