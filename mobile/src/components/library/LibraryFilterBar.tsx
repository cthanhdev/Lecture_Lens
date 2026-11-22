// LibraryFilterBar: Subject Filter Chips + Segmented Sort Controls (Screen 10) & Compact Offline Filter (Screen 12)
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type {
  LibrarySortDirection,
  LibrarySortMode,
  LibrarySubjectChipModel,
  OfflineFilterMode,
  SubjectTone,
} from '../../modules/study/types'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'
import { Chip } from '../ui/chip/Chip'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable/MochiPressable'

export interface LibraryFilterBarProps {
  mode: 'archive' | 'offline'
  subjectChips?: readonly LibrarySubjectChipModel[]
  selectedSubject?: string
  onSelectSubject?: (subjectId: string) => void
  sortMode?: LibrarySortMode
  onChangeSortMode?: (mode: LibrarySortMode) => void
  sortDirection?: LibrarySortDirection
  onToggleSortDirection?: () => void
  offlineFilter?: OfflineFilterMode
  onChangeOfflineFilter?: (filter: OfflineFilterMode) => void
}

const SUBJECT_DOT_COLOR: Record<SubjectTone, string> = {
  mist: '#5897B8',
  matcha: '#3A9970',
  sakura: '#DF7F8A',
  mochi: '#C99B3B',
}

export const LibraryFilterBar: React.FC<LibraryFilterBarProps> = ({
  mode,
  subjectChips = [],
  selectedSubject = 'all',
  onSelectSubject,
  sortMode = 'recent',
  onChangeSortMode,
  sortDirection = 'desc',
  onToggleSortDirection,
  offlineFilter = 'all',
  onChangeOfflineFilter,
}) => {
  if (mode === 'offline') {
    const isAll = offlineFilter === 'all'
    const isDownloaded = offlineFilter === 'downloaded'

    return (
      <View style={styles.offlineRow}>
        <Chip
          active={isAll}
          onPress={() => onChangeOfflineFilter?.('all')}
          style={[styles.offlineChip, isAll ? styles.activePlumChip : styles.mirukuChip]}
          textStyle={isAll ? styles.activePlumText : styles.inactiveChipText}
        >
          All
        </Chip>

        <Chip
          active={isDownloaded}
          onPress={() => onChangeOfflineFilter?.('downloaded')}
          icon={<View style={styles.matchaDot} />}
          style={[
            styles.offlineChip,
            isDownloaded ? styles.activePlumChip : styles.mirukuChip,
          ]}
          textStyle={isDownloaded ? styles.activePlumText : styles.inactiveChipText}
        >
          Downloaded
        </Chip>
      </View>
    )
  }

  const isRecent = sortMode === 'recent'
  const isBySubject = sortMode === 'by-subject'
  const sortLabel =
    sortDirection === 'desc' ? 'Sort newest first' : 'Sort oldest first'

  return (
    <View style={styles.archiveContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScrollContent}
      >
        {subjectChips.map((chip) => {
          const isActive = chip.id === selectedSubject || chip.active
          const isAllChip = chip.id === 'all'
          const dotColor = chip.tone ? SUBJECT_DOT_COLOR[chip.tone] : undefined

          return (
            <Chip
              key={chip.id}
              active={isActive}
              onPress={() => onSelectSubject?.(chip.id)}
              icon={
                !isAllChip && dotColor ? (
                  <View
                    style={[
                      styles.subjectDot,
                      {
                        backgroundColor: isActive ? '#FFFFFF' : dotColor,
                      },
                    ]}
                  />
                ) : undefined
              }
              style={isActive ? styles.activePlumChip : styles.mirukuChip}
            >
              <View style={styles.chipInnerRow}>
                <Text
                  style={[
                    styles.chipLabel,
                    isActive ? styles.activePlumText : styles.inactiveChipText,
                  ]}
                >
                  {chip.label}
                </Text>
                {isAllChip ? (
                  <View
                    style={[
                      styles.countPill,
                      isActive ? styles.countPillActive : styles.countPillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countPillText,
                        isActive
                          ? styles.countPillTextActive
                          : styles.countPillTextInactive,
                      ]}
                    >
                      {chip.count}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Chip>
          )
        })}
      </ScrollView>

      <View style={styles.controlsRow}>
        <View style={styles.segmentedTrack}>
          <MochiPressable
            accessibilityRole="button"
            accessibilityState={{ selected: isRecent }}
            haptic="selection"
            onPress={() => onChangeSortMode?.('recent')}
            style={[styles.segmentButton, isRecent && styles.segmentButtonActive]}
          >
            <Text
              style={[
                styles.segmentLabel,
                isRecent ? styles.segmentLabelActive : styles.segmentLabelInactive,
              ]}
            >
              Recent
            </Text>
          </MochiPressable>

          <MochiPressable
            accessibilityRole="button"
            accessibilityState={{ selected: isBySubject }}
            haptic="selection"
            onPress={() => onChangeSortMode?.('by-subject')}
            style={[
              styles.segmentButton,
              isBySubject && styles.segmentButtonActive,
            ]}
          >
            <Text
              style={[
                styles.segmentLabel,
                isBySubject
                  ? styles.segmentLabelActive
                  : styles.segmentLabelInactive,
              ]}
            >
              By subject
            </Text>
          </MochiPressable>
        </View>

        <MochiPressable
          accessibilityRole="button"
          accessibilityLabel={sortLabel}
          haptic="selection"
          onPress={onToggleSortDirection}
          style={styles.sortButton}
        >
          <View
            style={
              sortDirection === 'asc'
                ? styles.sortIconFlipped
                : undefined
            }
          >
            <Icon name="sort" size="sm" strokeColor={KITSUNE_COLORS.plumInk} />
          </View>
        </MochiPressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  archiveContainer: {
    gap: 12,
  },
  chipsScrollContent: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 8,
  },
  mirukuChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    ...KITSUNE_SHADOWS.miruku,
  },
  activePlumChip: {
    backgroundColor: KITSUNE_COLORS.plumInk,
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.plumInk,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    ...KITSUNE_SHADOWS.miruku,
  },
  chipInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  chipLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12.5,
    lineHeight: 16,
  },
  activePlumText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  inactiveChipText: {
    color: KITSUNE_COLORS.plumInk,
  },
  countPill: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: KITSUNE_RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  countPillInactive: {
    backgroundColor: 'rgba(38, 19, 51, 0.08)',
  },
  countPillText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    lineHeight: 14,
  },
  countPillTextActive: {
    color: '#FFFFFF',
  },
  countPillTextInactive: {
    color: KITSUNE_COLORS.plumInk,
  },
  subjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  segmentedTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.08)',
    ...KITSUNE_SHADOWS.miruku,
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: KITSUNE_RADII.pill,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: KITSUNE_COLORS.plumInk,
  },
  segmentLabel: {
    fontSize: 12.5,
    lineHeight: 16,
  },
  segmentLabelActive: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
  },
  segmentLabelInactive: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: KITSUNE_COLORS.plumInkMuted,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.miruku,
  },
  sortIconFlipped: {
    transform: [{ scaleY: -1 }],
  },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  offlineChip: {
    minHeight: 36,
    paddingHorizontal: 16,
  },
  matchaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#56C596',
  },
})
