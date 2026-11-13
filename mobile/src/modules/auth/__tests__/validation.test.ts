import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateUniversityEmail,
  validateFullName,
  validatePassword,
  validateSignInForm,
  validateRegistrationForm,
} from '../domain/validation.ts'

describe('Auth Validation Domain Logic on Mobile', () => {
  it('validates university emails with English feedback messages', () => {
    assert.equal(validateUniversityEmail('minh.tran@university.edu').isValid, true)
    assert.equal(validateUniversityEmail('student@hcmut.edu.vn').isValid, true)

    const empty = validateUniversityEmail('')
    assert.equal(empty.isValid, false)
    assert.equal(empty.message, 'Please enter your university email.')

    const malformed = validateUniversityEmail('invalid-email')
    assert.equal(malformed.isValid, false)
    assert.equal(malformed.message, 'Please enter a valid email address.')
  })

  it('validates full name with English feedback messages', () => {
    assert.equal(validateFullName('Minh Tran').isValid, true)

    const blank = validateFullName('   ')
    assert.equal(blank.isValid, false)
    assert.equal(blank.message, 'Please enter your full name.')

    const tooShort = validateFullName('A')
    assert.equal(tooShort.isValid, false)
    assert.equal(tooShort.message, 'Full name must be at least 2 characters.')
  })

  it('validates password minimum requirements with English feedback messages', () => {
    assert.equal(validatePassword('123456').isValid, true)

    const empty = validatePassword('')
    assert.equal(empty.isValid, false)
    assert.equal(empty.message, 'Please enter your password.')

    const short = validatePassword('123')
    assert.equal(short.isValid, false)
    assert.equal(short.message, 'Password must be at least 6 characters.')
  })

  it('validates the Sign In form fields cleanly', () => {
    const valid = validateSignInForm({
      email: 'minh.tran@university.edu',
      password: 'KitsuneSecret99',
    })
    assert.equal(valid.isValid, true)
    assert.deepEqual(valid.errors, {})

    const invalid = validateSignInForm({
      email: 'bad-email',
      password: '',
    })
    assert.equal(invalid.isValid, false)
    assert.equal(invalid.errors.email, 'Please enter a valid email address.')
    assert.equal(invalid.errors.password, 'Please enter your password.')
    assert.equal(invalid.firstError, 'Please enter a valid email address.')
  })

  it('validates the Create Account form including Terms acceptance', () => {
    const valid = validateRegistrationForm({
      fullName: 'Minh Tran',
      email: 'minh.tran@university.edu',
      password: 'KitsuneSmart2025',
      agreeTerms: true,
    })
    assert.equal(valid.isValid, true)
    assert.deepEqual(valid.errors, {})

    const missingTerms = validateRegistrationForm({
      fullName: 'Minh Tran',
      email: 'minh.tran@university.edu',
      password: 'KitsuneSmart2025',
      agreeTerms: false,
    })
    assert.equal(missingTerms.isValid, false)
    assert.equal(missingTerms.errors.agreeTerms, 'Please agree to the Terms and Privacy Policy.')
    assert.equal(missingTerms.firstError, 'Please agree to the Terms and Privacy Policy.')
  })
})
