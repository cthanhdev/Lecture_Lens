import type {
  AuthAdapterMode,
  AuthErrorCode,
  AuthResponse,
  AuthUser,
  PasswordResetResponse,
  RegistrationPayload,
  SocialAuthProvider,
  StudentCredentials,
} from '../domain/auth.types.ts'
import type { KeyValueStorage } from '../../storage/types.ts'
import { MemoryStorageAdapter } from '../../storage/MemoryStorageAdapter.ts'

export interface AuthSeam {
  readonly mode: AuthAdapterMode
  signIn(credentials: StudentCredentials): Promise<AuthResponse>
  createAccount(payload: RegistrationPayload): Promise<AuthResponse>
  signInWithProvider(provider: SocialAuthProvider): Promise<AuthResponse>
  requestPasswordReset(email: string): Promise<PasswordResetResponse>
  checkBackendHealth(): Promise<boolean>
  getCurrentSession(): Promise<AuthResponse | null>
  signOut(): Promise<void>
}

export const AUTH_SESSION_KEY = 'lecturelens_auth_session'
export const AUTH_TOKEN_KEY = 'lecturelens_auth_token'
export const MOCK_ACCOUNTS_KEY = 'lecturelens_mock_accounts'
export const AUTH_MODE_KEY = 'lecturelens_auth_mode'

export const DEMO_CREDENTIALS = {
  fullName: 'Minh Tran',
  email: 'minh.tran@university.edu',
  password: 'KitsuneSecret99',
} as const

interface StoredMockAccount {
  id: string
  fullName: string
  email: string
  password: string
  studentId: string
  role: string
}

const SEEDED_MOCK_ACCOUNTS: readonly StoredMockAccount[] = [
  {
    id: 'usr_mock_minh',
    fullName: DEMO_CREDENTIALS.fullName,
    email: DEMO_CREDENTIALS.email,
    password: DEMO_CREDENTIALS.password,
    studentId: 'STU202509',
    role: 'STUDENT',
  },
]

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function toPublicUser(account: StoredMockAccount): AuthUser {
  return {
    id: account.id,
    fullName: account.fullName,
    email: account.email,
    studentId: account.studentId,
    role: account.role,
  }
}

async function persistAuthSession(
  storage: KeyValueStorage,
  response: AuthResponse,
): Promise<void> {
  await storage.setItem(AUTH_SESSION_KEY, JSON.stringify(response))
  if (response.token) {
    await storage.setItem(AUTH_TOKEN_KEY, response.token)
  }
}

async function readAuthSession(
  storage: KeyValueStorage,
): Promise<AuthResponse | null> {
  try {
    const raw = await storage.getItem(AUTH_SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthResponse) : null
  } catch {
    return null
  }
}

async function clearAuthSession(storage: KeyValueStorage): Promise<void> {
  await storage.removeItem(AUTH_SESSION_KEY)
  await storage.removeItem(AUTH_TOKEN_KEY)
}

function normalizeApiV1BaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
}

function mapHttpStatusToErrorCode(status: number): AuthErrorCode {
  if (status === 401 || status === 403) return 'INVALID_CREDENTIALS'
  if (status === 409) return 'EMAIL_ALREADY_EXISTS'
  if (status === 400 || status === 422) return 'VALIDATION_ERROR'
  if (status >= 500) return 'SERVER_UNREACHABLE'
  return 'UNKNOWN_ERROR'
}

/**
 * Persistent local MockAuthAdapter for instant offline testing & demos.
 * Pre-seeds minh.tran@university.edu / KitsuneSecret99 and persists created accounts in KeyValueStorage.
 */
export class MockAuthAdapter implements AuthSeam {
  readonly mode: AuthAdapterMode = 'mock'
  private latencyMs: number
  private storage: KeyValueStorage

  constructor(
    storage: KeyValueStorage = new MemoryStorageAdapter(),
    latencyMs = 200,
  ) {
    this.storage = storage
    this.latencyMs = latencyMs
  }

