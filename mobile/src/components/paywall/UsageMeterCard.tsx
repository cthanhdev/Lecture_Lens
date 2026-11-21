import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

export interface UsageMeterCardProps {
  readonly planPillLabel: string
  readonly usageLabel: string
  readonly usageSuffix: string
  readonly remainingLabel: string
  readonly usageRatio: number
}

export const UsageMeterCard: React.FC<UsageMeterCardProps> = ({
  planPillLabel,
  usageLabel,
  usageSuffix,
  remainingLabel,
  usageRatio,
}) => {
  const animatedWidth = useSharedValue(0)

  useEffect(() => {
    animatedWidth.value = withTiming(Math.min(1, Math.max(0, usageRatio)), {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    })
  }, [animatedWidth, usageRatio])

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.round(animatedWidth.value * 100)}%`,
  }))

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.planPill}>
          <View style={styles.dot} />
          <Text style={styles.planText}>{planPillLabel}</Text>
        </View>

        <View style={styles.usageCol}>
          <Text style={styles.usageText}>{usageLabel}</Text>
          <Text style={styles.usageText}>{usageSuffix}</Text>
        </View>

        <Text style={styles.remainingText}>{remainingLabel}</Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    ...KITSUNE_SHADOWS.miruku,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(245, 195, 201, 0.42)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  planText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInk,
  },
  usageCol: {
    flex: 1,
  },
  usageText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12.5,
    lineHeight: 16.5,
    color: KITSUNE_COLORS.plumInk,
  },
  remainingText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: KITSUNE_COLORS.kitsuneCoralDark,
    textAlign: 'right',
    maxWidth: 74,
  },
  track: {
    height: 7,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(169, 212, 232, 0.42)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
})
