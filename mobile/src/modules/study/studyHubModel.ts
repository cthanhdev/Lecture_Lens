// Study Hub & Library Deep Module (Screens 08-12)
// Pure TypeScript domain module with ZERO react-native imports.

import type {
  ContinueListeningViewModel,
  HomeHighlightItem,
  HomeRecentFileItem,
  HomeViewModel,
  HomeViewModelInput,
  LectureRecord,
  LectureStatusBadgeVariant,
  LibraryEmptyStateModel,
  LibraryLectureGroup,
  LibraryLectureItemViewModel,
  LibrarySortDirection,
  LibrarySubjectChipModel,
  LibraryViewModel,
  LibraryViewModelInput,
  StudySnapshot,
  SubjectTone,
  WaveformBarPoint,
  WaveformHighlightZone,
} from './types.ts'

export const OFFLINE_BANNER_DEFAULT_MESSAGE =
  "You're offline. Downloaded lectures still work."

export const LIBRARY_EMPTY_STATE_COPY: LibraryEmptyStateModel = {
  title: 'No recordings yet',
  subtitle: 'Record your first lecture or upload an audio file to get started.',
  primaryCtaLabel: 'Record your first lecture',
  secondaryCtaLabel: 'Upload a file',
  privacyNote: 'Recordings stay private to your account.',
  featureCards: [
    {
      id: 'auto-summaries',
      icon: 'library',
      title: 'Auto-Summaries',
      description: 'Clean chapter outlines in Japanese & English',
      tone: 'mist',
    },
    {
      id: 'smart-flashcards',
      icon: 'cards',
      title: 'Smart Flashcards',
      description: 'Spaced repetition built from every session',
      tone: 'sakura',
    },
  ],
}

const CONTINUE_LISTENING_WAVEFORM: readonly WaveformBarPoint[] = [
  { height: 10, highlighted: true },
  { height: 16, highlighted: true },
  { height: 22, highlighted: true },
  { height: 14, highlighted: true },
  { height: 26, highlighted: true },
  { height: 18, highlighted: true },
  { height: 24, highlighted: true },
  { height: 30, highlighted: true },
  { height: 26, highlighted: true },
  { height: 32, highlighted: true },
  { height: 22, highlighted: true },
  { height: 28, highlighted: true },
  { height: 18, highlighted: true },
  { height: 24, highlighted: true },
  { height: 16, highlighted: true },
  { height: 20, highlighted: true },
  { height: 28, highlighted: false },
  { height: 22, highlighted: false },
  { height: 14, highlighted: false },
  { height: 26, highlighted: false },
  { height: 18, highlighted: false },
  { height: 12, highlighted: false },
  { height: 20, highlighted: false },
  { height: 14, highlighted: false },
]

const CONTINUE_LISTENING_HIGHLIGHT_ZONES: readonly WaveformHighlightZone[] = [
  { startIndex: 6, endIndex: 9 },
  { startIndex: 15, endIndex: 18 },
]

