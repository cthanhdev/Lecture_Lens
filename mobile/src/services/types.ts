// API & Services Type Definitions (LectureLens Mobile Deep Module)
import type { KeyValueStorage } from '../modules/storage/types.ts'

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface OriginalAudioMeta {
  filename: string
  extension: string
  size_bytes: number
  sha256?: string
  created_at: string
}

export interface NormalizedAudioMeta {
  rel_path: string
  sample_rate_hz: number
  channels: number
  bits_per_sample: number
  duration_seconds: number
}

export interface SttMeta {
  status: JobStatus
  model: string
  device: string
  attempts: number
  last_error?: string | null
  transcript_rel_path?: string | null
}

export interface ManifestSchema {
  schema_version: number
  job_id: string
  lecture_id: string
  original: OriginalAudioMeta
  normalized?: NormalizedAudioMeta | null
  stt: SttMeta
}

export interface TranscriptSegment {
  id: number
  start_time_seconds: number
  end_time_seconds: number
  timestamp_label: string
  text: string
}

export interface TranscriptSchema {
  schema_version: number
  job_id: string
  lecture_id: string
  generated: {
    model: string
    language: string
    device: string
    created_at: string
    processing_seconds: number
  }
  audio: {
    duration_seconds: number
    sample_rate_hz: number
  }
  full_text: string
  segments: TranscriptSegment[]
}

export interface CornellSummary {
  cueQuestions: string[]
  keyNotes: string[]
  summary: string
}

export interface UploadAudioParams {
  fileUri: string
  lectureId: string
  fileExtension: 'mp3' | 'wav' | 'm4a' | 'aac' | 'flac'
  fileName?: string
}

export interface UploadAudioResult {
  jobId: string
  lectureId: string
  status: string
  message: string
}

export interface ApiConfig {
  baseUrl?: string
  storage?: KeyValueStorage
  fetchFn?: typeof fetch
  timeoutMs?: number
}

export class ApiError extends Error {
  public readonly status: number
  public readonly data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export interface NetworkStatus {
  isConnected: boolean
  isInternetReachable: boolean | null
  type: string
}
