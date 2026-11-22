// RecentHighlightsCard: Screen 08 & 09 Recent Highlights section & Miruku Glass quote list
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { HomeHighlightItem } from '../../modules/study/types'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'
import { Chip } from '../ui/chip/Chip'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable/MochiPressable'

export interface RecentHighlightsCardProps {
  readonly items: readonly HomeHighlightItem[]
  readonly isOffline: boolean
  readonly activeTrackId?: string | null
  readonly activeTimeSeconds?: number
  readonly isPlaying?: boolean
  readonly onPressSeeAll: () => void
  readonly onPressHighlight: (item: HomeHighlightItem) => void
  readonly onPlayHighlight: (item: HomeHighlightItem) => void
}

export const RecentHighlightsCard: React.FC<RecentHighlightsCardProps> = ({
  items,
  isOffline,
  activeTrackId,
  activeTimeSeconds,
  isPlaying = false,
  onPressSeeAll,
  onPressHighlight,
  onPlayHighlight,
}) => {
  return (
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          {!isOffline ? (
            <Icon
              name="highlighter"
              size="sm"
              strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
            />
          ) : null}
          <Text style={styles.sectionTitle}>Recent highlights</Text>
        </View>

        <MochiPressable
          accessibilityRole="button"
          accessibilityLabel="See all highlights"
          onPress={onPressSeeAll}
          hitSlop={8}
        >
          <Text style={styles.seeAllText}>See all</Text>
        </MochiPressable>
      </View>

      {/* Outer Miruku Glass Container */}
      <View style={styles.containerCard}>
        {items.map((item) => {
          const isLocked = item.needsConnection
          const isThisSnippetPlaying =
            Boolean(isPlaying) &&
            activeTrackId === item.lectureId &&
            typeof activeTimeSeconds === 'number' &&
            Math.abs(activeTimeSeconds - item.timestampSeconds) <= 2

          return (
            <MochiPressable
              key={item.id}
              disabled={isLocked}
              onPress={() => onPressHighlight(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.quote} (${item.subject}, ${item.timestampLabel})`}
              accessibilityState={{ disabled: isLocked }}
              style={[
                styles.highlightRow,
                isOffline && styles.highlightRowOfflineTile,
                isLocked && styles.highlightRowLocked,
              ]}
            >
              <View
                style={[
                  styles.accentBar,
                  isLocked ? styles.accentBarMuted : styles.accentBarActive,
                ]}
              />

              <View style={styles.quoteColumn}>
                <Text
                  style={[styles.quoteText, isLocked && styles.quoteTextLocked]}
                  numberOfLines={2}
                >
                  {item.quote}
                </Text>

                <View style={styles.metaRow}>
                  {isOffline ? (
                    <View style={styles.offlineMetaPill}>
                      <Text style={styles.offlineMetaText} numberOfLines={1}>
                        {item.subject} · {item.timestampLabel}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.onlineMetaLeft}>
                      <View pointerEvents="none">
                        <Chip
                          variant={item.subjectTone}
                          style={styles.subjectChip}
                          textStyle={styles.subjectChipText}
                        >
                          {item.subject}
                        </Chip>
                      </View>
                      <Text style={styles.timestampText}>
                        {item.timestampLabel}
                      </Text>
                    </View>
                  )}

                  {isLocked ? (
                    <View style={styles.needsConnectionWrap}>
                      <Icon
                        name="wifi-off"
                        size={12}
                        strokeColor={KITSUNE_COLORS.plumInkMuted}
                      />
                      <Text style={styles.needsConnectionText}>
                        Needs connection
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {!isLocked ? (
                <MochiPressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    isThisSnippetPlaying
                      ? `Pause highlight at ${item.timestampLabel}`
                      : `Play highlight at ${item.timestampLabel}`
                  }
                  onPress={() => onPlayHighlight(item)}
                  haptic="medium"
                  style={styles.playButton}
                >
                  <Icon
                    name={isThisSnippetPlaying ? 'pause' : 'play'}
                    size={14}
                    strokeColor="#FFFFFF"
                  />
                </MochiPressable>
              ) : null}
            </MochiPressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 17.5,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: KITSUNE_COLORS.plumInk,
  },
  seeAllText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
  containerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: KITSUNE_RADII.squircleCard,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    padding: 14,
    gap: 12,
    ...KITSUNE_SHADOWS.miruku,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  highlightRowOfflineTile: {
    backgroundColor: 'rgba(247, 241, 250, 0.72)',
    borderRadius: KITSUNE_RADII.squircleSmall,
    padding: 11,
  },
  highlightRowLocked: {
    opacity: 0.6,
  },
  accentBar: {
    width: 3.5,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  accentBarActive: {
    backgroundColor: KITSUNE_COLORS.mochiYellow,
  },
  accentBarMuted: {
    backgroundColor: 'rgba(255, 226, 122, 0.50)',
  },
  quoteColumn: {
    flex: 1,
    gap: 7,
  },
  quoteText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13.5,
    lineHeight: 19,
    color: KITSUNE_COLORS.plumInk,
  },
  quoteTextLocked: {
    color: KITSUNE_COLORS.plumInkMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  onlineMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  subjectChipText: {
    fontSize: 11,
  },
  timestampText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  offlineMetaPill: {
    backgroundColor: 'rgba(38, 19, 51, 0.06)',
    borderRadius: KITSUNE_RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  offlineMetaText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  needsConnectionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  needsConnectionText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.miruku,
  },
})