export const DEFAULT_STUDY_SNAPSHOT: StudySnapshot = {
  userName: 'Minh',
  dateSubtitle: 'Wednesday, Nov 4',
  continueListeningId: 'lecture-7-macro',
  continueListeningWaveform: CONTINUE_LISTENING_WAVEFORM,
  continueListeningHighlightZones: CONTINUE_LISTENING_HIGHLIGHT_ZONES,
  lectures: [
    {
      id: 'lecture-7-macro',
      title: 'Lecture 7: Inflation & Monetary Policy',
      subject: 'Macroeconomics',
      subjectTone: 'mist',
      status: 'ready',
      durationSeconds: 2900, // 48:20
      currentTimeSeconds: 1798, // 29:58
      playbackRate: 1.25,
      dateGroup: 'Today',
      dateLabel: 'Nov 3',
      recordedAtOrder: 6,
      isDownloaded: true,
      isAvailableOffline: true,
    },
    {
      id: 'lab-safety-reagents',
      title: 'Lab Safety & Reagents',
      subject: 'Organic Chemistry',
      subjectTone: 'mochi',
      status: 'transcribing',
      transcribeProgress: 45,
      durationSeconds: 4325, // 1:12:05
      dateGroup: 'Today',
      dateLabel: 'Nov 3',
      recordedAtOrder: 5,
      isDownloaded: false,
      isAvailableOffline: false,
    },
    {
      id: 'cell-membrane-transport',
      title: 'Cell Membrane Transport',
      subject: 'Cell Biology',
      subjectTone: 'sakura',
      status: 'ready',
      durationSeconds: 2200, // 36:40
      dateGroup: 'Today',
      dateLabel: 'Nov 3',
      recordedAtOrder: 4,
      isDownloaded: true,
      isAvailableOffline: true,
    },
    {
      id: 'lecture-6-gdp',
      title: 'Lecture 6: GDP & Growth',
      subject: 'Macroeconomics',
      subjectTone: 'mist',
      status: 'ready',
      durationSeconds: 3130, // 52:10
      dateGroup: 'Last week',
      dateLabel: 'Oct 28',
      recordedAtOrder: 3,
      isDownloaded: false,
      isAvailableOffline: false,
    },
    {
      id: 'memory-cognition',
      title: 'Memory & Cognition',
      subject: 'Psychology',
      subjectTone: 'sakura',
      status: 'ready',
      durationSeconds: 2655, // 44:15
      dateGroup: 'Last week',
      dateLabel: 'Oct 26',
      recordedAtOrder: 2,
      isDownloaded: false,
      isAvailableOffline: false,
    },
    {
      id: 'seminar-recording',
      title: 'Seminar recording',
      subject: 'General Seminar',
      subjectTone: 'mochi',
      status: 'failed',
      durationSeconds: 1110, // 18:30
      dateGroup: 'Last week',
      dateLabel: 'Oct 24',
      recordedAtOrder: 1,
      isDownloaded: false,
      isAvailableOffline: false,
    },
  ],
  dueToday: {
    dueCount: 34,
    completedCount: 12,
    totalCount: 34,
  },
  streak: {
    days: 12,
    weekDays: [
      { label: 'M', completed: true, isToday: false },
      { label: 'T', completed: true, isToday: false },
      { label: 'W', completed: true, isToday: false },
      { label: 'T', completed: true, isToday: false },
      { label: 'F', completed: false, isToday: true },
      { label: 'S', completed: false, isToday: false },
      { label: 'S', completed: false, isToday: false },
    ],
  },
  highlights: [
    {
      id: 'hl-cost-push',
      lectureId: 'lecture-7-macro',
      quote: '“Cost-push inflation comes from rising production costs, not demand.”',
      subject: 'Macroeconomics',
      subjectTone: 'mist',
      timestampSeconds: 761, // 12:41
      isAvailableOffline: true,
    },
    {
      id: 'hl-keynesian',
      lectureId: 'lecture-6-gdp',
      quote: '“The Keynesian multiplier increases proportionally with MPC.”',
      subject: 'Econ 201',
      subjectTone: 'matcha',
      timestampSeconds: 1695, // 28:15
      isAvailableOffline: false,
    },
    {
      id: 'hl-central-banks',
      lectureId: 'lecture-7-macro',
      quote: '“Central banks raise rates to compress aggregate spending cycles.”',
      subject: 'Macroeconomics',
      subjectTone: 'sakura',
      timestampSeconds: 2390, // 39:50
      isAvailableOffline: true,
    },
  ],
  recentFiles: [
    {
      id: 'recent-macro-2',
      lectureId: 'lecture-7-macro',
      title: 'Macroeconomics Part 2',
      onlineDurationLabel: '48 min',
      offlineSubtitleLabel: '48:20',
      status: 'ready',
      isDownloaded: true,
      isAvailableOffline: true,
      showWhenOnline: true,
      showWhenOffline: false,
    },
    {
      id: 'recent-lecture-8-device',
      lectureId: 'lecture-8-live',
      title: 'Lecture 8',
      onlineDurationLabel: 'Live recording',
      offlineSubtitleLabel: 'Live recording',
      status: 'device-only',
      isDownloaded: false,
      isAvailableOffline: true,
      showWhenOnline: false,
      showWhenOffline: true,
      secondaryHint: 'Syncs when online',
    },
    {
      id: 'recent-cell-membrane',
      lectureId: 'cell-membrane-transport',
      title: 'Cell Membrane Transport',
      onlineDurationLabel: '36 min',
      offlineSubtitleLabel: '36:40',
      status: 'ready',
      isDownloaded: true,
      isAvailableOffline: true,
      showWhenOnline: false,
      showWhenOffline: true,
    },
    {
      id: 'recent-org-chem-4',
      lectureId: 'lab-safety-reagents',
      title: 'Organic Chem Lab 4',
      onlineDurationLabel: '32 min',
      offlineSubtitleLabel: '32 min',
      status: 'transcribing',
      transcribeProgress: 45,
      isDownloaded: false,
      isAvailableOffline: false,
      showWhenOnline: true,
      showWhenOffline: true,
    },
    {
      id: 'recent-psych',
      lectureId: 'memory-cognition',
      title: 'Psychology Seminar',
      onlineDurationLabel: '55 min',
      offlineSubtitleLabel: '44:15',
      status: 'ready',
      isDownloaded: false,
      isAvailableOffline: false,
      showWhenOnline: true,
      showWhenOffline: false,
    },
  ],
}

