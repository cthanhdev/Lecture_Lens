import React from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable'
import type { HomeRecentCardViewModel } from '../../modules/home'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

export interface RecentlyAddedRailProps {
  readonly items: readonly HomeRecentCardViewModel[]
  readonly countLabel: string
  readonly isOffline: boolean
  readonly onPressCard: (item: HomeRecentCardViewModel) => void
}

export const RecentlyAddedRail: React.FC<RecentlyAddedRailProps> = ({
  items,
  countLabel,
  isOffline,
  onPressCard,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          {!isOffline ? (
            <Icon
              name="file-text"
              size="sm"
              strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
            />
          ) : null}
          <Text style={styles.sectionTitle}>Recently added</Text>
        </View>

        {!isOffline ? <Text style={styles.countText}>{countLabel}</Text> : null}
      </View>

      <FlatList
        data={items as HomeRecentCardViewModel[]}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={164}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <MochiPressable
            disabled={!item.available}
            accessibilityLabel={`${item.title}, ${item.badgeLabel}`}
            onPress={() => onPressCard(item)}
            style={[styles.card, !item.available && styles.cardDimmed]}
          >
            <View style={styles.topTextCol}>
              <Text numberOfLines={2} style={styles.cardTitle}>
                {item.title}
              </Text>
              <Text numberOfLines={1} style={styles.cardSubtitle}>
                {item.subtitle}
              </Text>
            </View>

            {item.badgeKind === 'ready' ? (
              <View style={[styles.badgePill, styles.readyPill]}>
                <View style={styles.readyDot} />
                <Text style={styles.readyText}>{item.badgeLabel}</Text>
              </View>
            ) : null}

            {item.badgeKind === 'transcribing' ? (
              <View style={styles.transcribingWrap}>
                <View style={styles.transcribingRow}>
                  <Text style={styles.transcribingLabel}>{item.badgeLabel}</Text>
                  <Text style={styles.transcribingPct}>{item.footnote}</Text>
                </View>
                <View style={styles.transcribingTrack}>
                  <View
                    style={[
                      styles.transcribingFill,
                      { width: `${Math.min(100, item.transcribeProgress ?? 0)}%` },
                    ]}
                  />
                </View>
              </View>
            ) : null}

            {item.badgeKind === 'device-only' ? (
              <View style={styles.offlineBadgeBlock}>
                <View style={[styles.badgePill, styles.deviceOnlyPill]}>
                  <Icon name="refresh" size={11} strokeColor="#204C5C" />
                  <Text style={styles.deviceOnlyText}>{item.badgeLabel}</Text>
                </View>
                {item.footnote ? (
                  <Text style={styles.footnoteText}>{item.footnote}</Text>
                ) : null}
              </View>
            ) : null}

            {item.badgeKind === 'downloaded' ? (
              <View style={[styles.badgePill, styles.readyPill]}>
                <Icon name="download" size={11} strokeColor="#0A4325" />
                <Text style={styles.readyText}>{item.badgeLabel}</Text>
              </View>
            ) : null}

            {item.badgeKind === 'needs-connection' ? (
              <View style={[styles.badgePill, styles.offlinePill]}>
                <Icon
                  name="wifi-off"
                  size={11}
                  strokeColor={KITSUNE_COLORS.plumInkMuted}
                />
                <Text style={styles.offlineText}>{item.badgeLabel}</Text>
              </View>
            ) : null}
          </MochiPressable>
        )}
      />
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
  countText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  listContent: {
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  card: {
    width: 152,
    minHeight: 118,
    backgroundColor: KITSUNE_COLORS.mirukuCard,
    borderRadius: 22,
    padding: 14,
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.mirukuBorder,
    ...KITSUNE_SHADOWS.miruku,
  },
  cardDimmed: {
    opacity: 0.58,
  },
  topTextCol: {
    gap: 3,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13.5,
    lineHeight: 18,
    color: KITSUNE_COLORS.plumInk,
  },
  cardSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: KITSUNE_RADII.pill,
  },
  readyPill: {
    backgroundColor: 'rgba(190, 225, 208, 0.55)',
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#146C3E',
  },
  readyText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#0A4325',
  },
  transcribingWrap: {
    gap: 5,
  },
  transcribingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transcribingLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#1E5469',
  },
  transcribingPct: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
  transcribingTrack: {
    height: 5,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(169, 212, 232, 0.45)',
    overflow: 'hidden',
  },
  transcribingFill: {
    height: '100%',
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  offlineBadgeBlock: {
    gap: 5,
  },
  deviceOnlyPill: {
    backgroundColor: 'rgba(169, 212, 232, 0.45)',
  },
  deviceOnlyText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#204C5C',
  },
  footnoteText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10.5,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  offlinePill: {
    backgroundColor: 'rgba(38, 19, 51, 0.06)',
  },
  offlineText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10.5,
    color: KITSUNE_COLORS.plumInkMuted,
  },
})
