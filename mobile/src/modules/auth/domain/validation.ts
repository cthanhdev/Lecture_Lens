import type { RegistrationPayload, StudentCredentials } from './auth.types.ts'

export interface ValidationResult {
  isValid: boolean
  message?: string
}

export interface SignInFormErrors {
  email?: string
  password?: string
}

export interface RegistrationFormErrors {
  fullName?: string
  email?: string
  password?: string
  agreeTerms?: string
}

export interface FormValidationResult<TErrors> {
  isValid: boolean
  firstError?: string
  errors: TErrors
}

/**
 * Validate university or standard student email formatting.
 */
export function validateUniversityEmail(email: string): ValidationResult {
  const trimmed = email.trim()
  if (!trimmed) {
    return { isValid: false, message: 'Please enter your university email.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid email address.' }
  }

  return { isValid: true }
}

/**
 * Validate student display name.
 */
export function validateFullName(name: string): ValidationResult {
  const trimmed = name.trim()
  if (!trimmed) {
    return { isValid: false, message: 'Please enter your full name.' }
  }

  if (trimmed.length < 2) {
    return { isValid: false, message: 'Full name must be at least 2 characters.' }
  }

  return { isValid: true }
}

/**
 * Validate sign-in or registration password baseline requirements.
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, message: 'Please enter your password.' }
  }

  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters.' }
  }

  return { isValid: true }
}

/**
 * Validate Sign In credentials as a structured form state.
 */
export function validateSignInForm(
  credentials: StudentCredentials,
): FormValidationResult<SignInFormErrors> {
  const errors: SignInFormErrors = {}

  const emailResult = validateUniversityEmail(credentials.email)
  if (!emailResult.isValid) {
    errors.email = emailResult.message
  }

  const passwordResult = validatePassword(credentials.password)
  if (!passwordResult.isValid) {
    errors.password = passwordResult.message
  }

  const firstError = errors.email ?? errors.password
  return {
    isValid: !firstError,
    firstError,
    errors,
  }
}

/**
 * Validate Create Account payload including Terms & Privacy Policy consent.
 */
export function validateRegistrationForm(
  payload: RegistrationPayload,
): FormValidationResult<RegistrationFormErrors> {
  const errors: RegistrationFormErrors = {}

  const nameResult = validateFullName(payload.fullName)
  if (!nameResult.isValid) {
    errors.fullName = nameResult.message
  }

  const emailResult = validateUniversityEmail(payload.email)
  if (!emailResult.isValid) {
    errors.email = emailResult.message
  }

  const passwordResult = validatePassword(payload.password)
  if (!passwordResult.isValid) {
    errors.password = passwordResult.message
  }

  if (!payload.agreeTerms) {
    errors.agreeTerms = 'Please agree to the Terms and Privacy Policy.'
  }

  const firstError =
    errors.fullName ?? errors.email ?? errors.password ?? errors.agreeTerms
  return {
    isValid: !firstError,
    firstError,
    errors,
  }
}
