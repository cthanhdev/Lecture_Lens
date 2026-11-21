import React, { useEffect } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable'
import { KITSUNE_COLORS, KITSUNE_SHADOWS } from '../../theme/tokens'

const BRAND_LOGO = require('../../../assets/images/logo-LectureLens.png')

export interface GreetingRowProps {
  readonly greeting: string
  readonly dateLabel: string
  readonly showOnlineDot: boolean
  readonly onPressAvatar: () => void
}

export const GreetingRow: React.FC<GreetingRowProps> = ({
  greeting,
  dateLabel,
  showOnlineDot,
  onPressAvatar,
}) => {
  const floatY = useSharedValue(0)

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    )
  }, [floatY])

  const mascotFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }))

  return (
    <View style={styles.row}>
      <View style={styles.leftGroup}>
        <Animated.View style={[styles.mascotSquircle, mascotFloatStyle]}>
          <Image
            source={BRAND_LOGO}
            style={styles.mascotImage}
            resizeMode="cover"
            accessibilityLabel="Kitsune study mascot"
          />
        </Animated.View>

        <View style={styles.textCol}>
          <Text numberOfLines={1} style={styles.greetingText}>
            {greeting}
          </Text>
          <Text numberOfLines={1} style={styles.dateText}>
            {dateLabel}
          </Text>
        </View>
      </View>

      <MochiPressable
        accessibilityLabel="Open profile and stats"
        onPress={onPressAvatar}
        style={styles.avatarRing}
      >
        <View style={styles.avatarInner}>
          <Icon name="profile" size="md" strokeColor="#FFFFFF" />
        </View>
        {showOnlineDot ? <View style={styles.onlineDot} /> : null}
      </MochiPressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mascotSquircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    padding: 4,
    backgroundColor: 'rgba(253, 203, 209, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...KITSUNE_SHADOWS.miruku,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  textCol: {
    flex: 1,
    gap: 1,
  },
  greetingText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.4,
    color: KITSUNE_COLORS.plumInk,
  },
  dateText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    ...KITSUNE_SHADOWS.miruku,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 19,
    backgroundColor: '#1F1A21',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: KITSUNE_COLORS.matchaMint,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
})
