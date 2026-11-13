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

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'VALIDATION_ERROR'
  | 'NETWORK_OFFLINE'
  | 'SERVER_UNREACHABLE'
  | 'UNKNOWN_ERROR'

export type SocialAuthProvider = 'apple' | 'google'

export type AuthAdapterMode = 'mock' | 'spring'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  studentId?: string
  role?: string
}

export interface AuthResponse {
  success: boolean
  user?: AuthUser
  token?: string
  message?: string
  errorCode?: AuthErrorCode
  statusCode?: number
  isMock?: boolean
}

export interface PasswordResetResponse {
  success: boolean
  message: string
  errorCode?: AuthErrorCode
  isMock?: boolean
}

export interface StoredAuthSession {
  user: AuthUser
  token: string
  expiresIn?: number
  isMock?: boolean
}
