import type {
  StudentCredentials,
  RegistrationPayload,
  AuthResponse,
} from '../domain/auth.types.ts'
import type { KeyValueStorage } from '../../storage/types.ts'
import { MemoryStorageAdapter } from '../../storage/MemoryStorageAdapter.ts'

/**
 * AuthSeam: Deep Module Seam (Ranh giới xác thực theo Matt Pocock)
 * Small interface with extensive internal implementation
 */
export interface AuthSeam {
  signIn(credentials: StudentCredentials): Promise<AuthResponse>
  createAccount(payload: RegistrationPayload): Promise<AuthResponse>
  checkBackendHealth(): Promise<boolean>
  getCurrentSession(): Promise<AuthResponse | null>
  signOut(): Promise<void>
}

const STORAGE_KEY = 'lecturelens_auth_session'

/**
 * 1. MockAuthAdapter: Cho phép trải nghiệm, kiểm thử và chạy ngoại tuyến
 * khi Spring Boot Backend chưa khởi động hoặc gặp sự cố mạng
 */
export class MockAuthAdapter implements AuthSeam {
  private latencyMs: number
  private storage: KeyValueStorage

  constructor(storage: KeyValueStorage = new MemoryStorageAdapter(), latencyMs = 200) {
    this.storage = storage
    this.latencyMs = latencyMs
  }

  async signIn(credentials: StudentCredentials): Promise<AuthResponse> {
    if (this.latencyMs > 0) {
      await new Promise((r) => setTimeout(r, this.latencyMs))
    }

    // Tự động tạo user từ email
    const username = credentials.email.split('@')[0] || 'Minh Tran'
    const formattedName = username
      .split('.')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

    const response: AuthResponse = {
      success: true,
      user: {
        id: 'usr_mock_01',
        fullName: formattedName,
        email: credentials.email,
        studentId: 'STU202509',
      },
      token: 'jwt_mock_token_kitsune_2025',
      message: 'Đăng nhập thành công (Chế độ Ngoại tuyến Native)',
      isMock: true,
    }

    await this.storage.setItem(STORAGE_KEY, JSON.stringify(response))
    return response
  }

  async createAccount(payload: RegistrationPayload): Promise<AuthResponse> {
    if (this.latencyMs > 0) {
      await new Promise((r) => setTimeout(r, this.latencyMs))
    }

    const response: AuthResponse = {
      success: true,
      user: {
        id: 'usr_mock_new',
        fullName: payload.fullName,
        email: payload.email,
        studentId: 'STU' + Math.floor(100000 + Math.random() * 900000),
      },
      token: 'jwt_mock_token_new_user',
      message: 'Tạo tài khoản học tập thành công (Offline Mode)',
      isMock: true,
    }

    await this.storage.setItem(STORAGE_KEY, JSON.stringify(response))
    return response
  }

  async checkBackendHealth(): Promise<boolean> {
    return false
  }

  async getCurrentSession(): Promise<AuthResponse | null> {
    try {
      const data = await this.storage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  async signOut(): Promise<void> {
    await this.storage.removeItem(STORAGE_KEY)
  }
}

/**
 * 2. BackendAuthAdapter: Kết nối tới API Gateway Spring Boot (Cổng công khai 8080)
 */
export class BackendAuthAdapter implements AuthSeam {
  private baseUrl: string
  private fallbackMock: MockAuthAdapter
  private storage: KeyValueStorage

  constructor(
    baseUrl = 'http://localhost:8080',
    storage: KeyValueStorage = new MemoryStorageAdapter(),
    fallbackMock?: MockAuthAdapter
  ) {
    this.baseUrl = baseUrl
    this.storage = storage
    this.fallbackMock = fallbackMock || new MockAuthAdapter(storage)
  }

  async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      const res = await fetch(`${this.baseUrl}/api/v1/health`, {
        method: 'GET',
        signal: controller.signal,
      }).catch(() => null)
      clearTimeout(timeoutId)
      return res !== null && res.ok
    } catch {
      return false
    }
  }

  async signIn(credentials: StudentCredentials): Promise<AuthResponse> {
    const isHealthy = await this.checkBackendHealth()
    if (!isHealthy) {
      return this.fallbackMock.signIn(credentials)
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      if (!res.ok) {
        throw new Error(`Đăng nhập thất bại: HTTP ${res.status}`)
      }
      const data = await res.json()
      const response: AuthResponse = {
        success: true,
        user: data.user,
        token: data.token,
        isMock: false,
      }
      await this.storage.setItem(STORAGE_KEY, JSON.stringify(response))
      return response
    } catch {
      return this.fallbackMock.signIn(credentials)
    }
  }

  async createAccount(payload: RegistrationPayload): Promise<AuthResponse> {
    const isHealthy = await this.checkBackendHealth()
    if (!isHealthy) {
      return this.fallbackMock.createAccount(payload)
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(`Đăng ký thất bại: HTTP ${res.status}`)
      }
      const data = await res.json()
      const response: AuthResponse = {
        success: true,
        user: data.user,
        token: data.token,
        isMock: false,
      }
      await this.storage.setItem(STORAGE_KEY, JSON.stringify(response))
      return response
    } catch {
      return this.fallbackMock.createAccount(payload)
    }
  }

  async getCurrentSession(): Promise<AuthResponse | null> {
    try {
      const data = await this.storage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  async signOut(): Promise<void> {
    await this.storage.removeItem(STORAGE_KEY)
  }
}

// Singleton Auth Seam instance
let activeAuthSeam: AuthSeam = new MockAuthAdapter()

export function getAuthSeam(): AuthSeam {
  return activeAuthSeam
}

export function setAuthSeam(seam: AuthSeam): void {
  activeAuthSeam = seam
}
