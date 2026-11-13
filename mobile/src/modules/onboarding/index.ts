export type * from './types.ts'
export {
  SPLASH_COPY,
  ONBOARDING_SLIDES,
  STEP_1_FEATURE_CARDS,
  STEP_2_PREVIEW_COPY,
  STEP_2_WAVEFORM_BARS,
  STEP_2_KEYWORD_CHIPS,
  STEP_3_FLASHCARD_COPY,
  STEP_3_MINI_WAVEFORM_BARS,
} from './onboardingSlides.ts'
export {
  ONBOARDING_STORAGE_KEY,
  isOnboardingCompleted,
  markOnboardingCompleted,
  resolveLaunchRoute,
  clampOnboardingStep,
  hydrateLaunchRoute,
  completeOnboarding,
} from './launchOrchestrator.ts'
export { runLaunchBootstrap } from './launchPreflight.ts'