export function formatDurationTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  const ss = seconds.toString().padStart(2, '0')
  if (hours > 0) {
    const mm = minutes.toString().padStart(2, '0')
    return `${hours}:${mm}:${ss}`
  }
  const mm = minutes.toString().padStart(2, '0')
  return `${mm}:${ss}`
}

export function isLectureAccessibleOffline(lecture: Pick<LectureRecord, 'status' | 'isDownloaded' | 'isAvailableOffline'>): boolean {
  if (lecture.isDownloaded) {
    return true
  }
  if (lecture.status === 'device-only' && lecture.isAvailableOffline) {
    return true
  }
  return lecture.isAvailableOffline
}

function resolveLectureBadgeVariant(
  lecture: Pick<LectureRecord, 'status' | 'isDownloaded' | 'isAvailableOffline'>,
  isOffline: boolean,
): LectureStatusBadgeVariant {
  if (isOffline) {
    if (lecture.status === 'device-only' && lecture.isAvailableOffline) {
      return 'device-only'
    }
    if (lecture.isDownloaded) {
      return 'downloaded'
    }
    if (lecture.isAvailableOffline) {
      return 'ready'
    }
    return 'needs-connection'
  }

  return lecture.status
}

function sortLectures(
  lectures: readonly LectureRecord[],
  sortDirection: LibrarySortDirection,
): LectureRecord[] {
  const factor = sortDirection === 'asc' ? 1 : -1
  return [...lectures].sort((a, b) => (a.recordedAtOrder - b.recordedAtOrder) * factor)
}

function buildContinueListening(
  snapshot: StudySnapshot,
  input: HomeViewModelInput,
): ContinueListeningViewModel | null {
  const preferredId = input.activeTrackId ?? snapshot.continueListeningId
  const target =
    snapshot.lectures.find((item) => item.id === preferredId) ??
    snapshot.lectures.find((item) => item.id === snapshot.continueListeningId) ??
    snapshot.lectures[0]

  if (!target) {
    return null
  }

  const currentTimeSeconds = Math.min(
    target.durationSeconds,
    Math.max(0, input.currentTimeSeconds ?? target.currentTimeSeconds ?? 0),
  )
  const playbackRate = input.playbackRate ?? target.playbackRate ?? 1.25

  return {
    lectureId: target.id,
    title: target.title,
    subject: target.subject,
    subjectTone: target.subjectTone,
    currentTimeSeconds,
    durationSeconds: target.durationSeconds,
    currentTimeLabel: formatDurationTimestamp(currentTimeSeconds),
    durationLabel: formatDurationTimestamp(target.durationSeconds),
    playbackRate,
    playbackRateLabel: `${playbackRate}x`,
    isDownloaded: target.isDownloaded,
    isAvailableOffline: isLectureAccessibleOffline(target),
    waveformBars: snapshot.continueListeningWaveform,
    highlightZones: snapshot.continueListeningHighlightZones,
  }
}

