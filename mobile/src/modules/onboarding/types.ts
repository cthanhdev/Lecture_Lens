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
  headerPill?: string
  contextPill?: {
    icon: 'mic' | 'sparkles'
    label: string
  }
  title: string
  subtitle: string
  ctaLabel: string
  showArrowRightIcon: boolean
}
