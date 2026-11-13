// Single Source of Truth for Screens 01-04 UI Copy (100% English per design spec)
import type {
  KeywordChipSpec,
  OnboardingFeatureCardSpec,
  OnboardingSlideSpec,
  WaveformBarSpec,
} from './types.ts'

export const SPLASH_COPY = {
  wordmark: 'LectureLens',
  tagline: 'Your lectures, searchable.',
  status: 'Getting things ready...',
  minimumDisplayMs: 1200,
} as const

export const ONBOARDING_SLIDES: readonly OnboardingSlideSpec[] = [
  {
    index: 0,
    headerPill: 'KITSUNE NOTE',
    contextPill: {
      icon: 'mic',
      label: 'Step 1 of 3 · Audio & Lectures',
    },
    title: 'Turn every lecture into something you can search.',
    subtitle:
      "Record in class or upload any audio. We'll transcribe and organize it for you.",
    ctaLabel: 'Continue',
    showArrowRightIcon: true,
  },
  {
    index: 1,
    headerPill: 'STEP 02 OF 03',
    contextPill: {
      icon: 'sparkles',
      label: 'EFFORTLESS CLARITY',
    },
    title: 'Highlights and summaries, done for you.',
    subtitle: 'Jump straight to the moments that matter and replay them.',
    ctaLabel: 'Continue',
    showArrowRightIcon: true,
  },
  {
    index: 2,
    title: 'Flashcards that play the original lecture.',
    subtitle: 'Review at the right time and actually remember.',
    ctaLabel: 'Get started',
    showArrowRightIcon: false,
  },
] as const

export const STEP_1_FEATURE_CARDS: readonly OnboardingFeatureCardSpec[] = [
  {
    id: 'live-voice',
    icon: 'mic',
    title: 'Live Voice',
    subtitle: 'Instant capture',
    tone: 'coral',
  },
  {
    id: 'import-file',
    icon: 'upload',
    title: 'Import File',
    subtitle: 'MP3, M4A, WAV',
    tone: 'mist',
  },
] as const

export const STEP_2_PREVIEW_COPY = {
  audioTitle: 'Macro Seminar',
  audioTimestamp: '04:18 / 32:40',
  audioBadge: 'Key Insight',
  notesHeader: 'Auto-Extracted Notes',
  syncBadge: '99.4% SYNC',
  notesQuote: '"Looking closer at global consumer..."',
  highlightText: 'Central bank actions directly dictate liquidity cycles.',
  highlightFooterLabel: 'Summary Bookmark',
  highlightTimestamp: '04:22',
} as const

// 16 waveform bars matching SVG 03 coordinates (bars 7-9 highlighted in kitsuneCoral)
export const STEP_2_WAVEFORM_BARS: readonly WaveformBarSpec[] = [
  { height: 12 },
  { height: 20 },
  { height: 14 },
  { height: 24 },
  { height: 16 },
  { height: 28 },
  { height: 34, highlighted: true },
  { height: 30, highlighted: true },
  { height: 36, highlighted: true },
  { height: 28 },
  { height: 20 },
  { height: 24 },
  { height: 14 },
  { height: 20 },
  { height: 10 },
  { height: 16 },
] as const

export const STEP_2_KEYWORD_CHIPS: readonly KeywordChipSpec[] = [
  { id: 'inflation', label: '#inflation', dotColor: '#F47F72', rotationDeg: -6 },
  { id: 'central-bank', label: 'central bank', dotColor: '#7DA7BA', rotationDeg: 1.5 },
  { id: 'interest-rate', label: 'interest rate ↗', dotColor: '#FDCBD1', rotationDeg: 8 },
] as const

export const STEP_3_FLASHCARD_COPY = {
  subject: 'Macroeconomics',
  streak: '12-day streak',
  question: 'What is cost-push inflation?',
  answer: 'Decreased aggregate supply driven by higher production costs.',
  replayLabel: 'Replay 0:24 lecture clip',
  nextReviewLabel: 'Next: 4 days',
  statusLabel: 'Mastered',
} as const

export const STEP_3_MINI_WAVEFORM_BARS: readonly WaveformBarSpec[] = [
  { height: 8, highlighted: true },
  { height: 14, highlighted: true },
  { height: 6, highlighted: true },
  { height: 12, highlighted: true },
] as const
