// [S10, S11, S12] Library - Lecture Archive, Empty State & Offline Study Vault
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  LectureArchiveCard,
  LibraryEmptyStateView,
  LibraryFilterBar,
} from '../../components/library'
import { getFloatingTabBarClearance } from '../../components/navigation/tabBarModel'
import {
  OfflineNoticeBanner,
  StudyScreenChrome,
  type StudyPageHeaderProps,
  type StudyTopBarProps,
} from '../../components/study'
import {
  DashboardBentoSkeleton,
  ServiceStateCard,
} from '../../components/ui/feedback'
import { Icon } from '../../components/ui/icons/Icon'
import { MochiPressable } from '../../components/ui/pressable/MochiPressable'
import { useAudioPlayer } from '../../modules/audio/useAudioPlayer'
import {
  parsePreviewOverrideParam,
  resolveServiceAvailability,
  type PreviewOverrideState,
} from '../../modules/resilience/connectionResilience'
import {
  DEFAULT_STUDY_SNAPSHOT,
  buildLibraryViewModel,
} from '../../modules/study/studyHubModel'
import type {
  LectureRecord,
  LibraryLectureItemViewModel,
  LibrarySortDirection,
  LibrarySortMode,
  OfflineFilterMode,
  StudySnapshot,
} from '../../modules/study/types'
import { useAppNavigation } from '../../navigation'
import { useNetworkStatus } from '../../services/networkMonitor'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

type LibraryPreviewMode = 'archive' | 'empty' | 'offline'

const STATE_SWITCHER_OPTIONS: readonly {
  id: LibraryPreviewMode
  label: string
}[] = [
  { id: 'archive', label: 'Archive [10]' },
  { id: 'empty', label: 'Empty [11]' },
  { id: 'offline', label: 'Offline [12]' },
]

