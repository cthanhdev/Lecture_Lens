import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated'
import { Icon } from '../ui/icons/Icon'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

export interface OfflineBannerProps {
  readonly message: string | null
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ message }) => {
  if (!message) return null

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutUp.duration(180)}
      accessibilityRole="alert"
      style={styles.banner}
    >
      <View style={styles.iconCircle}>
        <Icon name="wifi-off" size="sm" strokeColor={KITSUNE_COLORS.plumInk} />
      </View>
      <Text style={styles.copy}>{message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: KITSUNE_RADII.squircleSmall + 4,
    backgroundColor: KITSUNE_COLORS.mochiYellow,
    ...KITSUNE_SHADOWS.miruku,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(31, 26, 33, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: KITSUNE_COLORS.plumInk,
  },
})
