import type {
  HomeDashboardSnapshot,
  HomeHighlightViewModel,
  HomeLecture,
  HomeRecentCardViewModel,
  HomeViewModel,
} from './types.ts'

export function formatClock(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatMinutes(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds / 60)) : 0
  return `${safe} min`
}

export function buildOfflineBannerCopy(): string {
  return "You're offline. Downloaded lectures still work."
}

function resolveGreeting(firstName: string, now: Date): string {
  const hour = now.getHours()
  if (hour < 12) return `Good morning, ${firstName}`
  if (hour < 18) return `Good afternoon, ${firstName}`
  return `Good evening, ${firstName}`
}

function formatStudyDate(now: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(now)
}

function buildDownloadedLectureIds(snapshot: HomeDashboardSnapshot): Set<string> {
  const ids = new Set<string>()
  if (snapshot.continueListening.lecture.isDownloaded) {
    ids.add(snapshot.continueListening.lecture.id)
  }
  for (const item of snapshot.recentlyAdded) {
    if (item.isDownloaded) ids.add(item.id)
  }
  for (const item of snapshot.localRecordings) {
    if (item.isDownloaded) ids.add(item.id)
  }
  return ids
}

function mapOnlineRecentCard(lecture: HomeLecture): HomeRecentCardViewModel {
  if (lecture.status === 'transcribing') {
    const progress = lecture.transcribeProgress ?? 0
    return {
      id: lecture.id,
      title: lecture.title,
      subtitle: formatMinutes(lecture.durationSec),
      status: lecture.status,
      jobId: lecture.jobId,
      transcribeProgress: progress,
      badgeKind: 'transcribing',
      badgeLabel: 'Transcribing',
      footnote: `${progress}%`,
      available: true,
    }
  }

  return {
    id: lecture.id,
    title: lecture.title,
    subtitle: formatMinutes(lecture.durationSec),
    status: lecture.status,
    badgeKind: 'ready',
    badgeLabel: 'Ready',
    footnote: null,
    available: true,
  }
}

function mapOfflineRecentCards(
  snapshot: HomeDashboardSnapshot,
): HomeRecentCardViewModel[] {
  const deviceOnly: HomeRecentCardViewModel[] = []
  const downloaded: HomeRecentCardViewModel[] = []
  const needsConnection: HomeRecentCardViewModel[] = []

  const seenIds = new Set<string>()
  const combined = [...snapshot.localRecordings, ...snapshot.recentlyAdded]

  for (const lecture of combined) {
    if (seenIds.has(lecture.id)) continue
    seenIds.add(lecture.id)

    if (lecture.isDeviceOnly) {
      deviceOnly.push({
        id: lecture.id,
        title: lecture.title,
        subtitle:
          lecture.durationSec > 0 ? formatClock(lecture.durationSec) : 'Live recording',
        status: lecture.status,
        badgeKind: 'device-only',
        badgeLabel: 'Device only',
        footnote: 'Syncs when online',
        available: true,
      })
    } else if (lecture.isDownloaded) {
      downloaded.push({
        id: lecture.id,
        title: lecture.title,
        subtitle: formatClock(lecture.durationSec),
        status: lecture.status,
        badgeKind: 'downloaded',
        badgeLabel: 'Downloaded',
        footnote: null,
        available: true,
      })
    } else {
      needsConnection.push({
        id: lecture.id,
        title: lecture.title,
        subtitle: formatMinutes(lecture.durationSec),
        status: lecture.status,
        jobId: lecture.jobId,
        transcribeProgress: lecture.transcribeProgress,
        badgeKind: 'needs-connection',
        badgeLabel: 'Needs connection',
        footnote: null,
        available: false,
      })
    }
  }

  // Prioritize transcribing/pending lectures visibly right after downloaded cards
  needsConnection.sort((a, b) => {
    const aIsTranscribing = a.status === 'transcribing' ? 0 : 1
    const bIsTranscribing = b.status === 'transcribing' ? 0 : 1
    return aIsTranscribing - bIsTranscribing
  })

  return [...deviceOnly, ...downloaded, ...needsConnection]
}

