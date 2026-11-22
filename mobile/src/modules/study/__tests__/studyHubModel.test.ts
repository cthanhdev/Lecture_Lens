import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_STUDY_SNAPSHOT,
  LIBRARY_EMPTY_STATE_COPY,
  OFFLINE_BANNER_DEFAULT_MESSAGE,
  buildHomeViewModel,
  buildLibraryViewModel,
  formatDurationTimestamp,
  isLectureAccessibleOffline,
} from '../studyHubModel.ts'
import type { LectureRecord, StudySnapshot } from '../types.ts'

describe('Study Hub & Library Domain Model (Screens 08-12)', () => {
  it('formats lecture and highlight timestamps accurately', () => {
    assert.equal(formatDurationTimestamp(2900), '48:20')
    assert.equal(formatDurationTimestamp(1798), '29:58')
    assert.equal(formatDurationTimestamp(4325), '1:12:05')
    assert.equal(formatDurationTimestamp(761), '12:41')
    assert.equal(formatDurationTimestamp(0), '00:00')
    assert.equal(formatDurationTimestamp(-15), '00:00')
  })

  it('Screen 08 (Home Online): builds Study Hub Dashboard with exact copy, timestamps, and Mochi highlight zones', () => {
    const vm = buildHomeViewModel(DEFAULT_STUDY_SNAPSHOT, { isOffline: false })

    assert.equal(vm.isOffline, false)
    assert.equal(vm.topBarOverline, 'KITSUNE SOFT')
    assert.equal(vm.topBarTitle, 'Study Hub')
    assert.equal(vm.greetingTitle, 'Good morning, Minh')
    assert.equal(vm.dateSubtitle, 'Wednesday, Nov 4')
    assert.equal(vm.offlineBanner.visible, false)
    assert.equal(vm.searchPlaceholder, 'Search all your lectures...')
    assert.equal(vm.searchHint, undefined)

    assert.ok(vm.continueListening)
    assert.equal(vm.continueListening.lectureId, 'lecture-7-macro')
    assert.equal(
      vm.continueListening.title,
      'Lecture 7: Inflation & Monetary Policy',
    )
    assert.equal(vm.continueListening.subject, 'Macroeconomics')
    assert.equal(vm.continueListening.currentTimeLabel, '29:58')
    assert.equal(vm.continueListening.durationLabel, '48:20')
    assert.equal(vm.continueListening.playbackRate, 1.25)
    assert.equal(vm.continueListening.playbackRateLabel, '1.25x')
    assert.ok(vm.continueListening.highlightZones.length >= 2)

    assert.equal(vm.dueToday.dueCount, 34)
    assert.equal(vm.dueToday.progressLabel, '12/34')
    assert.equal(vm.dueToday.ctaLabel, 'Start review')
    assert.equal(vm.dueToday.offlineHint, undefined)

    assert.equal(vm.streak.days, 12)
    assert.equal(vm.streak.subtitle, 'Top 5% consistency')
    assert.equal(vm.streak.weekDays.length, 7)

    assert.equal(vm.recentHighlights.length, 3)
    assert.deepEqual(
      vm.recentHighlights.map((h) => h.timestampLabel),
      ['12:41', '28:15', '39:50'],
    )
    assert.ok(vm.recentHighlights.every((h) => h.needsConnection === false))

    assert.equal(vm.recentlyAddedCountLabel, '3 files')
    assert.deepEqual(
      vm.recentlyAdded.map((f) => ({ title: f.title, badge: f.badgeVariant })),
      [
        { title: 'Macroeconomics Part 2', badge: 'ready' },
        { title: 'Organic Chem Lab 4', badge: 'transcribing' },
        { title: 'Psychology Seminar', badge: 'ready' },
      ],
    )
    assert.equal(vm.recentlyAdded[1].transcribeProgress, 45)
  })

  it('Screen 09 (Home Offline): exposes offline banner, connection-gated highlights, and device-only recordings', () => {
    const vm = buildHomeViewModel(DEFAULT_STUDY_SNAPSHOT, { isOffline: true })

    assert.equal(vm.isOffline, true)
    assert.equal(vm.topBarOverline, 'KITSUNE')
    assert.equal(vm.topBarTitle, 'Study Home')
    assert.equal(vm.offlineBanner.visible, true)
    assert.equal(vm.offlineBanner.message, OFFLINE_BANNER_DEFAULT_MESSAGE)
    assert.equal(vm.searchPlaceholder, 'Search downloaded lectures')
    assert.equal(vm.searchHint, 'Full search needs a connection.')

    assert.ok(vm.continueListening)
    assert.equal(vm.continueListening.isDownloaded, true)
    assert.equal(vm.continueListening.isAvailableOffline, true)

    assert.equal(vm.dueToday.worksOffline, true)
    assert.equal(vm.dueToday.offlineHint, 'Works offline')
    assert.equal(vm.streak.subtitle, 'Daily streak active')

    // Offline-available highlights appear first; non-downloaded highlight is marked needsConnection
    assert.deepEqual(
      vm.recentHighlights.map((h) => ({
        time: h.timestampLabel,
        needsConnection: h.needsConnection,
      })),
      [
        { time: '12:41', needsConnection: false },
        { time: '39:50', needsConnection: false },
        { time: '28:15', needsConnection: true },
      ],
    )

    assert.deepEqual(
      vm.recentlyAdded.map((f) => ({
        title: f.title,
        badge: f.badgeVariant,
        hint: f.secondaryHint,
      })),
      [
        {
          title: 'Lecture 8',
          badge: 'device-only',
          hint: 'Syncs when online',
        },
        {
          title: 'Cell Membrane Transport',
          badge: 'downloaded',
          hint: undefined,
        },
        {
          title: 'Organic Chem Lab 4',
          badge: 'needs-connection',
          hint: undefined,
        },
      ],
    )
  })

  it('Screen 10 (Library Archive Online): renders all 6 lectures grouped into Today and Last week with subject chips', () => {
    const vm = buildLibraryViewModel(DEFAULT_STUDY_SNAPSHOT, {
      isOffline: false,
      sortMode: 'recent',
    })

    assert.equal(vm.mode, 'archive')
    assert.equal(vm.eyebrow, 'ARCHIVE')
    assert.equal(vm.title, 'Library')
    assert.equal(vm.offlineBanner.visible, false)
    assert.equal(vm.totalLectureCount, 6)
    assert.equal(vm.visibleLectureCount, 6)
    assert.equal(vm.emptyState, null)

    assert.deepEqual(
      vm.subjectChips.map((c) => ({ label: c.label, count: c.count, active: c.active })),
      [
        { label: 'All', count: 6, active: true },
        { label: 'Macroeconomics', count: 2, active: false },
        { label: 'Organic Chemistry', count: 1, active: false },
        { label: 'Cell Biology', count: 1, active: false },
        { label: 'Psychology', count: 1, active: false },
        { label: 'General Seminar', count: 1, active: false },
      ],
    )

    assert.equal(vm.groups.length, 2)
    assert.equal(vm.groups[0].title, 'Today')
    assert.equal(vm.groups[0].countBadgeText, '3 recordings')
    assert.equal(vm.groups[0].rightActionLabel, 'Select')
    assert.deepEqual(
      vm.groups[0].items.map((i) => ({ title: i.title, badge: i.badgeVariant })),
      [
        { title: 'Lecture 7: Inflation & Monetary Policy', badge: 'ready' },
        { title: 'Lab Safety & Reagents', badge: 'transcribing' },
        { title: 'Cell Membrane Transport', badge: 'ready' },
      ],
    )
    assert.equal(vm.groups[0].items[1].transcribeProgress, 45)
    assert.equal(vm.groups[0].items[1].durationLabel, '1:12:05')

    assert.equal(vm.groups[1].title, 'Last week')
    assert.equal(vm.groups[1].countBadgeText, '3 recordings')
    assert.deepEqual(
      vm.groups[1].items.map((i) => ({ title: i.title, badge: i.badgeVariant, canRetry: i.canRetry })),
      [
        { title: 'Lecture 6: GDP & Growth', badge: 'ready', canRetry: false },
        { title: 'Memory & Cognition', badge: 'ready', canRetry: false },
        { title: 'Seminar recording', badge: 'failed', canRetry: true },
      ],
    )
  })

  it('Screen 10 (Library Subject Filter & Sort Toggles): filters by subject chip, groups by subject, and reverses on sort toggle', () => {
    const macroOnly = buildLibraryViewModel(DEFAULT_STUDY_SNAPSHOT, {
      selectedSubject: 'Macroeconomics',
      sortMode: 'recent',
    })
    assert.equal(macroOnly.selectedSubject, 'Macroeconomics')
    assert.equal(macroOnly.visibleLectureCount, 2)
    assert.equal(macroOnly.groups.length, 2)
    assert.equal(
      macroOnly.groups[0].items[0].title,
      'Lecture 7: Inflation & Monetary Policy',
    )
    assert.equal(macroOnly.groups[1].items[0].title, 'Lecture 6: GDP & Growth')

    const bySubject = buildLibraryViewModel(DEFAULT_STUDY_SNAPSHOT, {
      sortMode: 'by-subject',
      sortDirection: 'desc',
    })
    assert.equal(bySubject.groups.length, 5)
    assert.equal(bySubject.groups[0].title, 'Macroeconomics')
    assert.equal(bySubject.groups[0].countBadgeText, '2 recordings')
    assert.deepEqual(
      bySubject.groups[0].items.map((i) => i.title),
      ['Lecture 7: Inflation & Monetary Policy', 'Lecture 6: GDP & Growth'],
    )

    const ascendingRecent = buildLibraryViewModel(DEFAULT_STUDY_SNAPSHOT, {
      sortMode: 'recent',
      sortDirection: 'asc',
    })
    assert.equal(ascendingRecent.groups[0].title, 'Last week')
    assert.equal(ascendingRecent.groups[0].items[0].title, 'Seminar recording')
    assert.equal(ascendingRecent.groups[1].title, 'Today')
    assert.equal(ascendingRecent.groups[1].items[0].title, 'Cell Membrane Transport')
  })

  it('Screen 11 (Library Empty State): returns English empty state copy and feature preview cards when lectures list is empty', () => {
    const emptySnapshot: StudySnapshot = {
      ...DEFAULT_STUDY_SNAPSHOT,
      lectures: [],
      continueListeningId: null,
    }

    const vm = buildLibraryViewModel(emptySnapshot, { isOffline: false })
    assert.equal(vm.mode, 'empty')
    assert.equal(vm.headerBadgeText, '0 items')
    assert.equal(vm.totalLectureCount, 0)
    assert.equal(vm.visibleLectureCount, 0)
    assert.equal(vm.groups.length, 0)
    assert.deepEqual(vm.emptyState, LIBRARY_EMPTY_STATE_COPY)
    assert.equal(vm.emptyState?.title, 'No recordings yet')
    assert.equal(vm.emptyState?.primaryCtaLabel, 'Record your first lecture')
    assert.equal(vm.emptyState?.secondaryCtaLabel, 'Upload a file')
    assert.equal(
      vm.emptyState?.privacyNote,
      'Recordings stay private to your account.',
    )
  })

  it('Screen 12 (Library Offline State): handles All vs Downloaded filter and offline availability rules', () => {
    const allOffline = buildLibraryViewModel(DEFAULT_STUDY_SNAPSHOT, {
      isOffline: true,
      offlineFilter: 'all',
    })

    assert.equal(allOffline.mode, 'offline')
    assert.equal(allOffline.subtitle, 'Offline Study Vault')
    assert.equal(allOffline.headerBadgeText, 'Offline Mode')
    assert.equal(allOffline.offlineBanner.visible, true)
    assert.equal(allOffline.offlineBanner.message, OFFLINE_BANNER_DEFAULT_MESSAGE)
    assert.equal(
      allOffline.offlineBanner.secondaryHint,
      'Flashcard review works offline too.',
    )

    assert.equal(allOffline.groups.length, 2)
    assert.equal(allOffline.groups[0].title, 'Today')
    assert.equal(allOffline.groups[0].countBadgeText, '2 Ready')
    assert.equal(allOffline.groups[0].rightActionLabel, 'Nov 3')
    assert.deepEqual(
      allOffline.groups[0].items.map((i) => ({
        title: i.title,
        badge: i.badgeVariant,
        locked: i.isLockedOffline,
      })),
      [
        {
          title: 'Lecture 7: Inflation & Monetary Policy',
          badge: 'downloaded',
          locked: false,
        },
        {
          title: 'Cell Membrane Transport',
          badge: 'downloaded',
          locked: false,
        },
      ],
    )

    assert.equal(allOffline.groups[1].title, 'Previous Sessions')
    assert.equal(allOffline.groups[1].rightActionLabel, 'Offline unavailable')
    assert.ok(allOffline.groups[1].items.every((i) => i.isLockedOffline))
    assert.ok(
      allOffline.groups[1].items.every((i) => i.badgeVariant === 'needs-connection'),
    )

    const downloadedOnly = buildLibraryViewModel(DEFAULT_STUDY_SNAPSHOT, {
      isOffline: true,
      offlineFilter: 'downloaded',
    })
    assert.equal(downloadedOnly.groups.length, 1)
    assert.equal(downloadedOnly.visibleLectureCount, 2)
    assert.ok(downloadedOnly.groups[0].items.every((i) => !i.isLockedOffline))

    // Device-only recording without cloud download remains accessible offline
    const deviceOnlyLecture: LectureRecord = {
      id: 'lecture-8-live',
      title: 'Lecture 8',
      subject: 'Macroeconomics',
      subjectTone: 'mist',
      status: 'device-only',
      durationSeconds: 900,
      dateGroup: 'Today',
      dateLabel: 'Nov 4',
      recordedAtOrder: 7,
      isDownloaded: false,
      isAvailableOffline: true,
    }
    assert.equal(isLectureAccessibleOffline(deviceOnlyLecture), true)

    const withDeviceOnly = buildLibraryViewModel(
      {
        ...DEFAULT_STUDY_SNAPSHOT,
        lectures: [deviceOnlyLecture, ...DEFAULT_STUDY_SNAPSHOT.lectures],
      },
      { isOffline: true, offlineFilter: 'downloaded' },
    )
    assert.equal(withDeviceOnly.groups[0].items[0].badgeVariant, 'device-only')
    assert.equal(withDeviceOnly.groups[0].items[0].isLockedOffline, false)
  })
})