export function buildHomeViewModel(
  snapshot: StudySnapshot = DEFAULT_STUDY_SNAPSHOT,
  input: HomeViewModelInput = {},
): HomeViewModel {
  const isOffline = Boolean(input.isOffline)
  const continueListening = buildContinueListening(snapshot, input)

  const totalCount = Math.max(0, snapshot.dueToday.totalCount)
  const completedCount = Math.min(totalCount, Math.max(0, snapshot.dueToday.completedCount))
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0

  const mappedHighlights: HomeHighlightItem[] = snapshot.highlights.map((hl) => ({
    id: hl.id,
    lectureId: hl.lectureId,
    quote: hl.quote,
    subject: hl.subject,
    subjectTone: hl.subjectTone,
    timestampSeconds: hl.timestampSeconds,
    timestampLabel: formatDurationTimestamp(hl.timestampSeconds),
    isAvailableOffline: hl.isAvailableOffline,
    needsConnection: isOffline && !hl.isAvailableOffline,
  }))

  const orderedHighlights = isOffline
    ? [
        ...mappedHighlights.filter((hl) => hl.isAvailableOffline),
        ...mappedHighlights.filter((hl) => !hl.isAvailableOffline),
      ]
    : mappedHighlights

  const recentFilesForMode = snapshot.recentFiles.filter((file) =>
    isOffline ? file.showWhenOffline : file.showWhenOnline,
  )

  const recentlyAdded: HomeRecentFileItem[] = recentFilesForMode.map((file) => {
    const badgeVariant = resolveLectureBadgeVariant(file, isOffline)
    return {
      id: file.id,
      lectureId: file.lectureId,
      title: file.title,
      subtitleLabel: isOffline ? file.offlineSubtitleLabel : file.onlineDurationLabel,
      badgeVariant,
      transcribeProgress: badgeVariant === 'transcribing' ? file.transcribeProgress : undefined,
      secondaryHint: file.secondaryHint,
      isAvailableOffline: isLectureAccessibleOffline(file),
    }
  })

  return {
    isOffline,
    topBarOverline: isOffline ? 'KITSUNE' : 'KITSUNE SOFT',
    topBarTitle: isOffline ? 'Study Home' : 'Study Hub',
    greetingTitle: `Good morning, ${snapshot.userName}`,
    dateSubtitle: snapshot.dateSubtitle,
    offlineBanner: {
      visible: isOffline,
      message: OFFLINE_BANNER_DEFAULT_MESSAGE,
    },
    searchPlaceholder: isOffline
      ? 'Search downloaded lectures'
      : 'Search all your lectures...',
    searchHint: isOffline ? 'Full search needs a connection.' : undefined,
    continueListening,
    dueToday: {
      eyebrow: 'DUE TODAY',
      dueCount: snapshot.dueToday.dueCount,
      completedCount,
      totalCount,
      progressRatio,
      progressLabel: `${completedCount}/${totalCount}`,
      ctaLabel: 'Start review',
      worksOffline: true,
      offlineHint: isOffline ? 'Works offline' : undefined,
    },
    streak: {
      eyebrow: 'STREAK',
      days: snapshot.streak.days,
      subtitle: isOffline ? 'Daily streak active' : 'Top 5% consistency',
      weekDays: snapshot.streak.weekDays,
    },
    recentHighlights: orderedHighlights,
    recentlyAdded,
    recentlyAddedCountLabel: `${recentlyAdded.length} ${recentlyAdded.length === 1 ? 'file' : 'files'}`,
  }
}

