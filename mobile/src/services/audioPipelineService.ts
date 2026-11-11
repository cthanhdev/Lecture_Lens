// Audio Pipeline Service (Matt Pocock Deep Module Pattern)
import { ApiClient, apiClient as defaultApiClient } from './apiClient.ts'
import type {
  ManifestSchema,
  TranscriptSchema,
  UploadAudioParams,
  UploadAudioResult,
} from './types.ts'

export interface PollJobOptions {
  maxAttempts?: number
  intervalMs?: number
  onProgress?: (manifest: ManifestSchema) => void
}

export class AudioPipelineService {
  private readonly client: ApiClient

  constructor(client: ApiClient = defaultApiClient) {
    this.client = client
  }

  /**
   * Upload audio file to Gateway Ingress
   */
  public async uploadLectureAudio(params: UploadAudioParams): Promise<UploadAudioResult> {
    return this.client.uploadAudio(params)
  }

  /**
   * Fetch O(1) Manifest for a given audio pipeline job
   */
  public async getJobManifest(jobId: string): Promise<ManifestSchema> {
    return this.client.get<ManifestSchema>(`/audio/${jobId}/manifest`)
  }

  /**
   * Fetch generated Transcript for a completed job or lecture
   */
  public async getLectureTranscript(lectureId: string): Promise<TranscriptSchema> {
    return this.client.get<TranscriptSchema>(`/lectures/${lectureId}/transcript`)
  }

  /**
   * Polls job status until STT reaches COMPLETED or FAILED
   */
  public async pollJobUntilComplete(
    jobId: string,
    options?: PollJobOptions
  ): Promise<ManifestSchema> {
    const maxAttempts = options?.maxAttempts || 60
    const intervalMs = options?.intervalMs || 2000

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const manifest = await this.getJobManifest(jobId)

      if (options?.onProgress) {
        options.onProgress(manifest)
      }

      const status = manifest.stt?.status

      if (status === 'COMPLETED') {
        return manifest
      }

      if (status === 'FAILED') {
        const errorDetail = manifest.stt?.last_error || 'ASR processing failed on internal engine'
        throw new Error(`Audio pipeline failed: ${errorDetail}`)
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs))
      }
    }

    throw new Error(`Audio pipeline job ${jobId} timed out after ${maxAttempts * intervalMs}ms`)
  }
}

export const audioPipelineService = new AudioPipelineService()