  private async delayIfNeeded(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((r) => setTimeout(r, this.latencyMs))
    }
  }

  private async loadAccounts(): Promise<StoredMockAccount[]> {
    try {
      const raw = await this.storage.getItem(MOCK_ACCOUNTS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as StoredMockAccount[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {
      // Fall through to seed reset on corrupted payload
    }
    const seeded = [...SEEDED_MOCK_ACCOUNTS]
    await this.storage.setItem(MOCK_ACCOUNTS_KEY, JSON.stringify(seeded))
    return seeded
  }

  async signIn(credentials: StudentCredentials): Promise<AuthResponse> {
    await this.delayIfNeeded()

    const email = normalizeEmail(credentials.email)
    const accounts = await this.loadAccounts()
    const match = accounts.find((acc) => normalizeEmail(acc.email) === email)

    if (!match || match.password !== credentials.password) {
      return {
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        message:
          'Invalid university email or password. Demo: minh.tran@university.edu / KitsuneSecret99.',
        isMock: true,
      }
    }

    const response: AuthResponse = {
      success: true,
      user: toPublicUser(match),
      token: `jwt_mock_${match.id}_${Date.now()}`,
      message: 'Signed in successfully (Mock Mode).',
      isMock: true,
    }
    await persistAuthSession(this.storage, response)
    return response
  }

  async createAccount(payload: RegistrationPayload): Promise<AuthResponse> {
    await this.delayIfNeeded()

    const email = normalizeEmail(payload.email)
    const accounts = await this.loadAccounts()
    const duplicate = accounts.some((acc) => normalizeEmail(acc.email) === email)

    if (duplicate) {
      return {
        success: false,
        errorCode: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this university email already exists.',
        isMock: true,
      }
    }

    const newAccount: StoredMockAccount = {
      id: `usr_mock_${Date.now()}`,
      fullName: payload.fullName.trim(),
      email,
      password: payload.password,
      studentId: `STU${Math.floor(100000 + Math.random() * 900000)}`,
      role: 'STUDENT',
    }

    await this.storage.setItem(
      MOCK_ACCOUNTS_KEY,
      JSON.stringify([...accounts, newAccount]),
    )

    const response: AuthResponse = {
      success: true,
      user: toPublicUser(newAccount),
      token: `jwt_mock_${newAccount.id}`,
      message: 'Account created successfully (Mock Mode).',
      isMock: true,
    }
    await persistAuthSession(this.storage, response)
    return response
  }

  async signInWithProvider(provider: SocialAuthProvider): Promise<AuthResponse> {
    await this.delayIfNeeded()

    const isApple = provider === 'apple'
    const response: AuthResponse = {
      success: true,
      user: {
        id: isApple ? 'usr_mock_apple' : 'usr_mock_google',
        fullName: DEMO_CREDENTIALS.fullName,
        email: isApple
          ? 'minh.apple@university.edu'
          : 'minh.google@university.edu',
        studentId: 'STU202509',
        role: 'STUDENT',
      },
      token: `jwt_mock_${provider}_${Date.now()}`,
      message: `Signed in with ${isApple ? 'Apple' : 'Google'} (Mock Mode).`,
      isMock: true,
    }

    await persistAuthSession(this.storage, response)
    return response
  }

  async requestPasswordReset(email: string): Promise<PasswordResetResponse> {
    await this.delayIfNeeded()

    const cleanEmail = normalizeEmail(email)
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'Please enter a valid university email address.',
        isMock: true,
      }
    }

    return {
      success: true,
      message: `Reset link sent to ${cleanEmail}. Demo password: ${DEMO_CREDENTIALS.password}`,
      isMock: true,
    }
  }

  async checkBackendHealth(): Promise<boolean> {
    return false
  }

  async getCurrentSession(): Promise<AuthResponse | null> {
    return readAuthSession(this.storage)
  }

  async signOut(): Promise<void> {
    await clearAuthSession(this.storage)
  }
}

export interface SpringBootAuthConfig {
  baseUrl?: string
  storage?: KeyValueStorage
  fetchFn?: typeof fetch
  timeoutMs?: number
}

/**
 * Spring Boot API Gateway Adapter (/api/v1/auth/*)
 * Strictly handles backend JWT responses & HTTP/network error codes without silent mock bypasses.
 */
export class SpringBootAuthAdapter implements AuthSeam {
  readonly mode: AuthAdapterMode = 'spring'
  private readonly apiBaseUrl: string
  private readonly storage: KeyValueStorage
  private readonly fetchFn: typeof fetch
  private readonly timeoutMs: number