function buildSubjectChips(
  lectures: readonly LectureRecord[],
  selectedSubject: string,
): LibrarySubjectChipModel[] {
  const subjectCounts = new Map<string, { count: number; tone: SubjectTone }>()
  for (const lecture of lectures) {
    const existing = subjectCounts.get(lecture.subject)
    if (existing) {
      existing.count += 1
    } else {
      subjectCounts.set(lecture.subject, { count: 1, tone: lecture.subjectTone })
    }
  }

  const chips: LibrarySubjectChipModel[] = [
    {
      id: 'all',
      label: 'All',
      count: lectures.length,
      active: selectedSubject === 'all',
    },
  ]

  for (const [subject, meta] of subjectCounts.entries()) {
    chips.push({
      id: subject,
      label: subject,
      count: meta.count,
      tone: meta.tone,
      active: selectedSubject === subject,
    })
  }

  return chips
}

function toLectureItemViewModel(
  lecture: LectureRecord,
  isOffline: boolean,
): LibraryLectureItemViewModel {
  const availableOffline = isLectureAccessibleOffline(lecture)
  const badgeVariant = resolveLectureBadgeVariant(lecture, isOffline)
  const durationLabel = formatDurationTimestamp(lecture.durationSeconds)
  const metaLabel =
    isOffline && availableOffline
      ? durationLabel
      : `${durationLabel} · ${lecture.dateLabel}`

  return {
    id: lecture.id,
    title: lecture.title,
    subject: lecture.subject,
    subjectTone: lecture.subjectTone,
    status: lecture.status,
    badgeVariant,
    transcribeProgress:
      badgeVariant === 'transcribing' ? lecture.transcribeProgress : undefined,
    durationLabel,
    dateLabel: lecture.dateLabel,
    metaLabel,
    isDownloaded: lecture.isDownloaded,
    isAvailableOffline: availableOffline,
    isLockedOffline: isOffline && !availableOffline,
    canRetry: !isOffline && lecture.status === 'failed',
  }
}

