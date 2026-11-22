// [S08, S09] Home - Study Hub Dashboard & Offline State
import React, { useCallback, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ContinueListeningCard,
  RecentHighlightsCard,
  RecentlyAddedRail,
  StudyStatsBentoRow,
} from '../../components/home'
import { getFloatingTabBarClearance } from '../../components/navigation/tabBarModel'
import {
  OfflineNoticeBanner,
  StudyScreenChrome,
} from '../../components/study'
import {
  DashboardBentoSkeleton,
  ServiceStateCard,
} from '../../components/ui/feedback'
import { Icon } from '../../components/ui/icons'
import { MochiPressable } from '../../components/ui/pressable'
import { useAudioPlayer } from '../../modules/audio/useAudioPlayer'
import {
  parsePreviewOverrideParam,
  resolveServiceAvailability,
  type PreviewOverrideState,
} from '../../modules/resilience'
import {
  DEFAULT_STUDY_SNAPSHOT,
  buildHomeViewModel,
  type HomeHighlightItem,
  type HomeRecentFileItem,
} from '../../modules/study'
import { useAppNavigation } from '../../navigation/NavigationContext'
import { useNetworkStatus } from '../../services/networkMonitor'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

const PLAYBACK_RATES = [1.0, 1.25, 1.5, 2.0] as const

type QaPreviewMode = 'auto' | 'online' | 'offline'

