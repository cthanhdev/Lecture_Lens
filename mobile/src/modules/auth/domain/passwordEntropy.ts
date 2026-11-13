import type { PasswordStrength, PasswordStrengthLevel } from './auth.types.ts'

/**
 * Pure 3-segment password strength calculator matching Screen 06 (Create Account).
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password || password.length === 0) {
    return {
      score: 0,
      level: 'weak',
      label: 'Enter a password',
      feedback: 'Use 8+ characters with a number.',
      isAcceptable: false,
    }
  }

  let score = 0

  // 1. Check baseline length
  if (password.length >= 8) {
    score += 1
  }

  // 2. Contains number or special symbol
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(password)
  if (hasNumberOrSymbol) {
    score += 1
  }

  // 3. Mixed case or extended length >= 12
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password)
  if (hasMixedCase || password.length >= 12) {
    score += 1
  }

  let level: PasswordStrengthLevel = 'weak'
  let label = 'Weak password'
  let feedback = 'Use 8+ characters with a number.'

  if (score <= 1) {
    level = 'weak'
    label = 'Weak password'
    feedback = 'Use 8+ characters with a number.'
  } else if (score === 2) {
    level = 'fair'
    label = 'Fair password'
    feedback = 'Add uppercase letters for stronger security.'
  } else if (score >= 3) {
    level = 'good'
    label = 'Good password'
    feedback = 'Use 8+ characters with a number.'
  }

  return {
    score: Math.min(score, 3) as 0 | 1 | 2 | 3,
    level,
    label,
    feedback,
    isAcceptable: score >= 2,
  }
}
