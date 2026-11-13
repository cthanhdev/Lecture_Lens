import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  MockAuthAdapter,
  SpringBootAuthAdapter,
} from '../infrastructure/authSeam.ts'
import { MemoryStorageAdapter } from '../../storage/MemoryStorageAdapter.ts'
import { ApiClient } from '../../../services/apiClient.ts'

describe('AuthSeam Persistence & Spring Boot Readiness', () => {
  it('signs in with the pre-seeded demo account and syncs JWT token for ApiClient', async () => {
    const storage = new MemoryStorageAdapter()
    const adapter = new MockAuthAdapter(storage, 0)

    const res = await adapter.signIn({
      email: 'minh.tran@university.edu',
      password: 'KitsuneSecret99',
    })

    assert.equal(res.success, true)
    assert.equal(res.user?.email, 'minh.tran@university.edu')
    assert.equal(res.user?.fullName, 'Minh Tran')
    assert.equal(res.isMock, true)
    assert.ok(res.token)

    // Session & token stored consistently
    const session = await adapter.getCurrentSession()
    assert.equal(session?.user?.email, 'minh.tran@university.edu')
    assert.equal(await storage.getItem('lecturelens_auth_token'), res.token)

    // ApiClient automatically reads stored Bearer token
    let capturedAuthHeader = ''
    const client = new ApiClient({
      baseUrl: 'http://localhost:8080/api/v1',
      storage,
      fetchFn: (async (_url, init) => {
        const headers = init?.headers as Record<string, string>
        capturedAuthHeader = headers['Authorization'] ?? ''
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }) as typeof fetch,
    })
    await client.request('/health')
    assert.equal(capturedAuthHeader, `Bearer ${res.token}`)
  })

  it('rejects wrong password or unknown email in MockAuthAdapter', async () => {
    const storage = new MemoryStorageAdapter()
    const adapter = new MockAuthAdapter(storage, 0)

    const wrongPw = await adapter.signIn({
      email: 'minh.tran@university.edu',
      password: 'WrongPassword',
    })
    assert.equal(wrongPw.success, false)
    assert.equal(wrongPw.errorCode, 'INVALID_CREDENTIALS')
    assert.equal(await adapter.getCurrentSession(), null)

    const unknownUser = await adapter.signIn({
      email: 'stranger@university.edu',
      password: 'KitsuneSecret99',
    })
    assert.equal(unknownUser.success, false)
    assert.equal(unknownUser.errorCode, 'INVALID_CREDENTIALS')
  })

  it('persists newly created accounts across adapter restarts and blocks duplicate emails', async () => {
    const storage = new MemoryStorageAdapter()
    const firstAdapter = new MockAuthAdapter(storage, 0)

    const created = await firstAdapter.createAccount({
      fullName: 'Linh Pham',
      email: 'Linh.Pham@University.edu',
      password: 'KitsuneSmart2025',
      agreeTerms: true,
    })
    assert.equal(created.success, true)
    assert.equal(created.user?.fullName, 'Linh Pham')
    assert.equal(created.user?.email, 'linh.pham@university.edu')

    // Duplicate registration rejected
    const duplicate = await firstAdapter.createAccount({
      fullName: 'Duplicate Linh',
      email: 'linh.pham@university.edu',
      password: 'AnotherPassword123',
      agreeTerms: true,
    })
    assert.equal(duplicate.success, false)
    assert.equal(duplicate.errorCode, 'EMAIL_ALREADY_EXISTS')

    // Sign out clears active session + token, while created account persists for future sign-in
    await firstAdapter.signOut()
    assert.equal(await firstAdapter.getCurrentSession(), null)
    assert.equal(await storage.getItem('lecturelens_auth_token'), null)

    const freshAdapterInstance = new MockAuthAdapter(storage, 0)
    const loggedIn = await freshAdapterInstance.signIn({
      email: 'linh.pham@university.edu',
      password: 'KitsuneSmart2025',
    })
    assert.equal(loggedIn.success, true)
    assert.equal(loggedIn.user?.fullName, 'Linh Pham')
  })

  it('supports mock social sign-in (Apple / Google) and password reset', async () => {
    const storage = new MemoryStorageAdapter()
    const adapter = new MockAuthAdapter(storage, 0)

    const appleRes = await adapter.signInWithProvider('apple')
    assert.equal(appleRes.success, true)
    assert.equal(appleRes.isMock, true)
    assert.ok(appleRes.token)

    const resetRes = await adapter.requestPasswordReset('minh.tran@university.edu')
    assert.equal(resetRes.success, true)
    assert.equal(resetRes.isMock, true)
  })

  it('SpringBootAuthAdapter parses backend /api/v1/auth/login accessToken contract and handles errors cleanly', async () => {
    const storage = new MemoryStorageAdapter()
    let calledUrl = ''

    const adapter = new SpringBootAuthAdapter({
      baseUrl: 'http://localhost:8080/api/v1',
      storage,
      fetchFn: (async (url) => {
        calledUrl = String(url)
        return new Response(
          JSON.stringify({
            accessToken: 'jwt_spring_live_token',
            tokenType: 'Bearer',
            expiresIn: 86400,
            user: {
              id: 'uuid-101',
              email: 'minh.tran@university.edu',
              fullName: 'Minh Tran',
              role: 'STUDENT',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }) as typeof fetch,
    })

    const res = await adapter.signIn({
      email: 'minh.tran@university.edu',
      password: 'KitsuneSecret99',
    })

    assert.equal(calledUrl, 'http://localhost:8080/api/v1/auth/login')
    assert.equal(res.success, true)
    assert.equal(res.isMock, false)
    assert.equal(res.token, 'jwt_spring_live_token')
    assert.equal(res.user?.role, 'STUDENT')
    assert.equal(await storage.getItem('lecturelens_auth_token'), 'jwt_spring_live_token')

    // 401 unauthorized
    const unauthorizedAdapter = new SpringBootAuthAdapter({
      baseUrl: 'http://localhost:8080',
      storage: new MemoryStorageAdapter(),
      fetchFn: (async () =>
        new Response(JSON.stringify({ message: 'Bad credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })) as typeof fetch,
    })
    const failed401 = await unauthorizedAdapter.signIn({
      email: 'minh.tran@university.edu',
      password: 'bad',
    })
    assert.equal(failed401.success, false)
    assert.equal(failed401.statusCode, 401)
    assert.equal(failed401.errorCode, 'INVALID_CREDENTIALS')

    // 409 duplicate registration
    const conflictAdapter = new SpringBootAuthAdapter({
      baseUrl: 'http://localhost:8080',
      storage: new MemoryStorageAdapter(),
      fetchFn: (async () =>
        new Response(JSON.stringify({ message: 'Email exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        })) as typeof fetch,
    })
    const failed409 = await conflictAdapter.createAccount({
      fullName: 'Minh Tran',
      email: 'minh.tran@university.edu',
      password: 'KitsuneSmart2025',
      agreeTerms: true,
    })
    assert.equal(failed409.success, false)
    assert.equal(failed409.statusCode, 409)
    assert.equal(failed409.errorCode, 'EMAIL_ALREADY_EXISTS')

    // 503 server error & network rejection -> SERVER_UNREACHABLE
    const serverDownAdapter = new SpringBootAuthAdapter({
      baseUrl: 'http://localhost:8080',
      storage: new MemoryStorageAdapter(),
      fetchFn: (async () => {
        throw new TypeError('fetch failed')
      }) as typeof fetch,
    })
    const unreachable = await serverDownAdapter.signIn({
      email: 'minh.tran@university.edu',
      password: 'KitsuneSecret99',
    })
    assert.equal(unreachable.success, false)
    assert.equal(unreachable.errorCode, 'SERVER_UNREACHABLE')
  })
})
