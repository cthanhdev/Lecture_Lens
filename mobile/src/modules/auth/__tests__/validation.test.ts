import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateUniversityEmail,
  validateFullName,
  validatePassword,
} from '../domain/validation.ts'

describe('Auth Validation Domain Logic on Mobile', () => {
  it('kiểm tra email đại học hợp lệ và không hợp lệ', () => {
    assert.equal(validateUniversityEmail('minh.tran@university.edu').isValid, true)
    assert.equal(validateUniversityEmail('student@hcmut.edu.vn').isValid, true)
    assert.equal(validateUniversityEmail('').isValid, false)
    assert.equal(validateUniversityEmail('invalid-email').isValid, false)
  })

  it('kiểm tra họ và tên', () => {
    assert.equal(validateFullName('Minh Tran').isValid, true)
    assert.equal(validateFullName('   ').isValid, false)
    assert.equal(validateFullName('A').isValid, false)
  })

  it('kiểm tra mật khẩu cơ bản', () => {
    assert.equal(validatePassword('123456').isValid, true)
    assert.equal(validatePassword('123').isValid, false)
    assert.equal(validatePassword('').isValid, false)
  })
})
