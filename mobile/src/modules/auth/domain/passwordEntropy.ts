import type { PasswordStrength, PasswordStrengthLevel } from './auth.types.ts'

/**
 * Thuật toán tính toán độ mạnh mật khẩu thuần túy (Pure Function)
 * Đáp ứng thiết kế 3 nấc (3-segment meter) của màn hình Create Account (SVG 06)
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password || password.length === 0) {
    return {
      score: 0,
      level: 'weak',
      label: 'Chưa nhập mật khẩu',
      feedback: 'Sử dụng ít nhất 8 ký tự kèm chữ số.',
      isAcceptable: false,
    }
  }

  let score = 0

  // 1. Kiểm tra độ dài
  if (password.length >= 8) {
    score += 1
  }

  // 2. Chứa chữ số hoặc ký tự đặc biệt
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(password)
  if (hasNumberOrSymbol) {
    score += 1
  }

  // 3. Kết hợp cả chữ hoa lẫn chữ thường hoặc độ dài >= 12
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password)
  if (hasMixedCase || password.length >= 12) {
    score += 1
  }

  let level: PasswordStrengthLevel = 'weak'
  let label = 'Mật khẩu yếu'
  let feedback = 'Nên có ít nhất 8 ký tự gồm chữ và số.'

  if (score === 1) {
    level = 'weak'
    label = 'Mật khẩu yếu'
    feedback = 'Thêm chữ số hoặc ký tự đặc biệt để an toàn hơn.'
  } else if (score === 2) {
    level = 'fair'
    label = 'Mật khẩu tạm ổn'
    feedback = 'Thêm chữ in hoa hoặc tăng độ dài mật khẩu.'
  } else if (score >= 3) {
    level = 'good'
    label = 'Mật khẩu tốt'
    feedback = 'Mật khẩu đủ an toàn cho tài khoản học tập.'
  }

  return {
    score: Math.min(score, 3) as 0 | 1 | 2 | 3,
    level,
    label,
    feedback,
    isAcceptable: score >= 2,
  }
}