export default function HomeScreen() {
  const params = useLocalSearchParams<{ preview?: string | string[] }>()
  const insets = useSafeAreaInsets()
  const nav = useAppNavigation()
  const audio = useAudioPlayer()
  const network = useNetworkStatus()

  const [qaMode, setQaMode] = useState<QaPreviewMode>('auto')
  const [isRetrying, setIsRetrying] = useState(false)
  const [notificationNote, setNotificationNote] = useState<string | null>(null)
  const [railNote, setRailNote] = useState<string | null>(null)

  const urlPreviewOverride = useMemo(
    () => parsePreviewOverrideParam(params.preview),
    [params.preview],
  )

  const effectivePreviewOverride: PreviewOverrideState =
    qaMode === 'offline'
      ? 'offline'
      : qaMode === 'online'
        ? 'auto'
        : urlPreviewOverride

  const availability = useMemo(
    () =>
      resolveServiceAvailability({
        isConnected: qaMode === 'online' ? true : network.isConnected,
        isInternetReachable:
          qaMode === 'online' ? true : network.isInternetReachable,
        previewOverride: effectivePreviewOverride,
      }),
    [
      qaMode,
      network.isConnected,
      network.isInternetReachable,
      effectivePreviewOverride,
    ],
  )

  const isOffline = availability.status === 'offline'

  const vm = useMemo(
    () =>
      buildHomeViewModel(DEFAULT_STUDY_SNAPSHOT, {
        isOffline,
        activeTrackId: audio.currentTrack?.id,
        currentTimeSeconds: audio.currentTime,
        playbackRate: audio.playbackRate,
      }),
    [isOffline, audio.currentTrack?.id, audio.currentTime, audio.playbackRate],
  )

  const bottomPadding =
    getFloatingTabBarClearance(insets.bottom) +
    (audio.currentTrack ? 64 : 0) +
    16

  const handleOpenProfile = useCallback(() => {
    nav.goTo('/(tabs)/profile')
  }, [nav])

  const handlePressNotifications = useCallback(() => {
    setNotificationNote((prev) =>
      prev ? null : 'All caught up — 34 flashcards ready for review today.',
    )
  }, [])

  const handleSelectQaMode = useCallback((nextMode: 'online' | 'offline') => {
    setQaMode((prev) => (prev === nextMode ? 'auto' : nextMode))
    setRailNote(null)
    setNotificationNote(null)
  }, [])

  const handleOpenSearch = useCallback(() => {
    if (vm.isOffline) return
    nav.openSheet('search')
  }, [vm.isOffline, nav])

  const handleOpenContinueTranscript = useCallback(() => {
    if (!vm.continueListening) return
    nav.goTo(`/lectures/${vm.continueListening.lectureId}/transcript`)
  }, [vm.continueListening, nav])

  const handleToggleContinuePlay = useCallback(() => {
    if (!vm.continueListening) return
    const target = vm.continueListening
    if (audio.currentTrack?.id !== target.lectureId) {
      audio.play({
        id: target.lectureId,
        title: target.title,
        subject: target.subject,
        duration: target.durationSeconds,
      })
      audio.seek(target.currentTimeSeconds)
      return
    }
    audio.togglePlay()
  }, [vm.continueListening, audio])

  const handleCycleSpeed = useCallback(() => {
    const currentIndex = PLAYBACK_RATES.indexOf(
      audio.playbackRate as (typeof PLAYBACK_RATES)[number],
    )
    const nextRate =
      PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length]
    audio.setRate(nextRate)
  }, [audio])

  const handleStartReview = useCallback(() => {
    nav.goTo('/(tabs)/review')
  }, [nav])

  const handleSeeAllHighlights = useCallback(() => {
    nav.goTo('/(tabs)/library')
  }, [nav])

  const handlePressHighlight = useCallback(
    (item: HomeHighlightItem) => {
      if (item.needsConnection) return
      nav.goTo(`/lectures/${item.lectureId}/highlights`)
    },
    [nav],
  )

  const handlePlayHighlight = useCallback(
    (item: HomeHighlightItem) => {
      if (item.needsConnection) return
      const matchedLecture = DEFAULT_STUDY_SNAPSHOT.lectures.find(
        (lecture) => lecture.id === item.lectureId,
      )
      const isActiveAtTimestamp =
        audio.isPlaying &&
        audio.currentTrack?.id === item.lectureId &&
        Math.abs(audio.currentTime - item.timestampSeconds) <= 2

      if (isActiveAtTimestamp) {
        audio.pause()
        return
      }

      audio.play({
        id: item.lectureId,
        title: matchedLecture?.title ?? item.subject,
        subject: item.subject,
        duration: matchedLecture?.durationSeconds ?? 2900,
      })
      audio.seek(item.timestampSeconds)
    },
    [audio],
  )

  const handlePressRecentItem = useCallback(
    (item: HomeRecentFileItem) => {
      if (item.badgeVariant === 'device-only') {
        setRailNote(
          `"${item.title}" is saved on this device and will sync automatically when you're back online.`,
        )
        return
      }
      if (
        item.badgeVariant === 'needs-connection' ||
        (vm.isOffline && !item.isAvailableOffline)
      ) {
        setRailNote(`"${item.title}" requires an internet connection to open.`)
        return
      }

      setRailNote(null)
      if (item.badgeVariant === 'transcribing') {
        nav.goTo(`/(guarded)/audio/processing/${item.lectureId}`)
        return
      }
      nav.goTo(`/lectures/${item.lectureId}/transcript`)
    },
    [vm.isOffline, nav],
  )

  const handleRetryServer = useCallback(() => {
    setIsRetrying(true)
    setTimeout(() => {
      setIsRetrying(false)
      setQaMode('online')
    }, 300)
  }, [])

  const handleContinueOfflineDemo = useCallback(() => {
    setQaMode('offline')
  }, [])

  const isContinuePlaying = Boolean(
    vm.continueListening &&
      audio.isPlaying &&
      audio.currentTrack?.id === vm.continueListening.lectureId,
  )

  return (
    <StudyScreenChrome
      topBar={{
        overline: vm.topBarOverline,
        title: vm.topBarTitle,
        brandLead: vm.isOffline ? 'mascot' : 'library-icon',
        showNotificationAction: !vm.isOffline,
        hasUnreadNotifications: true,
        showProfileAction: vm.isOffline,
        isOffline: vm.isOffline,
        onPressNotifications: handlePressNotifications,
        onPressProfile: handleOpenProfile,
        style: styles.chromeFrame,
      }}
      pageHeader={{
        title: vm.greetingTitle,
        subtitle: vm.dateSubtitle,
        showMascotAvatar: true,
        showProfileAvatar: true,
        isOffline: vm.isOffline,
        onPressProfile: handleOpenProfile,
        style: styles.chromeFrame,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding },
        ]}
      >
        {/* Subtle Interactive QA State Toggle (Online [08] / Offline [09]) */}
        <View style={styles.qaRow}>
          <View style={styles.qaPillGroup}>
            <MochiPressable
              accessibilityRole="button"
              accessibilityLabel="Preview Online Study Hub Screen 08"
              accessibilityState={{ selected: !vm.isOffline && availability.status === 'ready' }}
              onPress={() => handleSelectQaMode('online')}
              style={[
                styles.qaPill,
                !vm.isOffline &&
                  availability.status === 'ready' &&
                  styles.qaPillActive,
              ]}
            >
              <Text
                style={[
                  styles.qaPillText,
                  !vm.isOffline &&
                    availability.status === 'ready' &&
                    styles.qaPillTextActive,
                ]}
              >
                Online [08]
              </Text>
            </MochiPressable>

            <MochiPressable
              accessibilityRole="button"
              accessibilityLabel="Preview Offline Home Screen 09"
              accessibilityState={{ selected: vm.isOffline }}
              onPress={() => handleSelectQaMode('offline')}
              style={[styles.qaPill, vm.isOffline && styles.qaPillActiveOffline]}
            >
              <Text
                style={[
                  styles.qaPillText,
                  vm.isOffline && styles.qaPillTextActiveOffline,
                ]}
              >
                Offline [09]
              </Text>
            </MochiPressable>
          </View>
        </View>

        {notificationNote && !vm.isOffline ? (
          <View style={styles.notificationBanner}>
            <Icon
              name="sparkles"
              size="xs"
              strokeColor={KITSUNE_COLORS.kitsuneCoral}
            />
            <Text style={styles.notificationText}>{notificationNote}</Text>
          </View>
        ) : null}

        {availability.status === 'loading' ? (
          <DashboardBentoSkeleton />
        ) : availability.status === 'server_error' ? (
          <ServiceStateCard
            kind="server_error"
            onRetry={handleRetryServer}
            onContinueDemo={handleContinueOfflineDemo}
            isRetrying={isRetrying}
          />
        ) : (
          <View style={styles.sectionsStack}>
            {/* Screen 09 Mochi Yellow Offline Notice Banner */}
            {vm.offlineBanner.visible ? (
              <OfflineNoticeBanner message={vm.offlineBanner.message} />
            ) : null}

            {/* Search Bar (disabled/hinted in Offline State) */}
            <View style={styles.searchGroup}>
              <MochiPressable
                accessibilityRole="button"
                accessibilityLabel={vm.searchPlaceholder}
                accessibilityState={{ disabled: vm.isOffline }}
                disabled={vm.isOffline}
                onPress={handleOpenSearch}
                style={[
                  styles.searchBar,
                  vm.isOffline && styles.searchBarOffline,
                ]}
              >
                <Icon
                  name="search"
                  size="sm"
                  strokeColor={KITSUNE_COLORS.plumInkMuted}
                />
                <Text
                  style={[
                    styles.searchPlaceholder,
                    vm.isOffline && styles.searchPlaceholderOffline,
                  ]}
                  numberOfLines={1}
                >
                  {vm.searchPlaceholder}
                </Text>
                <View
                  style={[
                    styles.searchTrailingBadge,
                    vm.isOffline && styles.searchTrailingBadgeOffline,
                  ]}
                >
                  <Icon
                    name={vm.isOffline ? 'wifi-off' : 'filter'}
                    size="xs"
                    strokeColor={KITSUNE_COLORS.plumInkMuted}
                  />
                </View>
              </MochiPressable>

              {vm.searchHint ? (
                <Text style={styles.searchHint}>{vm.searchHint}</Text>
              ) : null}
            </View>

            {/* Continue Listening Hero Card */}
            {vm.continueListening ? (
              <ContinueListeningCard
                item={vm.continueListening}
                isOffline={vm.isOffline}
                isPlaying={isContinuePlaying}
                onPressCard={handleOpenContinueTranscript}
                onTogglePlay={handleToggleContinuePlay}
                onCycleSpeed={handleCycleSpeed}
              />
            ) : null}

            {/* Due Today + Streak Bento Row */}
            <StudyStatsBentoRow
              dueToday={vm.dueToday}
              streak={vm.streak}
              isOffline={vm.isOffline}
              onStartReview={handleStartReview}
            />

            {/* Recent Highlights Section */}
            <RecentHighlightsCard
              items={vm.recentHighlights}
              isOffline={vm.isOffline}
              activeTrackId={audio.currentTrack?.id}
              activeTimeSeconds={audio.currentTime}
              isPlaying={audio.isPlaying}
              onPressSeeAll={handleSeeAllHighlights}
              onPressHighlight={handlePressHighlight}
              onPlayHighlight={handlePlayHighlight}
            />

            {/* Recently Added Horizontal Rail */}
            <RecentlyAddedRail
              items={vm.recentlyAdded}
              countLabel={vm.recentlyAddedCountLabel}
              isOffline={vm.isOffline}
              onPressItem={handlePressRecentItem}
              statusNote={railNote}
            />
          </View>
        )}
      </ScrollView>
    </StudyScreenChrome>
  )
}

