// API Client Seam (Matt Pocock Deep Module Pattern)
import { MemoryStorageAdapter } from '../modules/storage/MemoryStorageAdapter.ts'
import type { KeyValueStorage } from '../modules/storage/types.ts'
import { ApiError, type ApiConfig, type UploadAudioParams, type UploadAudioResult } from './types.ts'

const TOKEN_KEY = 'lecturelens_auth_token'

export type PlatformOS = 'android' | 'ios' | 'web' | 'unknown'

let currentPlatform: PlatformOS = 'ios'

export function setPlatformOS(os: PlatformOS): void {
  currentPlatform = os
}

export function resolveDefaultBaseUrl(os?: PlatformOS): string {
  // 1. Explicit environment variable takes top precedence
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GATEWAY_URL) {
    return process.env.EXPO_PUBLIC_GATEWAY_URL
  }

  const target = os || currentPlatform

  // 2. Android Emulator routes host machine at 10.0.2.2
  if (target === 'android') {
    return 'http://10.0.2.2:8080/api/v1'
  }

  // 3. iOS Simulator & Web default to localhost
  return 'http://localhost:8080/api/v1'
}

export class ApiClient {
  private readonly baseUrl: string
  private storage: KeyValueStorage
  private readonly fetchFn: typeof fetch
  private readonly timeoutMs: number

  constructor(config?: ApiConfig) {
    this.baseUrl = (config?.baseUrl || resolveDefaultBaseUrl()).replace(/\/+$/, '')
    this.storage = config?.storage || new MemoryStorageAdapter()
    this.fetchFn = config?.fetchFn || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (async () => { throw new Error('No fetch available') }) as unknown as typeof fetch)
    this.timeoutMs = config?.timeoutMs || 15000
  }

  public getBaseUrl(): string {
    return this.baseUrl
  }

  public setStorage(storage: KeyValueStorage): void {
    this.storage = storage
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }
    try {
      const token = await this.storage.getItem(TOKEN_KEY)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    } catch {
      // Storage failure, proceed unauthenticated
    }
    return headers
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${this.baseUrl}${cleanEndpoint}`
    const authHeaders = await this.getAuthHeaders()

    const headers: Record<string, string> = {
      ...authHeaders,
      ...((options.headers as Record<string, string>) || {}),
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await this.fetchFn(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!response.ok) {
        let errorData: unknown
        try {
          errorData = await response.json()
        } catch {
          errorData = await response.text().catch(() => null)
        }
        const message = (errorData && typeof errorData === 'object' && 'detail' in errorData)
          ? String((errorData as { detail: unknown }).detail)
          : `HTTP ${response.status}: ${response.statusText || 'Request failed'}`
        throw new ApiError(message, response.status, errorData)
      }

      if (response.status === 204) {
        return null as T
      }

      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        return (await response.json()) as T
      }
      return (await response.text()) as unknown as T
    } catch (err: unknown) {
      clearTimeout(timer)
      if (err instanceof ApiError) {
        throw err
      }
      const message = err instanceof Error ? err.message : 'Network request failed'
      throw new ApiError(message, 0, err)
    }
  }

  public async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  public async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) || {}),
    }

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  public async uploadAudio(params: UploadAudioParams): Promise<UploadAudioResult> {
    const formData = new FormData()
    const fileName = params.fileName || `lecture_${params.lectureId}.${params.fileExtension}`

    // React Native FormData asset format
    const filePayload: unknown = {
      uri: params.fileUri,
      name: fileName,
      type: `audio/${params.fileExtension === 'mp3' ? 'mpeg' : params.fileExtension}`,
    }

    formData.append('audio', filePayload as Blob)
    formData.append('lectureId', params.lectureId)
    formData.append('fileExtension', params.fileExtension)

    const authHeaders = await this.getAuthHeaders()

    const response = await this.fetchFn(`${this.baseUrl}/audio/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: formData,
    })

    if (!response.ok) {
      let detail = `Upload failed with status ${response.status}`
      try {
        const errorJson = await response.json()
        detail = errorJson.detail || errorJson.message || detail
      } catch {
        // Fallback to text
      }
      throw new ApiError(detail, response.status)
    }

    return (await response.json()) as UploadAudioResult
  }

  public async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>('/health')
  }
}

// Default application singleton instance
export const apiClient = new ApiClient()
