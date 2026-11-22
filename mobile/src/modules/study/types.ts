// Unified Domain & ViewModel Types for Screens 08-12 (Home & Library)
// Pure TypeScript module (ZERO react-native imports)

export type LectureStatus = 'ready' | 'transcribing' | 'failed' | 'device-only'

export type SubjectTone = 'mist' | 'matcha' | 'sakura' | 'mochi'

export type LibrarySortMode = 'recent' | 'by-subject'

export type LibrarySortDirection = 'desc' | 'asc'

export type OfflineFilterMode = 'all' | 'downloaded'

export type LectureStatusBadgeVariant =
  | 'ready'
  | 'transcribing'
  | 'downloaded'
  | 'device-only'
  | 'failed'
  | 'needs-connection'

export interface WaveformBarPoint {
  readonly height: number
  readonly highlighted?: boolean
}

export interface WaveformHighlightZone {
  readonly startIndex: number
  readonly endIndex: number
}

export interface LectureRecord {
  readonly id: string
  readonly title: string
  readonly subject: string
  readonly subjectTone: SubjectTone
  readonly status: LectureStatus
  readonly transcribeProgress?: number
  readonly durationSeconds: number
  readonly currentTimeSeconds?: number
  readonly playbackRate?: number
  readonly dateGroup: 'Today' | 'Last week'
  readonly dateLabel: string
  readonly recordedAtOrder: number
  readonly isDownloaded: boolean
  readonly isAvailableOffline: boolean
}

export interface StudyHighlightRecord {
  readonly id: string
  readonly lectureId: string
  readonly quote: string
  readonly subject: string
  readonly subjectTone: SubjectTone
  readonly timestampSeconds: number
  readonly isAvailableOffline: boolean
}

export interface StudyRecentFileRecord {
  readonly id: string
  readonly lectureId: string
  readonly title: string
  readonly onlineDurationLabel: string
  readonly offlineSubtitleLabel: string
  readonly status: LectureStatus
  readonly transcribeProgress?: number
  readonly isDownloaded: boolean
  readonly isAvailableOffline: boolean
  readonly showWhenOnline: boolean
  readonly showWhenOffline: boolean
  readonly secondaryHint?: string
}

export interface StreakDayStatus {
  readonly label: string
  readonly completed: boolean
  readonly isToday: boolean
}

export interface StudySnapshot {
  readonly userName: string
  readonly dateSubtitle: string
  readonly lectures: readonly LectureRecord[]
  readonly continueListeningId: string | null
  readonly continueListeningWaveform: readonly WaveformBarPoint[]
  readonly continueListeningHighlightZones: readonly WaveformHighlightZone[]
  readonly dueToday: {
    readonly dueCount: number
    readonly completedCount: number
    readonly totalCount: number
  }
  readonly streak: {
    readonly days: number
    readonly weekDays: readonly StreakDayStatus[]
  }
  readonly highlights: readonly StudyHighlightRecord[]
  readonly recentFiles: readonly StudyRecentFileRecord[]
}

export interface OfflineBannerModel {
  readonly visible: boolean
  readonly message: string
  readonly secondaryHint?: string
}

export interface ContinueListeningViewModel {
  readonly lectureId: string
  readonly title: string
  readonly subject: string
  readonly subjectTone: SubjectTone
  readonly currentTimeSeconds: number
  readonly durationSeconds: number
  readonly currentTimeLabel: string
  readonly durationLabel: string
  readonly playbackRate: number
  readonly playbackRateLabel: string
  readonly isDownloaded: boolean
  readonly isAvailableOffline: boolean
  readonly waveformBars: readonly WaveformBarPoint[]
  readonly highlightZones: readonly WaveformHighlightZone[]
}

export interface DueTodayViewModel {
  readonly eyebrow: string
  readonly dueCount: number
  readonly completedCount: number
  readonly totalCount: number
  readonly progressRatio: number
  readonly progressLabel: string
  readonly ctaLabel: string
  readonly worksOffline: boolean
  readonly offlineHint?: string
}

