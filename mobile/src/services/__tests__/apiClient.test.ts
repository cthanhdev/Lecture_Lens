import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { MemoryStorageAdapter } from '../../modules/storage/MemoryStorageAdapter.ts'
import { ApiClient } from '../apiClient.ts'
import { AudioPipelineService } from '../audioPipelineService.ts'
import { networkMonitor } from '../networkMonitor.ts'
import { ApiError, type ManifestSchema, type UploadAudioResult } from '../types.ts'

describe('ApiClient & Gateway Integration on Mobile', () => {
  it('tự động chuẩn hóa Base URL và loại bỏ dấu gạch chéo cuối', () => {
    const client = new ApiClient({ baseUrl: 'http://192.168.1.100:8080/api/v1/' })
    assert.equal(client.getBaseUrl(), 'http://192.168.1.100:8080/api/v1')
  })

  it('gắn Bearer JWT token tự động khi có token trong storage', async () => {
    const storage = new MemoryStorageAdapter()
    await storage.setItem('lecturelens_auth_token', 'test-jwt-token-xyz')

    let capturedHeaders: Record<string, string> = {}

    const mockFetch: typeof fetch = async (_url, init) => {
      capturedHeaders = (init?.headers as Record<string, string>) || {}
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'UP', timestamp: '2026-11-11T00:00:00Z' }),
      } as unknown as Response
    }

    const client = new ApiClient({
      baseUrl: 'http://localhost:8080/api/v1',
      storage,
      fetchFn: mockFetch,
    })

    const res = await client.get<{ status: string }>('/health')
    assert.equal(res.status, 'UP')
    assert.equal(capturedHeaders['Authorization'], 'Bearer test-jwt-token-xyz')
  })

  it('thực thi POST request với payload JSON và xử lý lỗi ApiError chuẩn', async () => {
    const mockFetch: typeof fetch = async (_url, init) => {
      const body = JSON.parse(init?.body as string)
      if (body.email === 'error@test.com') {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ detail: 'Email đã tồn tại trong hệ thống' }),
        } as unknown as Response
      }
      return {
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 'usr-123', email: body.email }),
      } as unknown as Response
    }

    const client = new ApiClient({
      baseUrl: 'http://localhost:8080/api/v1',
      storage: new MemoryStorageAdapter(),
      fetchFn: mockFetch,
    })

    // Thành công
    const created = await client.post<{ id: string }>('/users', { email: 'student@fpt.edu.vn' })
    assert.equal(created.id, 'usr-123')

    // Thất bại ném lỗi ApiError
    await assert.rejects(
      async () => {
        await client.post('/users', { email: 'error@test.com' })
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.equal(err.status, 400)
        assert.equal(err.message, 'Email đã tồn tại trong hệ thống')
        return true
      }
    )
  })

  it('gửi multipart audio upload đúng định dạng', async () => {
    let capturedMethod = ''
    let capturedUrl = ''

    const mockFetch: typeof fetch = async (url, init) => {
      capturedUrl = String(url)
      capturedMethod = init?.method || ''
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          jobId: 'job-uuid-456',
          lectureId: 'lec-uuid-789',
          status: 'ACCEPTED',
          message: 'Audio queued for ingestion',
        }),
      } as unknown as Response
    }

    const client = new ApiClient({
      baseUrl: 'http://localhost:8080/api/v1',
      storage: new MemoryStorageAdapter(),
      fetchFn: mockFetch,
    })

    const uploadRes: UploadAudioResult = await client.uploadAudio({
      fileUri: 'file:///data/audio/recording.m4a',
      lectureId: 'lec-uuid-789',
      fileExtension: 'm4a',
    })

    assert.equal(capturedMethod, 'POST')
    assert.equal(capturedUrl, 'http://localhost:8080/api/v1/audio/upload')
    assert.equal(uploadRes.jobId, 'job-uuid-456')
    assert.equal(uploadRes.status, 'ACCEPTED')
  })
})

describe('AudioPipelineService & Polling Invariants', () => {
  it('pollJobUntilComplete poll thành công khi STT chuyển sang COMPLETED', async () => {
    let callCount = 0

    const mockFetch: typeof fetch = async () => {
      callCount++
      const status = callCount < 2 ? 'PROCESSING' : 'COMPLETED'
      const manifest: ManifestSchema = {
        schema_version: 1,
        job_id: 'job-123',
        lecture_id: 'lec-456',
        original: {
          filename: 'test.mp3',
          extension: 'mp3',
          size_bytes: 1024,
          created_at: new Date().toISOString(),
        },
        stt: {
          status,
          model: 'phowhisper-base',
          device: 'cuda:0',
          attempts: 1,
        },
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => manifest,
      } as unknown as Response
    }

    const client = new ApiClient({
      baseUrl: 'http://localhost:8080/api/v1',
      storage: new MemoryStorageAdapter(),
      fetchFn: mockFetch,
    })

    const service = new AudioPipelineService(client)
    const result = await service.pollJobUntilComplete('job-123', {
      maxAttempts: 5,
      intervalMs: 10,
    })

    assert.equal(result.stt.status, 'COMPLETED')
    assert.equal(callCount, 2)
  })

  it('pollJobUntilComplete ném lỗi khi STT thất bại với status FAILED', async () => {
    const mockFetch: typeof fetch = async () => {
      const manifest: ManifestSchema = {
        schema_version: 1,
        job_id: 'job-err',
        lecture_id: 'lec-err',
        original: {
          filename: 'corrupted.mp3',
          extension: 'mp3',
          size_bytes: 512,
          created_at: new Date().toISOString(),
        },
        stt: {
          status: 'FAILED',
          model: 'phowhisper-base',
          device: 'cuda:0',
          attempts: 3,
          last_error: 'Corrupted audio stream header',
        },
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => manifest,
      } as unknown as Response
    }

    const client = new ApiClient({
      baseUrl: 'http://localhost:8080/api/v1',
      storage: new MemoryStorageAdapter(),
      fetchFn: mockFetch,
    })

    const service = new AudioPipelineService(client)

    await assert.rejects(
      async () => {
        await service.pollJobUntilComplete('job-err', { maxAttempts: 3, intervalMs: 10 })
      },
      /Corrupted audio stream header/
    )
  })
})

describe('NetworkMonitor Seam', () => {
  it('đăng ký lắng nghe và nhận trạng thái mạng', () => {
    let reportedConnected = false
    const unsubscribe = networkMonitor.subscribe((status) => {
      reportedConnected = status.isConnected
    })

    assert.equal(reportedConnected, true)

    networkMonitor.setMockStatus({ isConnected: false })
    assert.equal(reportedConnected, false)

    // Khôi phục
    networkMonitor.setMockStatus({ isConnected: true })
    assert.equal(reportedConnected, true)

    unsubscribe()
  })
})
