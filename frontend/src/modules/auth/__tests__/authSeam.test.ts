import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { MockAuthAdapter } from '../infrastructure/authSeam.ts'

describe('AuthSeam & MockAdapter', () => {
  it('đăng nhập thành công với MockAuthAdapter và format tên tự động', async () => {
    const adapter = new MockAuthAdapter(10) // 10ms for fast test
    const res = await adapter.signIn({
      email: 'minh.tran@university.edu',
      password: 'KitsuneSecret99',
    })

    assert.equal(res.success, true)
    assert.equal(res.user?.email, 'minh.tran@university.edu')
    assert.equal(res.user?.fullName, 'Minh Tran')
    assert.equal(res.isMock, true)
  })

  it('tạo tài khoản thành công với MockAuthAdapter', async () => {
    const adapter = new MockAuthAdapter(10)
    const res = await adapter.createAccount({
      fullName: 'Minh Tran',
      email: 'minh.tran@university.edu',
      password: 'KitsuneSmart2025',
      agreeTerms: true,
    })

    assert.equal(res.success, true)
    assert.equal(res.user?.fullName, 'Minh Tran')
    assert.equal(res.isMock, true)
  })
})
