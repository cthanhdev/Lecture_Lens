import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { MockAuthAdapter } from '../infrastructure/authSeam.ts'
import { MemoryStorageAdapter } from '../../storage/MemoryStorageAdapter.ts'

describe('AuthSeam & MockAdapter on Mobile', () => {
  it('đăng nhập thành công với MockAuthAdapter và format tên tự động', async () => {
    const memoryStorage = new MemoryStorageAdapter()
    const adapter = new MockAuthAdapter(memoryStorage, 0)
    const res = await adapter.signIn({
      email: 'minh.tran@university.edu',
      password: 'KitsuneSecret99',
    })

    assert.equal(res.success, true)
    assert.equal(res.user?.email, 'minh.tran@university.edu')
    assert.equal(res.user?.fullName, 'Minh Tran')
    assert.equal(res.isMock, true)

    // Kiểm tra session được lưu trong storage
    const session = await adapter.getCurrentSession()
    assert.equal(session?.user?.email, 'minh.tran@university.edu')
  })

  it('tạo tài khoản thành công với MockAuthAdapter', async () => {
    const memoryStorage = new MemoryStorageAdapter()
    const adapter = new MockAuthAdapter(memoryStorage, 0)
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