export interface ResolveHomeViewModelInput {
  readonly isOffline: boolean
  readonly now?: Date
}

export function resolveHomeViewModel(
  snapshot: HomeDashboardSnapshot,
  input: ResolveHomeViewModelInput,
): HomeViewModel {
  const now = input.now ?? new Date()
  const isOffline = input.isOffline
  const downloadedIds = buildDownloadedLectureIds(snapshot)

  const highlights: HomeHighlightViewModel[] = snapshot.highlights.map((hl) => {
    const available = isOffline ? downloadedIds.has(hl.lectureId) : true
    return {
      id: hl.id,
      lectureId: hl.lectureId,
      quote: hl.quote,
      subject: hl.subject,
      subjectTone: hl.subjectTone,
      timestampSec: hl.timestampSec,
      timestampLabel: formatClock(hl.timestampSec),
      available,
      unavailableLabel: available ? null : 'Needs connection',
    }
  })

  if (isOffline) {
    highlights.sort((a, b) => Number(b.available) - Number(a.available))
  }

  const recentlyAdded = isOffline
    ? mapOfflineRecentCards(snapshot)
    : snapshot.recentlyAdded.map(mapOnlineRecentCard)

  const { dueCount, reviewedCount } = snapshot.dueToday
  const progressRatio = dueCount > 0 ? Math.min(1, Math.max(0, reviewedCount / dueCount)) : 0

  return {
    isOffline,
    header: isOffline
      ? {
          eyebrow: 'KITSUNE',
          title: 'Study Home',
          rightAction: 'profile',
        }
      : {
          eyebrow: 'KITSUNE SOFT',
          title: 'Study Hub',
          rightAction: 'notifications',
        },
    greeting: resolveGreeting(snapshot.userFirstName, now),
    dateLabel: formatStudyDate(now),
    showAvatarOnlineDot: !isOffline,
    offlineBannerText: isOffline ? buildOfflineBannerCopy() : null,
    search: isOffline
      ? {
          placeholder: 'Search downloaded lectures',
          trailingIcon: 'mic-off',
          hint: 'Full search needs a connection.',
        }
      : {
          placeholder: 'Search all your lectures...',
          trailingIcon: 'filter',
          hint: null,
        },
    continueListening: {
      lecture: snapshot.continueListening.lecture,
      positionSec: snapshot.continueListening.positionSec,
      durationSec: snapshot.continueListening.lecture.durationSec,
      positionLabel: formatClock(snapshot.continueListening.positionSec),
      durationLabel: formatClock(snapshot.continueListening.lecture.durationSec),
      playbackRate: snapshot.continueListening.playbackRate,
      playbackRateLabel: `${snapshot.continueListening.playbackRate}x`,
      showPlaybackRateChip: !isOffline,
      showDownloadedBadge: isOffline && snapshot.continueListening.lecture.isDownloaded,
      waveformMode: isOffline ? 'offline-chunked' : 'online-highlighted',
    },
    dueToday: {
      dueCount,
      reviewedCount,
      progressRatio,
      progressText: `${reviewedCount}/${dueCount}`,
      subtitle: isOffline ? 'to review' : null,
      showProgressBar: !isOffline,
      showWorksOfflineBadge: isOffline,
      headerVisual: isOffline ? 'progress-ring' : 'cards-icon',
    },
    streak: {
      days: snapshot.streak.days,
      icon: isOffline ? 'star' : 'flame',
      caption: isOffline ? snapshot.streak.offlineCaption : snapshot.streak.percentileLabel,
      week: isOffline ? snapshot.streak.weekOffline : snapshot.streak.weekOnline,
    },
    highlights,
    recentlyAdded,
    recentlyAddedCountLabel: `${recentlyAdded.length} files`,
  }
}
