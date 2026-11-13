// Types for LectureLens Splash & Onboarding Deep Module Seam
import type { KeyValueStorage } from '../storage/types.ts'
import type { AuthResponse } from '../auth/domain/auth.types.ts'

export type OnboardingStepIndex = 0 | 1 | 2

export type LaunchTargetRoute =
  | '/(onboarding)/step-1'
  | '/(auth)/sign-in'
  | '/(tabs)/home'

export interface LaunchResolutionInput {
  onboardingCompleted: boolean
  hasSession: boolean
}

export interface SessionReader {
  getCurrentSession(): Promise<AuthResponse | null>
}

export interface LaunchOrchestratorDeps {
  storage: KeyValueStorage
  authSeam: SessionReader
}

export interface OnboardingFeatureCardSpec {
  id: 'live-voice' | 'import-file'
  icon: 'mic' | 'upload'
  title: string
  subtitle: string
  tone: 'coral' | 'mist'
}

export interface WaveformBarSpec {
  height: number
  highlighted?: boolean
}

export interface KeywordChipSpec {
  id: string
  label: string
  dotColor: string
  rotationDeg: number
}

export interface OnboardingSlideSpec {
  index: OnboardingStepIndex
  contextPill?: {
    icon: 'mic' | 'sparkles'
    label: string
  }
  title: string
  subtitle: string
  ctaLabel: string
  showArrowRightIcon: boolean
}

export type PreflightStageId = 'network' | 'server' | 'prepare' | 'session'

export interface PreflightProgressEvent {
  stage: PreflightStageId
  progress: number
  statusText: string
}

export interface StartupPreparer {
  id: string
  label: string
  run: () => Promise<void>
}

export interface StartupDiagnostics {
  networkConnected: boolean
  serverReachable: boolean
  serverLatencyMs: number | null
  completedPreparers: string[]
  failedPreparers: string[]
}

export interface LaunchBootstrapResult {
  targetRoute: LaunchTargetRoute
  diagnostics: StartupDiagnostics
}

export interface LaunchBootstrapDeps {
  storage: KeyValueStorage
  authSeam: SessionReader
  checkNetwork?: () => Promise<boolean>
  checkServerHealth?: () => Promise<boolean>
  preparers?: readonly StartupPreparer[]
  onProgress?: (event: PreflightProgressEvent) => void
  stepTimeoutMs?: number
  minDisplayMs?: number
  delayFn?: (ms: number) => Promise<void>
  nowFn?: () => number
}