export interface StreakViewModel {
  readonly eyebrow: string
  readonly days: number
  readonly subtitle: string
  readonly weekDays: readonly StreakDayStatus[]
}

export interface HomeHighlightItem {
  readonly id: string
  readonly lectureId: string
  readonly quote: string
  readonly subject: string
  readonly subjectTone: SubjectTone
  readonly timestampSeconds: number
  readonly timestampLabel: string
  readonly isAvailableOffline: boolean
  readonly needsConnection: boolean
}

export interface HomeRecentFileItem {
  readonly id: string
  readonly lectureId: string
  readonly title: string
  readonly subtitleLabel: string
  readonly badgeVariant: LectureStatusBadgeVariant
  readonly transcribeProgress?: number
  readonly secondaryHint?: string
  readonly isAvailableOffline: boolean
}

export interface HomeViewModelInput {
  readonly isOffline?: boolean
  readonly activeTrackId?: string
  readonly currentTimeSeconds?: number
  readonly playbackRate?: number
}

export interface HomeViewModel {
  readonly isOffline: boolean
  readonly topBarOverline: string
  readonly topBarTitle: string
  readonly greetingTitle: string
  readonly dateSubtitle: string
  readonly offlineBanner: OfflineBannerModel
  readonly searchPlaceholder: string
  readonly searchHint?: string
  readonly continueListening: ContinueListeningViewModel | null
  readonly dueToday: DueTodayViewModel
  readonly streak: StreakViewModel
  readonly recentHighlights: readonly HomeHighlightItem[]
  readonly recentlyAdded: readonly HomeRecentFileItem[]
  readonly recentlyAddedCountLabel: string
}

export interface LibrarySubjectChipModel {
  readonly id: string
  readonly label: string
  readonly count: number
  readonly tone?: SubjectTone
  readonly active: boolean
}

export interface LibraryLectureItemViewModel {
  readonly id: string
  readonly title: string
  readonly subject: string
  readonly subjectTone: SubjectTone
  readonly status: LectureStatus
  readonly badgeVariant: LectureStatusBadgeVariant
  readonly transcribeProgress?: number
  readonly durationLabel: string
  readonly dateLabel: string
  readonly metaLabel: string
  readonly isDownloaded: boolean
  readonly isAvailableOffline: boolean
  readonly isLockedOffline: boolean
  readonly canRetry: boolean
}

export interface LibraryLectureGroup {
  readonly id: string
  readonly title: string
  readonly countBadgeText: string
  readonly rightActionLabel?: string
  readonly items: readonly LibraryLectureItemViewModel[]
}

export interface LibraryEmptyFeatureCard {
  readonly id: string
  readonly icon: 'library' | 'cards'
  readonly title: string
  readonly description: string
  readonly tone: SubjectTone
}

export interface LibraryEmptyStateModel {
  readonly title: string
  readonly subtitle: string
  readonly primaryCtaLabel: string
  readonly secondaryCtaLabel: string
  readonly privacyNote: string
  readonly featureCards: readonly LibraryEmptyFeatureCard[]
}

export interface LibraryViewModelInput {
  readonly isOffline?: boolean
  readonly selectedSubject?: string
  readonly sortMode?: LibrarySortMode
  readonly sortDirection?: LibrarySortDirection
  readonly offlineFilter?: OfflineFilterMode
}

export interface LibraryViewModel {
  readonly mode: 'archive' | 'empty' | 'offline'
  readonly isOffline: boolean
  readonly eyebrow: string
  readonly title: string
  readonly subtitle?: string
  readonly headerBadgeText?: string
  readonly offlineBanner: OfflineBannerModel
  readonly selectedSubject: string
  readonly sortMode: LibrarySortMode
  readonly sortDirection: LibrarySortDirection
  readonly offlineFilter: OfflineFilterMode
  readonly subjectChips: readonly LibrarySubjectChipModel[]
  readonly groups: readonly LibraryLectureGroup[]
  readonly totalLectureCount: number
  readonly visibleLectureCount: number
  readonly emptyState: LibraryEmptyStateModel | null
}
