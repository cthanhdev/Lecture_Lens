// OfflineNoticeBanner: Shared Mochi Yellow offline indicator banner for Screens 09 & 12
import React from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { OFFLINE_BANNER_DEFAULT_MESSAGE } from '../../modules/study/studyHubModel'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'
import { Icon } from '../ui/icons/Icon'

export interface OfflineNoticeBannerProps {
  message?: string
  secondaryHint?: string
  showTrailingWifiOff?: boolean
  style?: StyleProp<ViewStyle>
}

export const OfflineNoticeBanner: React.FC<OfflineNoticeBannerProps> = ({
  message = OFFLINE_BANNER_DEFAULT_MESSAGE,
  secondaryHint,
  showTrailingWifiOff = false,
  style,
}) => {
  return (
    <View style={[styles.wrapper, style]}>
      <View
        accessibilityRole="text"
        accessibilityLabel={message}
        style={styles.bannerCard}
      >
        <View style={styles.leadingIconPill}>
          <Icon name="wifi-off" size="sm" strokeColor={KITSUNE_COLORS.plumInk} />
        </View>
        <Text style={styles.messageText}>{message}</Text>
        {showTrailingWifiOff ? (
          <View style={styles.trailingIconWrap}>
            <Icon
              name="wifi-off"
              size="sm"
              strokeColor={KITSUNE_COLORS.plumInkMuted}
            />
          </View>
        ) : null}
      </View>

      {secondaryHint ? (
        <View style={styles.hintRow}>
          <Icon
            name="sparkles"
            size="xs"
            strokeColor={KITSUNE_COLORS.kitsuneCoral}
          />
          <Text style={styles.hintText}>{secondaryHint}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: KITSUNE_RADII.squircleSmall,
    backgroundColor: KITSUNE_COLORS.mochiYellow,
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.08)',
    ...KITSUNE_SHADOWS.miruku,
  },
  leadingIconPill: {
    width: 30,
    height: 30,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(38, 19, 51, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: KITSUNE_COLORS.plumInk,
  },
  trailingIconWrap: {
    opacity: 0.72,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  hintText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: KITSUNE_COLORS.plumInkMuted,
  },
})