export default function LibraryScreen() {
  const nav = useAppNavigation()
  const audio = useAudioPlayer()
  const insets = useSafeAreaInsets()
  const network = useNetworkStatus()
  const params = useLocalSearchParams<{ preview?: string | string[] }>()

  const rawPreview = useMemo(() => {
    const candidate = Array.isArray(params.preview)
      ? params.preview[0]
      : params.preview
    return candidate?.trim().toLowerCase() ?? ''
  }, [params.preview])

  const urlAvailabilityOverride = useMemo(
    () => parsePreviewOverrideParam(params.preview),
    [params.preview],
  )

  const [manualAvailabilityOverride, setManualAvailabilityOverride] =
    useState<PreviewOverrideState | null>(null)
  const [manualLibraryMode, setManualLibraryMode] =
    useState<LibraryPreviewMode | null>(null)
  const [isRetryingService, setIsRetryingService] = useState(false)

  const [lectures, setLectures] = useState<readonly LectureRecord[]>(
    () => DEFAULT_STUDY_SNAPSHOT.lectures,
  )
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [sortMode, setSortMode] = useState<LibrarySortMode>('recent')
  const [sortDirection, setSortDirection] = useState<LibrarySortDirection>('desc')
  const [offlineFilter, setOfflineFilter] = useState<OfflineFilterMode>('all')
  const [selectionMode, setSelectionMode] = useState<boolean>(false)
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([])
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null)

  useEffect(() => {
    if (!feedbackBanner) return
    const timer = setTimeout(() => {
      setFeedbackBanner(null)
    }, 3200)
    return () => clearTimeout(timer)
  }, [feedbackBanner])

  const effectiveAvailabilityOverride =
    manualAvailabilityOverride ?? urlAvailabilityOverride

  const availability = useMemo(
    () =>
      resolveServiceAvailability({
        isConnected: network.isConnected,
        isInternetReachable: network.isInternetReachable,
        previewOverride: effectiveAvailabilityOverride,
      }),
    [
      effectiveAvailabilityOverride,
      network.isConnected,
      network.isInternetReachable,
    ],
  )

  const activeLibraryMode: LibraryPreviewMode = useMemo(() => {
    if (manualLibraryMode) {
      return manualLibraryMode
    }
    if (rawPreview === 'empty') {
      return 'empty'
    }
    if (availability.status === 'offline') {
      return 'offline'
    }
    if (lectures.length === 0) {
      return 'empty'
    }
    return 'archive'
  }, [availability.status, lectures.length, manualLibraryMode, rawPreview])

  const activeSnapshot: StudySnapshot = useMemo(() => {
    if (activeLibraryMode === 'empty') {
      return {
        ...DEFAULT_STUDY_SNAPSHOT,
        lectures: [],
        continueListeningId: null,
      }
    }
    return {
      ...DEFAULT_STUDY_SNAPSHOT,
      lectures,
    }
  }, [activeLibraryMode, lectures])

  const viewModel = useMemo(
    () =>
      buildLibraryViewModel(activeSnapshot, {
        isOffline: activeLibraryMode === 'offline',
        selectedSubject,
        sortMode,
        sortDirection,
        offlineFilter,
      }),
    [
      activeLibraryMode,
      activeSnapshot,
      offlineFilter,
      selectedSubject,
      sortDirection,
      sortMode,
    ],
  )

  const handleSelectMode = useCallback((mode: LibraryPreviewMode) => {
    setManualAvailabilityOverride('auto')
    setManualLibraryMode(mode)
    setSelectionMode(false)
    setSelectedIds([])
    setFeedbackBanner(null)
  }, [])

  const handleRetryService = useCallback(() => {
    setIsRetryingService(true)
    setTimeout(() => {
      setIsRetryingService(false)
      setManualAvailabilityOverride('auto')
      setManualLibraryMode(null)
    }, 350)
  }, [])

  const handleContinueDemo = useCallback(() => {
    setManualAvailabilityOverride('auto')
    setManualLibraryMode('archive')
  }, [])

  const handleToggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))
  }, [])

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      const next = !prev
      if (!next) {
        setSelectedIds([])
      }
      return next
    })
  }, [])

  const handleRetryLecture = useCallback((item: LibraryLectureItemViewModel) => {
    setLectures((prev) =>
      prev.map((lecture) =>
        lecture.id === item.id
          ? {
              ...lecture,
              status: 'transcribing',
              transcribeProgress: 18,
            }
          : lecture,
      ),
    )
    setFeedbackBanner(`Retrying transcription for "${item.title}"...`)
  }, [])

  const handlePressLectureCard = useCallback(
    (item: LibraryLectureItemViewModel) => {
      if (selectionMode && viewModel.mode === 'archive') {
        setSelectedIds((prev) =>
          prev.includes(item.id)
            ? prev.filter((id) => id !== item.id)
            : [...prev, item.id],
        )
        return
      }

      if (item.isLockedOffline) {
        setFeedbackBanner(
          `Connect to Wi-Fi or cellular to open "${item.title}".`,
        )
        return
      }

      if (item.canRetry) {
        handleRetryLecture(item)
        return
      }

      if (item.badgeVariant === 'transcribing') {
        nav.goTo(`/(guarded)/audio/processing/${item.id}`)
        return
      }

      nav.goTo(`/lectures/${item.id}/transcript`)
    },
    [handleRetryLecture, nav, selectionMode, viewModel.mode],
  )

  const handlePlayOfflineLecture = useCallback(
    (item: LibraryLectureItemViewModel) => {
      if (audio.currentTrack?.id === item.id) {
        audio.togglePlay()
        return
      }

      const sourceLecture = lectures.find((lecture) => lecture.id === item.id)
      audio.play({
        id: item.id,
        title: item.title,
        subject: item.subject,
        duration: sourceLecture?.durationSeconds ?? 0,
      })
    },
    [audio, lectures],
  )

  const bottomClearance =
    getFloatingTabBarClearance(insets.bottom) +
    (audio.currentTrack ? 64 : 0) +
    16

  const topBarProps: StudyTopBarProps = useMemo(() => {
    if (viewModel.mode === 'empty') {
      return {
        brandLead: 'mascot',
        overline: 'LIBRARY',
        title: 'Kitsune',
        showNotificationAction: false,
        showProfileAction: true,
        isOffline: false,
        onPressProfile: () => nav.goTo('/(tabs)/profile'),
      }
    }

    if (viewModel.mode === 'offline') {
      return {
        brandLead: 'mascot',
        overline: 'Library',
        title: 'Kitsune',
        showNotificationAction: false,
        showProfileAction: true,
        isOffline: true,
        onPressProfile: () => nav.goTo('/(tabs)/profile'),
      }
    }

    return {
      brandLead: 'both',
      overline: '',
      title: '',
      showNotificationAction: true,
      showProfileAction: false,
      onPressNotifications: () =>
        setFeedbackBanner('All lecture transcripts and summaries are up to date.'),
    }
  }, [nav, viewModel.mode])

  const pageHeaderProps: StudyPageHeaderProps = useMemo(() => {
    if (viewModel.mode === 'empty') {
      return {
        title: viewModel.title,
        statusPillText: viewModel.headerBadgeText,
        statusPillTone: 'sakura',
      }
    }

    if (viewModel.mode === 'offline') {
      return {
        title: viewModel.title,
        subtitle: viewModel.subtitle,
        statusPillText: viewModel.headerBadgeText,
        statusPillTone: 'coral',
      }
    }

    return {
      eyebrow: viewModel.eyebrow,
      title: viewModel.title,
      showProfileAvatar: true,
      isOffline: false,
      onPressProfile: () => nav.goTo('/(tabs)/profile'),
    }
  }, [nav, viewModel.eyebrow, viewModel.headerBadgeText, viewModel.mode, viewModel.subtitle, viewModel.title])

  const showResilienceFallback =
    !manualLibraryMode &&
    (availability.status === 'loading' || availability.status === 'server_error')

  return (
    <StudyScreenChrome topBar={topBarProps} pageHeader={pageHeaderProps}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomClearance },
        ]}
      >
        <View style={styles.mobileFrame}>
          {/* Subtle in-place QA state switcher for Screens 10 / 11 / 12 */}
          <View style={styles.stateSwitcherBar}>
            {STATE_SWITCHER_OPTIONS.map((option) => {
              const isSelected =
                !showResilienceFallback && activeLibraryMode === option.id
              return (
                <MochiPressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  haptic="selection"
                  onPress={() => handleSelectMode(option.id)}
                  style={[
                    styles.stateSwitcherPill,
                    isSelected && styles.stateSwitcherPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stateSwitcherText,
                      isSelected && styles.stateSwitcherTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </MochiPressable>
              )
            })}
          </View>

          {feedbackBanner ? (
            <View style={styles.feedbackPill}>
              <Icon
                name="sparkles"
                size="xs"
                strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
              />
              <Text style={styles.feedbackText}>{feedbackBanner}</Text>
            </View>
          ) : null}

          {showResilienceFallback ? (
            availability.status === 'loading' ? (
              <DashboardBentoSkeleton />
            ) : (
              <ServiceStateCard
                kind="server_error"
                isRetrying={isRetryingService}
                onRetry={handleRetryService}
                onContinueDemo={handleContinueDemo}
              />
            )
          ) : viewModel.mode === 'empty' && viewModel.emptyState ? (
            <LibraryEmptyStateView
              model={viewModel.emptyState}
              onRecordFirstLecture={() => nav.goTo('/(guarded)/audio/record')}
              onUploadFile={() => nav.openSheet('add-audio')}
            />
          ) : (
            <View style={styles.listBody}>
              {viewModel.mode === 'offline' && viewModel.offlineBanner.visible ? (
                <View style={styles.offlineBannerBlock}>
                  <OfflineNoticeBanner
                    message={viewModel.offlineBanner.message}
                    showTrailingWifiOff
                  />

                  <MochiPressable
                    accessibilityRole="button"
                    accessibilityLabel="Flashcard review works offline too. Open Review"
                    haptic="selection"
                    onPress={() => nav.goTo('/(tabs)/review')}
                    style={styles.offlineReviewHintRow}
                  >
                    <Icon
                      name="sparkles"
                      size="xs"
                      strokeColor={KITSUNE_COLORS.kitsuneCoral}
                    />
                    <Text style={styles.offlineReviewHintText}>
                      {viewModel.offlineBanner.secondaryHint ??
                        'Flashcard review works offline too.'}
                    </Text>
                    <Icon
                      name="chevron-right"
                      size={12}
                      strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
                    />
                  </MochiPressable>
                </View>
              ) : null}

              <LibraryFilterBar
                mode={viewModel.mode === 'offline' ? 'offline' : 'archive'}
                subjectChips={viewModel.subjectChips}
                selectedSubject={viewModel.selectedSubject}
                onSelectSubject={setSelectedSubject}
                sortMode={viewModel.sortMode}
                onChangeSortMode={setSortMode}
                sortDirection={viewModel.sortDirection}
                onToggleSortDirection={handleToggleSortDirection}
                offlineFilter={viewModel.offlineFilter}
                onChangeOfflineFilter={setOfflineFilter}
              />

              <View style={styles.groupsContainer}>
                {viewModel.groups.map((group) => {
                  const isOfflineUnavailableGroup =
                    group.id === 'offline-unavailable'

                  return (
                    <View key={group.id} style={styles.groupSection}>
                      <View style={styles.groupHeaderRow}>
                        <View style={styles.groupHeaderLeft}>
                          <Text
                            style={[
                              styles.groupTitle,
                              isOfflineUnavailableGroup &&
                                styles.groupTitleMuted,
                            ]}
                          >
                            {group.title}
                          </Text>

                          {!isOfflineUnavailableGroup ? (
                            <View style={styles.groupCountBadge}>
                              <Text style={styles.groupCountText}>
                                {group.countBadgeText}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {group.rightActionLabel ? (
                          viewModel.mode === 'archive' &&
                          group.rightActionLabel === 'Select' ? (
                            <MochiPressable
                              accessibilityRole="button"
                              haptic="selection"
                              onPress={handleToggleSelectionMode}
                              style={styles.selectActionBtn}
                            >
                              <Text style={styles.selectActionText}>
                                {selectionMode
                                  ? selectedIds.length > 0
                                    ? `Done (${selectedIds.length})`
                                    : 'Done'
                                  : group.rightActionLabel}
                              </Text>
                            </MochiPressable>
                          ) : (
                            <Text style={styles.groupRightMetaText}>
                              {group.rightActionLabel}
                            </Text>
                          )
                        ) : null}
                      </View>

                      <View style={styles.cardsColumn}>
                        {group.items.map((item) => (
                          <LectureArchiveCard
                            key={item.id}
                            item={item}
                            mode={
                              viewModel.mode === 'offline'
                                ? 'offline'
                                : 'archive'
                            }
                            selectionMode={selectionMode}
                            isSelected={selectedIds.includes(item.id)}
                            isPlaying={
                              audio.isPlaying &&
                              audio.currentTrack?.id === item.id
                            }
                            onPress={handlePressLectureCard}
                            onPlayPress={handlePlayOfflineLecture}
                            onRetryPress={handleRetryLecture}
                          />
                        ))}
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </StudyScreenChrome>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 2,
  },
  mobileFrame: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },
  stateSwitcherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    padding: 4,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.06)',
  },
  stateSwitcherPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: KITSUNE_RADII.pill,
  },
  stateSwitcherPillActive: {
    backgroundColor: KITSUNE_COLORS.plumInk,
  },
  stateSwitcherText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  stateSwitcherTextActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  feedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: KITSUNE_RADII.squircleSmall,
    backgroundColor: 'rgba(245, 195, 201, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(244, 127, 114, 0.35)',
    ...KITSUNE_SHADOWS.miruku,
  },
  feedbackText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12.5,
    lineHeight: 17,
    color: KITSUNE_COLORS.plumInk,
  },
  listBody: {
    gap: 16,
  },
  offlineBannerBlock: {
    gap: 8,
  },
  offlineReviewHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  offlineReviewHintText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12.5,
    lineHeight: 17,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  groupsContainer: {
    gap: 20,
  },
  groupSection: {
    gap: 10,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16.5,
    lineHeight: 22,
    color: KITSUNE_COLORS.plumInk,
  },
  groupTitleMuted: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14.5,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  groupCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(245, 195, 201, 0.36)',
  },
  groupCountText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11.5,
    lineHeight: 15,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  selectActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectActionText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    lineHeight: 17,
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
  groupRightMetaText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12.5,
    lineHeight: 17,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  cardsColumn: {
    gap: 12,
  },
})
