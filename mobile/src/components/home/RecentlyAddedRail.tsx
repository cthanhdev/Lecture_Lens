// RecentlyAddedRail: Screen 08 & 09 horizontal rail of recent lecture cards
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { HomeRecentFileItem } from '../../modules/study/types'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'
import { LectureStatusBadge } from '../study/LectureStatusBadge'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable/MochiPressable'

export interface RecentlyAddedRailProps {
  readonly items: readonly HomeRecentFileItem[]
  readonly countLabel: string
  readonly isOffline: boolean
  readonly onPressItem: (item: HomeRecentFileItem) => void
  readonly statusNote?: string | null
}

export const RecentlyAddedRail: React.FC<RecentlyAddedRailProps> = ({
  items,
  countLabel,
  isOffline,
  onPressItem,
  statusNote,
}) => {
  return (
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          {!isOffline ? (
            <Icon
              name="file-text"
              size="sm"
              strokeColor={KITSUNE_COLORS.plumInkMuted}
            />
          ) : null}
          <Text style={styles.sectionTitle}>Recently added</Text>
        </View>

        {!isOffline ? <Text style={styles.countLabel}>{countLabel}</Text> : null}
      </View>

      {/* Horizontal Scrollable Rail */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={styles.railContent}
      >
        {items.map((item) => {
          const isTranscribing = item.badgeVariant === 'transcribing'
          const progressValue = Math.max(
            0,
            Math.min(100, Math.round(item.transcribeProgress ?? 0)),
          )

          return (
            <MochiPressable
              key={item.id}
              onPress={() => onPressItem(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.subtitleLabel}`}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {item.subtitleLabel}
                </Text>
              </View>

              <View style={styles.cardBottom}>
                {isTranscribing ? (
                  <View style={styles.transcribingWrap}>
                    <View style={styles.transcribingHeader}>
                      <Text style={styles.transcribingLabel}>Transcribing</Text>
                      <Text style={styles.transcribingPercent}>
                        {progressValue}%
                      </Text>
                    </View>
                    <View style={styles.transcribingTrack}>
                      <View
                        style={[
                          styles.transcribingFill,
                          { width: `${progressValue}%` },
                        ]}
                      />
                    </View>
                  </View>
                ) : (
                  <>
                    <LectureStatusBadge
                      variant={item.badgeVariant}
                      progress={item.transcribeProgress}
                    />
                    {item.secondaryHint ? (
                      <Text style={styles.secondaryHint} numberOfLines={1}>
                        {item.secondaryHint}
                      </Text>
                    ) : null}
                  </>
                )}
              </View>
            </MochiPressable>
          )
        })}
      </ScrollView>

      {statusNote ? (
        <View style={styles.statusNotePill}>
          <Icon
            name="refresh"
            size="xs"
            strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
          />
          <Text style={styles.statusNoteText}>{statusNote}</Text>
        </View>
      ) : null}
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
  countLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12.5,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  railContent: {
    gap: 12,
    paddingVertical: 2,
    paddingRight: 4,
  },
  card: {
    width: 158,
    minHeight: 118,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    padding: 14,
    justifyContent: 'space-between',
    gap: 10,
    ...KITSUNE_SHADOWS.miruku,
  },
  cardTop: {
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13.5,
    lineHeight: 18,
    color: KITSUNE_COLORS.plumInk,
  },
  cardSubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  cardBottom: {
    gap: 5,
  },
  transcribingWrap: {
    gap: 5,
  },
  transcribingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transcribingLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: KITSUNE_COLORS.plumInk,
  },
  transcribingPercent: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
  transcribingTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(169, 212, 232, 0.36)',
    overflow: 'hidden',
  },
  transcribingFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  secondaryHint: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  statusNotePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: KITSUNE_RADII.squircleSmall,
    borderWidth: 1,
    borderColor: 'rgba(244, 127, 114, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusNoteText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: KITSUNE_COLORS.plumInkMuted,
  },
})