const styles = StyleSheet.create({
  chromeFrame: {
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  scrollContent: {
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 2,
    gap: 12,
  },
  qaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  qaPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: KITSUNE_RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.08)',
    padding: 3,
    gap: 2,
  },
  qaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: KITSUNE_RADII.pill,
  },
  qaPillActive: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  qaPillActiveOffline: {
    backgroundColor: KITSUNE_COLORS.mochiYellow,
  },
  qaPillText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10.5,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  qaPillTextActive: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
  },
  qaPillTextActiveOffline: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: KITSUNE_COLORS.plumInk,
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: KITSUNE_RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(244, 127, 114, 0.28)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...KITSUNE_SHADOWS.miruku,
  },
  notificationText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInk,
  },
  sectionsStack: {
    gap: 16,
  },
  searchGroup: {
    gap: 6,
  },
  searchBar: {
    height: 48,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.96)',
    paddingLeft: 16,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...KITSUNE_SHADOWS.miruku,
  },
  searchBarOffline: {
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    opacity: 0.72,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    color: KITSUNE_COLORS.plumInkSubtle,
  },
  searchPlaceholderOffline: {
    color: KITSUNE_COLORS.plumInkMuted,
  },
  searchTrailingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(246, 234, 246, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTrailingBadgeOffline: {
    backgroundColor: 'transparent',
  },
  searchHint: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInkMuted,
    paddingHorizontal: 6,
  },
})
