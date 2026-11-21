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
import { Button } from '../ui/button'
import { Icon } from '../ui/icons/Icon'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

const BRAND_LOGO = require('../../../assets/images/logo-LectureLens.png')

export interface PaywallHeroProps {
  readonly badgeLabel: string
  readonly headline: string
  readonly subtitle: string
  readonly onClose: () => void
}

export const PaywallHero: React.FC<PaywallHeroProps> = ({
  badgeLabel,
  headline,
  subtitle,
  onClose,
}) => {
  const floatY = useSharedValue(0)

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    )
  }, [floatY])

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }))

  return (
    <View style={styles.container}>
      {/* Top Bar: Close circle & Kitsune Plus pill */}
      <View style={styles.topBar}>
        <Button
          variant="surface"
          size="icon"
          accessibilityLabel="Close Kitsune Plus offer"
          onPress={onClose}
          style={styles.closeBtn}
        >
          <Icon name="close" size="md" strokeColor={KITSUNE_COLORS.plumInk} />
        </Button>

        <View style={styles.plusBadge}>
          <View style={styles.coralDot} />
          <Text style={styles.plusBadgeText}>{badgeLabel}</Text>
        </View>
      </View>

      {/* Floating Fox Mascot Squircle + Star Badge */}
      <Animated.View style={[styles.mascotOuter, mascotStyle]}>
        <View style={styles.mascotInner}>
          <Image
            source={BRAND_LOGO}
            style={styles.logoImage}
            resizeMode="cover"
            accessibilityLabel="Kitsune Plus fox mascot"
          />
        </View>
        <View style={styles.starBadge}>
          <Icon
            name="star"
            size="sm"
            strokeColor={KITSUNE_COLORS.plumInk}
          />
        </View>
      </Animated.View>

      {/* Headline & Subtitle */}
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
  },
  plusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    ...KITSUNE_SHADOWS.miruku,
  },
  coralDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  plusBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInk,
  },
  mascotOuter: {
    width: 118,
    height: 118,
    borderRadius: 30,
    padding: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    position: 'relative',
    marginTop: 2,
    marginBottom: 4,
    ...KITSUNE_SHADOWS.plumModal,
  },
  mascotInner: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: '#FDF5E8',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  starBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: KITSUNE_COLORS.mochiYellow,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.miruku,
  },
  headline: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: KITSUNE_COLORS.plumInk,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: KITSUNE_COLORS.plumInkMuted,
    textAlign: 'center',
    paddingHorizontal: 18,
  },
})
