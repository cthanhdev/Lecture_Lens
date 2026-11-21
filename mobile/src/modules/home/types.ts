export type SubjectTone = 'mist' | 'matcha' | 'sakura' | 'mochi'

export type LectureStatus = 'ready' | 'transcribing'

export interface HomeLecture {
  readonly id: string
  readonly title: string
  readonly subject: string
  readonly subjectTone: SubjectTone
  readonly durationSec: number
  readonly status: LectureStatus
  readonly transcribeProgress?: number
  readonly jobId?: string
  readonly isDownloaded: boolean
  readonly isDeviceOnly?: boolean
}

export interface HomeHighlight {
  readonly id: string
  readonly lectureId: string
  readonly quote: string
  readonly subject: string
  readonly subjectTone: SubjectTone
  readonly timestampSec: number
}

export type StreakDayState = 'done' | 'today' | 'upcoming'

export interface StreakDay {
  readonly key: string
  readonly label: string
  readonly state: StreakDayState
}

export interface HomeDashboardSnapshot {
  readonly userFirstName: string
  readonly continueListening: {
    readonly lecture: HomeLecture
    readonly positionSec: number
    readonly playbackRate: number
  }
  readonly dueToday: {
    readonly dueCount: number
    readonly reviewedCount: number
  }
  readonly streak: {
    readonly days: number
    readonly percentileLabel: string
    readonly offlineCaption: string
    readonly weekOnline: readonly StreakDay[]
    readonly weekOffline: readonly StreakDay[]
  }
  readonly highlights: readonly HomeHighlight[]
  readonly recentlyAdded: readonly HomeLecture[]
  readonly localRecordings: readonly HomeLecture[]
}

export interface HomeHeaderViewModel {
  readonly eyebrow: string
  readonly title: string
  readonly rightAction: 'notifications' | 'profile'
}

export interface HomeHighlightViewModel {
  readonly id: string
  readonly lectureId: string
  readonly quote: string
  readonly subject: string
  readonly subjectTone: SubjectTone
  readonly timestampSec: number
  readonly timestampLabel: string
  readonly available: boolean
  readonly unavailableLabel: string | null
}

export interface HomeRecentCardViewModel {
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly status: LectureStatus
  readonly jobId?: string
  readonly transcribeProgress?: number
  readonly badgeKind:
    | 'ready'
    | 'transcribing'
    | 'device-only'
    | 'downloaded'
    | 'needs-connection'
  readonly badgeLabel: string
  readonly footnote: string | null
  readonly available: boolean
}

export interface HomeViewModel {
  readonly isOffline: boolean
  readonly header: HomeHeaderViewModel
  readonly greeting: string
  readonly dateLabel: string
  readonly showAvatarOnlineDot: boolean
  readonly offlineBannerText: string | null
  readonly search: {
    readonly placeholder: string
    readonly trailingIcon: 'filter' | 'mic-off'
    readonly hint: string | null
  }
  readonly continueListening: {
    readonly lecture: HomeLecture
    readonly positionSec: number
    readonly durationSec: number
    readonly positionLabel: string
    readonly durationLabel: string
    readonly playbackRate: number
    readonly playbackRateLabel: string
    readonly showPlaybackRateChip: boolean
    readonly showDownloadedBadge: boolean
    readonly waveformMode: 'online-highlighted' | 'offline-chunked'
  }
  readonly dueToday: {
    readonly dueCount: number
    readonly reviewedCount: number
    readonly progressRatio: number
    readonly progressText: string
    readonly subtitle: string | null
    readonly showProgressBar: boolean
    readonly showWorksOfflineBadge: boolean
    readonly headerVisual: 'cards-icon' | 'progress-ring'
  }
  readonly streak: {
    readonly days: number
    readonly icon: 'flame' | 'star'
    readonly caption: string
    readonly week: readonly StreakDay[]
  }
  readonly highlights: readonly HomeHighlightViewModel[]
  readonly recentlyAdded: readonly HomeRecentCardViewModel[]
  readonly recentlyAddedCountLabel: string
}