  constructor(
    configOrBaseUrl: SpringBootAuthConfig | string = 'http://localhost:8080/api/v1',
    storageArg?: KeyValueStorage,
  ) {
    const config: SpringBootAuthConfig =
      typeof configOrBaseUrl === 'string'
        ? { baseUrl: configOrBaseUrl, storage: storageArg }
        : configOrBaseUrl

    this.apiBaseUrl = normalizeApiV1BaseUrl(
      config.baseUrl ?? 'http://localhost:8080/api/v1',
    )
    this.storage = config.storage ?? new MemoryStorageAdapter()
    this.fetchFn =
      config.fetchFn ??
      (typeof fetch !== 'undefined'
        ? fetch.bind(globalThis)
        : ((async () => {
            throw new TypeError('Fetch API unavailable')
          }) as unknown as typeof fetch))
    this.timeoutMs = config.timeoutMs ?? 8000
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      return await this.fetchFn(url, { ...init, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  private async postAuthEndpoint(
    endpointPath: string,
    body: unknown,
  ): Promise<AuthResponse> {
    try {
      const res = await this.fetchWithTimeout(`${this.apiBaseUrl}${endpointPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      })

      let data: Record<string, unknown> = {}
      try {
        data = (await res.json()) as Record<string, unknown>
      } catch {
        // Non-JSON response body
      }

      if (!res.ok) {
        const errorCode = mapHttpStatusToErrorCode(res.status)
        const serverMessage =
          typeof data.message === 'string' ? data.message : undefined
        const fallbackMsg =
          errorCode === 'INVALID_CREDENTIALS'
            ? 'Invalid university email or password.'
            : errorCode === 'EMAIL_ALREADY_EXISTS'
              ? 'An account with this university email already exists.'
              : errorCode === 'SERVER_UNREACHABLE'
                ? 'LectureLens server is temporarily unavailable. Please try again.'
                : `Authentication failed (HTTP ${res.status}).`

        return {
          success: false,
          statusCode: res.status,
          errorCode,
          message: serverMessage ?? fallbackMsg,
          isMock: false,
        }
      }

      const token =
        (typeof data.accessToken === 'string' && data.accessToken) ||
        (typeof data.token === 'string' && data.token) ||
        undefined
      const user = data.user as AuthUser | undefined

      const response: AuthResponse = {
        success: true,
        user,
        token,
        isMock: false,
      }

      await persistAuthSession(this.storage, response)
      return response
    } catch {
      return {
        success: false,
        errorCode: 'SERVER_UNREACHABLE',
        message:
          'Unable to connect to the LectureLens Spring Boot server. Check your connection or switch to Demo Mode.',
        isMock: false,
      }
    }
  }

  async checkBackendHealth(): Promise<boolean> {
    try {
      const res = await this.fetchWithTimeout(`${this.apiBaseUrl}/health`, {
        method: 'GET',
      })
      return res.ok
    } catch {
      return false
    }
  }

  async signIn(credentials: StudentCredentials): Promise<AuthResponse> {
    return this.postAuthEndpoint('/auth/login', {
      email: normalizeEmail(credentials.email),
      password: credentials.password,
    })
  }

  async createAccount(payload: RegistrationPayload): Promise<AuthResponse> {
    return this.postAuthEndpoint('/auth/register', {
      fullName: payload.fullName.trim(),
      email: normalizeEmail(payload.email),
      password: payload.password,
      agreeTerms: payload.agreeTerms,
    })
  }

  async signInWithProvider(provider: SocialAuthProvider): Promise<AuthResponse> {
    return this.postAuthEndpoint('/auth/oauth', { provider })
  }

  async requestPasswordReset(email: string): Promise<PasswordResetResponse> {
    try {
      const res = await this.fetchWithTimeout(
        `${this.apiBaseUrl}/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ email: normalizeEmail(email) }),
        },
      )
      if (!res.ok) {
        return {
          success: false,
          errorCode: mapHttpStatusToErrorCode(res.status),
          message: 'Could not start password reset. Please try again later.',
          isMock: false,
        }
      }
      return {
        success: true,
        message: `If an account exists for ${normalizeEmail(email)}, reset instructions have been sent.`,
        isMock: false,
      }
    } catch {
      return {
        success: false,
        errorCode: 'SERVER_UNREACHABLE',
        message: 'Unable to reach LectureLens server for password reset.',
        isMock: false,
      }
    }
  }

  async getCurrentSession(): Promise<AuthResponse | null> {
    return readAuthSession(this.storage)
  }

  async signOut(): Promise<void> {
    await clearAuthSession(this.storage)
  }
}

export const BackendAuthAdapter = SpringBootAuthAdapter

// Active Auth Seam singleton
let activeAuthSeam: AuthSeam = new MockAuthAdapter()

export function getAuthSeam(): AuthSeam {
  return activeAuthSeam
}

export function setAuthSeam(seam: AuthSeam): void {
  activeAuthSeam = seam
}
