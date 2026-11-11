// Domain types for LectureLens Authentication Module
// Theo triết lý Ubiquitous Language & Matt Pocock Domain Modeling

export interface StudentCredentials {
  email: string
  password: string
}

export interface RegistrationPayload {
  fullName: string
  email: string
  password: string
  agreeTerms: boolean
}

export type PasswordStrengthLevel = 'weak' | 'fair' | 'good'

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3
  level: PasswordStrengthLevel
  label: string
  feedback: string
  isAcceptable: boolean
}

export type AuthStatus = 'idle' | 'validating' | 'submitting' | 'authenticated' | 'error'

export type BackendConnectionState = 'connected' | 'checking' | 'offline' | 'backend_unreachable'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  studentId?: string
}

export interface AuthResponse {
  success: boolean
  user?: AuthUser
  token?: string
  message?: string
  isMock?: boolean
}
