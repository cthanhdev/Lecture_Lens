import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable'
import type { HomeHighlightViewModel, SubjectTone } from '../../modules/home'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

export interface RecentHighlightsSectionProps {
  readonly items: readonly HomeHighlightViewModel[]
  readonly isOffline: boolean
  readonly onPressSeeAll: () => void
  readonly onOpenHighlight: (item: HomeHighlightViewModel) => void
  readonly onPlayHighlight: (item: HomeHighlightViewModel) => void
}

const TONE_BADGE_STYLES: Record<
  SubjectTone,
  { bg: string; border: string; text: string }
> = {
  mist: {
    bg: 'rgba(169, 212, 232, 0.35)',
    border: KITSUNE_COLORS.mistSky,
    text: '#204C5C',
  },
  matcha: {
    bg: 'rgba(190, 225, 208, 0.40)',
    border: KITSUNE_COLORS.matchaMint,
    text: '#0A4325',
  },
  sakura: {
    bg: 'rgba(245, 195, 201, 0.40)',
    border: KITSUNE_COLORS.sakuraPink,
    text: '#795358',
  },
  mochi: {
    bg: 'rgba(255, 226, 122, 0.40)',
    border: KITSUNE_COLORS.mochiYellow,
    text: '#7B5400',
  },
}

export const RecentHighlightsSection: React.FC<RecentHighlightsSectionProps> = ({
  items,
  isOffline,
  onPressSeeAll,
  onOpenHighlight,
  onPlayHighlight,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
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
          accessibilityLabel="See all highlights"
          onPress={onPressSeeAll}
          hitSlop={8}
        >
          <Text style={styles.seeAllText}>See all</Text>
        </MochiPressable>
      </View>

      <View style={styles.containerCard}>
        {items.map((item, idx) => {
          const isUnavailable = !item.available
          const toneStyle = TONE_BADGE_STYLES[item.subjectTone]
          return (
            <View
              key={item.id}
              style={[
                styles.rowCard,
                idx > 0 && styles.rowGap,
                isUnavailable && styles.rowDimmed,
              ]}
            >
              <MochiPressable
                disabled={isUnavailable}
                accessibilityLabel={`Highlight from ${item.subject}: ${item.quote}`}
                onPress={() => onOpenHighlight(item)}
                style={styles.rowTapArea}
              >
                <View style={styles.mochiRail} />

                <View style={styles.rowContent}>
                  <Text numberOfLines={2} style={styles.quoteText}>
                    {item.quote}
                  </Text>

                  {isOffline ? (
                    <View style={styles.offlineMetaRow}>
                      <View style={styles.offlineMetaPill}>
                        <Text style={styles.offlineMetaText}>
                          {item.subject} · {item.timestampLabel}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.onlineMetaRow}>
                      <View
                        style={[
                          styles.subjectBadge,
                          {
                            backgroundColor: toneStyle.bg,
                            borderColor: toneStyle.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.subjectBadgeText,
                            { color: toneStyle.text },
                          ]}
                        >
                          {item.subject}
                        </Text>
                      </View>
                      <Text style={styles.timestampText}>{item.timestampLabel}</Text>
                    </View>
                  )}
                </View>
              </MochiPressable>

              {item.available ? (
                <MochiPressable
                  accessibilityLabel={`Play highlight at ${item.timestampLabel}`}
                  onPress={() => onPlayHighlight(item)}
                  haptic="impact"
                  style={styles.playCircle}
                >
                  <Icon name="play" size="xs" strokeColor="#FFFFFF" />
                </MochiPressable>
              ) : (
                <View style={styles.needsConnectionGroup}>
                  <Icon
                    name="wifi-off"
                    size="xs"
                    strokeColor={KITSUNE_COLORS.plumInkMuted}
                  />
                  <Text style={styles.needsConnectionText}>
                    {item.unavailableLabel}
                  </Text>
                </View>
              )}
            </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: KITSUNE_COLORS.plumInk,
  },
  seeAllText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12.5,
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
  containerCard: {
    backgroundColor: KITSUNE_COLORS.mirukuCard,
    borderRadius: KITSUNE_RADII.squircleCard,
    padding: 12,
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.mirukuBorder,
    ...KITSUNE_SHADOWS.miruku,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 247, 253, 0.72)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowTapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowGap: {
    marginTop: 8,
  },
  rowDimmed: {
    opacity: 0.55,
  },
  mochiRail: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: KITSUNE_COLORS.mochiYellow,
  },
  rowContent: {
    flex: 1,
    gap: 8,
  },
  quoteText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    lineHeight: 19,
    color: KITSUNE_COLORS.plumInk,
  },
  onlineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: KITSUNE_RADII.pill,
    borderWidth: 1,
  },
  subjectBadgeText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
  },
  timestampText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInkMuted,
    fontVariant: ['tabular-nums'],
  },
  offlineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineMetaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(38, 19, 51, 0.06)',
  },
  offlineMetaText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  playCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.miruku,
  },
  needsConnectionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  needsConnectionText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkMuted,
  },
})
