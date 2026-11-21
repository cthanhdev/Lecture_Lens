import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatClock,
  formatMinutes,
  buildOfflineBannerCopy,
  resolveHomeViewModel,
} from '../homeViewModel.ts'
import { MockHomeDashboardSource } from '../homeDashboardSource.ts'

describe('Home ViewModel Seam (S08 Online & S09 Offline)', () => {
  it('formats clocks and minute durations cleanly', () => {
    assert.equal(formatClock(0), '00:00')
    assert.equal(formatClock(1798), '29:58')
    assert.equal(formatClock(2900), '48:20')
    assert.equal(formatMinutes(2880), '48 min')
    assert.equal(formatMinutes(1920), '32 min')
    assert.equal(
      buildOfflineBannerCopy(),
      "You're offline. Downloaded lectures still work.",
    )
  })

  it('computes time-of-day greetings at exact hour boundaries and English date label', async () => {
    const source = new MockHomeDashboardSource()
    const snapshot = await source.load()

    const morning = resolveHomeViewModel(snapshot, {
      isOffline: false,
      now: new Date(2026, 10, 4, 11, 59, 0),
    })
    assert.equal(morning.greeting, 'Good morning, Minh')
    assert.equal(morning.dateLabel, 'Wednesday, Nov 4')

    const afternoon = resolveHomeViewModel(snapshot, {
      isOffline: false,
      now: new Date(2026, 10, 4, 12, 0, 0),
    })
    assert.equal(afternoon.greeting, 'Good afternoon, Minh')

    const evening = resolveHomeViewModel(snapshot, {
      isOffline: false,
      now: new Date(2026, 10, 4, 18, 0, 0),
    })
    assert.equal(evening.greeting, 'Good evening, Minh')
  })

  it('resolves Screen 08 online state matching design tokens and English copy', async () => {
    const snapshot = await new MockHomeDashboardSource().load()
    const vm = resolveHomeViewModel(snapshot, {
      isOffline: false,
      now: new Date(2026, 10, 4, 9, 15, 0),
    })

    assert.equal(vm.isOffline, false)
    assert.deepEqual(vm.header, {
      eyebrow: 'KITSUNE SOFT',
      title: 'Study Hub',
      rightAction: 'notifications',
    })
    assert.equal(vm.showAvatarOnlineDot, true)
    assert.equal(vm.offlineBannerText, null)
    assert.deepEqual(vm.search, {
      placeholder: 'Search all your lectures...',
      trailingIcon: 'filter',
      hint: null,
    })

    assert.equal(vm.continueListening.positionLabel, '29:58')
    assert.equal(vm.continueListening.durationLabel, '48:20')
    assert.equal(vm.continueListening.playbackRateLabel, '1.25x')
    assert.equal(vm.continueListening.showPlaybackRateChip, true)
    assert.equal(vm.continueListening.showDownloadedBadge, false)
    assert.equal(vm.continueListening.waveformMode, 'online-highlighted')

    assert.equal(vm.dueToday.dueCount, 34)
    assert.equal(vm.dueToday.progressText, '12/34')
    assert.equal(vm.dueToday.showProgressBar, true)
    assert.equal(vm.dueToday.showWorksOfflineBadge, false)
    assert.equal(vm.dueToday.headerVisual, 'cards-icon')

    assert.equal(vm.streak.icon, 'flame')
    assert.equal(vm.streak.caption, 'Top 5% consistency')

    assert.equal(vm.highlights.length, 3)
    assert.equal(vm.highlights.every((h) => h.available), true)

    assert.equal(vm.recentlyAddedCountLabel, '3 files')
    assert.deepEqual(
      vm.recentlyAdded.map((c) => c.badgeKind),
      ['ready', 'transcribing', 'ready'],
    )
  })

  it('resolves Screen 09 offline state with downloaded gating and local-first ordering', async () => {
    const snapshot = await new MockHomeDashboardSource().load()
    const vm = resolveHomeViewModel(snapshot, {
      isOffline: true,
      now: new Date(2026, 10, 4, 9, 15, 0),
    })

    assert.equal(vm.isOffline, true)
    assert.deepEqual(vm.header, {
      eyebrow: 'KITSUNE',
      title: 'Study Home',
      rightAction: 'profile',
    })
    assert.equal(vm.showAvatarOnlineDot, false)
    assert.equal(
      vm.offlineBannerText,
      "You're offline. Downloaded lectures still work.",
    )
    assert.deepEqual(vm.search, {
      placeholder: 'Search downloaded lectures',
      trailingIcon: 'mic-off',
      hint: 'Full search needs a connection.',
    })

    assert.equal(vm.continueListening.showDownloadedBadge, true)
    assert.equal(vm.continueListening.showPlaybackRateChip, false)
    assert.equal(vm.continueListening.waveformMode, 'offline-chunked')

    assert.equal(vm.dueToday.subtitle, 'to review')
    assert.equal(vm.dueToday.showProgressBar, false)
    assert.equal(vm.dueToday.showWorksOfflineBadge, true)
    assert.equal(vm.dueToday.headerVisual, 'progress-ring')

    assert.equal(vm.streak.icon, 'star')
    assert.equal(vm.streak.caption, 'Daily streak active')

    // Available downloaded highlights come first, non-downloaded are dimmed with Needs connection
    assert.deepEqual(
      vm.highlights.map((h) => ({
        subject: h.subject,
        available: h.available,
      })),
      [
        { subject: 'Macroeconomics', available: true },
        { subject: 'Macroeconomics', available: true },
        { subject: 'Econ 201', available: false },
      ],
    )
    assert.equal(vm.highlights[2].unavailableLabel, 'Needs connection')

    // Offline recently added order: Device only -> Downloaded -> Needs connection
    assert.deepEqual(
      vm.recentlyAdded.map((c) => c.badgeKind),
      [
        'device-only',
        'downloaded',
        'needs-connection',
        'needs-connection',
        'needs-connection',
      ],
    )
    assert.equal(vm.recentlyAdded[0].title, 'Lecture 8')
    assert.equal(vm.recentlyAdded[0].subtitle, 'Live recording')
    assert.equal(vm.recentlyAdded[0].footnote, 'Syncs when online')
    assert.equal(vm.recentlyAdded[0].available, true)
    assert.equal(vm.recentlyAdded[1].title, 'Cell Membrane Transport')
    assert.equal(vm.recentlyAdded[1].subtitle, '36:40')
    assert.equal(vm.recentlyAdded[1].available, true)
    assert.equal(vm.recentlyAdded[2].title, 'Organic Chem Lab 4')
    assert.equal(vm.recentlyAdded[2].available, false)
  })
})