function buildArchiveGroups(
  lectures: readonly LectureRecord[],
  sortMode: 'recent' | 'by-subject',
  sortDirection: LibrarySortDirection,
): LibraryLectureGroup[] {
  const sorted = sortLectures(lectures, sortDirection)

  if (sortMode === 'by-subject') {
    const subjectBuckets = new Map<string, LectureRecord[]>()
    for (const item of sorted) {
      const bucket = subjectBuckets.get(item.subject)
      if (bucket) {
        bucket.push(item)
      } else {
        subjectBuckets.set(item.subject, [item])
      }
    }

    return Array.from(subjectBuckets.entries()).map(([subject, items]) => ({
      id: `subject-${subject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: subject,
      countBadgeText: `${items.length} ${items.length === 1 ? 'recording' : 'recordings'}`,
      items: items.map((item) => toLectureItemViewModel(item, false)),
    }))
  }

  const groupOrder: readonly ('Today' | 'Last week')[] =
    sortDirection === 'asc' ? ['Last week', 'Today'] : ['Today', 'Last week']

  const groups: LibraryLectureGroup[] = []
  groupOrder.forEach((groupName) => {
    const bucket = sorted.filter((item) => item.dateGroup === groupName)
    if (bucket.length === 0) {
      return
    }
    groups.push({
      id: groupName.toLowerCase().replace(/\s+/g, '-'),
      title: groupName,
      countBadgeText: `${bucket.length} ${bucket.length === 1 ? 'recording' : 'recordings'}`,
      rightActionLabel: groups.length === 0 ? 'Select' : undefined,
      items: bucket.map((item) => toLectureItemViewModel(item, false)),
    })
  })

  return groups
}

function buildOfflineGroups(
  lectures: readonly LectureRecord[],
  sortDirection: LibrarySortDirection,
  offlineFilter: 'all' | 'downloaded',
): LibraryLectureGroup[] {
  const sorted = sortLectures(lectures, sortDirection)
  const available = sorted.filter((item) => isLectureAccessibleOffline(item))
  const unavailable = sorted.filter((item) => !isLectureAccessibleOffline(item))

  const groups: LibraryLectureGroup[] = []
  if (available.length > 0) {
    groups.push({
      id: 'offline-ready',
      title: 'Today',
      countBadgeText: `${available.length} Ready`,
      rightActionLabel: available[0].dateLabel,
      items: available.map((item) => toLectureItemViewModel(item, true)),
    })
  }

  if (offlineFilter === 'all' && unavailable.length > 0) {
    groups.push({
      id: 'offline-unavailable',
      title: 'Previous Sessions',
      countBadgeText: `${unavailable.length} unavailable`,
      rightActionLabel: 'Offline unavailable',
      items: unavailable.map((item) => toLectureItemViewModel(item, true)),
    })
  }

  return groups
}

export function buildLibraryViewModel(
  snapshot: StudySnapshot = DEFAULT_STUDY_SNAPSHOT,
  input: LibraryViewModelInput = {},
): LibraryViewModel {
  const isOffline = Boolean(input.isOffline)
  const sortMode = input.sortMode ?? 'recent'
  const sortDirection = input.sortDirection ?? 'desc'
  const offlineFilter = input.offlineFilter ?? 'all'

  if (snapshot.lectures.length === 0) {
    return {
      mode: 'empty',
      isOffline,
      eyebrow: 'LIBRARY',
      title: 'Library',
      headerBadgeText: '0 items',
      offlineBanner: {
        visible: isOffline,
        message: OFFLINE_BANNER_DEFAULT_MESSAGE,
        secondaryHint: isOffline ? 'Flashcard review works offline too.' : undefined,
      },
      selectedSubject: 'all',
      sortMode,
      sortDirection,
      offlineFilter,
      subjectChips: [{ id: 'all', label: 'All', count: 0, active: true }],
      groups: [],
      totalLectureCount: 0,
      visibleLectureCount: 0,
      emptyState: LIBRARY_EMPTY_STATE_COPY,
    }
  }

  const rawSubject = input.selectedSubject ?? 'all'
  const hasSubjectMatch =
    rawSubject === 'all' ||
    snapshot.lectures.some((lecture) => lecture.subject === rawSubject)
  const selectedSubject = hasSubjectMatch ? rawSubject : 'all'

  const subjectFiltered =
    selectedSubject === 'all'
      ? snapshot.lectures
      : snapshot.lectures.filter((lecture) => lecture.subject === selectedSubject)

  const subjectChips = buildSubjectChips(snapshot.lectures, selectedSubject)

  if (isOffline) {
    const groups = buildOfflineGroups(subjectFiltered, sortDirection, offlineFilter)
    const visibleLectureCount = groups.reduce((acc, g) => acc + g.items.length, 0)

    return {
      mode: 'offline',
      isOffline: true,
      eyebrow: 'LIBRARY',
      title: 'Library',
      subtitle: 'Offline Study Vault',
      headerBadgeText: 'Offline Mode',
      offlineBanner: {
        visible: true,
        message: OFFLINE_BANNER_DEFAULT_MESSAGE,
        secondaryHint: 'Flashcard review works offline too.',
      },
      selectedSubject,
      sortMode,
      sortDirection,
      offlineFilter,
      subjectChips,
      groups,
      totalLectureCount: snapshot.lectures.length,
      visibleLectureCount,
      emptyState: null,
    }
  }

  const groups = buildArchiveGroups(subjectFiltered, sortMode, sortDirection)
  const visibleLectureCount = groups.reduce((acc, g) => acc + g.items.length, 0)

  return {
    mode: 'archive',
    isOffline: false,
    eyebrow: 'ARCHIVE',
    title: 'Library',
    offlineBanner: {
      visible: false,
      message: OFFLINE_BANNER_DEFAULT_MESSAGE,
    },
    selectedSubject,
    sortMode,
    sortDirection,
    offlineFilter,
    subjectChips,
    groups,
    totalLectureCount: snapshot.lectures.length,
    visibleLectureCount,
    emptyState: null,
  }
}
