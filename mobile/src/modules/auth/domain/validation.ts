export interface ValidationResult {
  isValid: boolean
  message?: string
}

/**
 * Kiểm tra định dạng Email sinh viên (hỗ trợ .edu hoặc email chuẩn)
 */
export function validateUniversityEmail(email: string): ValidationResult {
  const trimmed = email.trim()
  if (!trimmed) {
    return { isValid: false, message: 'Vui lòng nhập email trường học.' }
  }

  // Regex kiểm tra cấu trúc email chuẩn
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Định dạng email chưa hợp lệ.' }
  }

  return { isValid: true }
}

/**
 * Kiểm tra tên hiển thị của sinh viên
 */
export function validateFullName(name: string): ValidationResult {
  const trimmed = name.trim()
  if (!trimmed) {
    return { isValid: false, message: 'Vui lòng nhập họ và tên của bạn.' }
  }

  if (trimmed.length < 2) {
    return { isValid: false, message: 'Họ tên phải có ít nhất 2 ký tự.' }
  }

  return { isValid: true }
}

/**
 * Kiểm tra mật khẩu đăng ký
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, message: 'Vui lòng nhập mật khẩu.' }
  }

  if (password.length < 6) {
    return { isValid: false, message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' }
  }

  return { isValid: true }
}
