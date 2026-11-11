import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculatePasswordStrength } from '../domain/passwordEntropy.ts'

describe('Password Entropy Domain Logic', () => {
  it('xử lý mật khẩu rỗng', () => {
    const res = calculatePasswordStrength('')
    assert.equal(res.score, 0)
    assert.equal(res.level, 'weak')
    assert.equal(res.isAcceptable, false)
  })

  it('đánh giá mật khẩu ngắn dưới 8 ký tự', () => {
    const res = calculatePasswordStrength('short1')
    assert.equal(res.score, 1) // có số nhưng < 8 ký tự
    assert.equal(res.level, 'weak')
    assert.equal(res.isAcceptable, false)
  })

  it('đánh giá mật khẩu tạm ổn (fair) khi đủ 8 ký tự và có số', () => {
    const res = calculatePasswordStrength('password123')
    assert.equal(res.score, 2)
    assert.equal(res.level, 'fair')
    assert.equal(res.isAcceptable, true)
  })

  it('đánh giá mật khẩu tốt (good) khi kết hợp chữ hoa, chữ thường, số và độ dài', () => {
    const res = calculatePasswordStrength('KitsuneSmart2025')
    assert.equal(res.score, 3)
    assert.equal(res.level, 'good')
    assert.equal(res.isAcceptable, true)
    assert.equal(res.label, 'Mật khẩu tốt')
  })
})
