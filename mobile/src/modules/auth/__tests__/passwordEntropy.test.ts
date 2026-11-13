import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculatePasswordStrength } from '../domain/passwordEntropy.ts'

describe('Password Entropy Domain Logic on Mobile', () => {
  it('returns English prompt when password is empty', () => {
    const res = calculatePasswordStrength('')
    assert.equal(res.score, 0)
    assert.equal(res.level, 'weak')
    assert.equal(res.label, 'Enter a password')
    assert.equal(res.feedback, 'Use 8+ characters with a number.')
    assert.equal(res.isAcceptable, false)
  })

  it('rates short passwords under 8 chars as weak', () => {
    const res = calculatePasswordStrength('short1')
    assert.equal(res.score, 1)
    assert.equal(res.level, 'weak')
    assert.equal(res.label, 'Weak password')
    assert.equal(res.feedback, 'Use 8+ characters with a number.')
    assert.equal(res.isAcceptable, false)
  })

  it('rates 8+ char password with a number as fair', () => {
    const res = calculatePasswordStrength('password123')
    assert.equal(res.score, 2)
    assert.equal(res.level, 'fair')
    assert.equal(res.label, 'Fair password')
    assert.equal(res.isAcceptable, true)
  })

  it('rates mixed-case alphanumeric 8+ char password as Good password matching Screen 06', () => {
    const res = calculatePasswordStrength('KitsuneSmart2025')
    assert.equal(res.score, 3)
    assert.equal(res.level, 'good')
    assert.equal(res.isAcceptable, true)
    assert.equal(res.label, 'Good password')
    assert.equal(res.feedback, 'Use 8+ characters with a number.')
  })
})
