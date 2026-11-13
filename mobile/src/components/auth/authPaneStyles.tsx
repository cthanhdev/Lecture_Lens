import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'
import { FramedBrandLogo } from '../onboarding/FramedBrandLogo'

export interface AuthMascotHeroProps {
  title: string
  subtitle: string
  pageIndex: 0 | 1
  scrollProgress?: SharedValue<number>
  onOpenInspector: () => void
  compact?: boolean
}

/**
 * Shared Mascot Hero section with scroll-linked Kitsune depth parallax & hidden long-press inspector trigger.
 */
export const AuthMascotHero: React.FC<AuthMascotHeroProps> = ({
  title,
  subtitle,
  pageIndex,
  scrollProgress,
  onOpenInspector,
  compact = false,
}) => {
  const fallbackProgress = useSharedValue<number>(pageIndex)
  const progress = scrollProgress ?? fallbackProgress

  const mascotParallaxStyle = useAnimatedStyle(() => {
    const p = progress.value
    const delta = p - pageIndex
    const translateX = interpolate(delta, [-1, 0, 1], [22, 0, -22], Extrapolation.CLAMP)
    const scale = interpolate(
      Math.abs(delta),
      [0, 0.5, 1],
      [1, 0.94, 0.9],
      Extrapolation.CLAMP
    )
    const opacity = interpolate(
      Math.abs(delta),
      [0, 0.85, 1],
      [1, 0.55, 0.35],
      Extrapolation.CLAMP
    )
    return {
      opacity,
      transform: [{ translateX }, { scale }],
    }
  }, [pageIndex, progress])

  return (
    <Animated.View
      style={[
        authPaneStyles.heroBlock,
        compact && authPaneStyles.heroBlockCompact,
        mascotParallaxStyle,
      ]}
    >
      <Pressable
        onLongPress={onOpenInspector}
        delayLongPress={450}
        accessibilityRole="imagebutton"
        accessibilityLabel="LectureLens Kitsune mascot"
      >
        <FramedBrandLogo variant="auth" />
      </Pressable>
      <Text
        style={[
          authPaneStyles.heroTitle,
          compact && authPaneStyles.heroTitleCompact,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          authPaneStyles.heroSubtitle,
          compact && authPaneStyles.heroSubtitleCompact,
        ]}
      >
        {subtitle}
      </Text>
    </Animated.View>
  )
}

export const authPaneStyles = StyleSheet.create({
  slideScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  heroBlock: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 18,
  },
  heroBlockCompact: {
    marginBottom: 16,
  },
  heroTitle: {
    marginTop: 14,
    fontSize: 26,
    lineHeight: 32,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    textAlign: 'center',
  },
  heroTitleCompact: {
    marginTop: 12,
    fontSize: 25,
    lineHeight: 31,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13.5,
    lineHeight: 19,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'center',
  },
  heroSubtitleCompact: {
    maxWidth: 278,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderRadius: KITSUNE_RADII.squircleCard,
    borderWidth: 1.5,
    borderColor: KITSUNE_COLORS.mirukuBorder,
    padding: 20,
    ...KITSUNE_SHADOWS.miruku,
  },
  socialStack: {
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 44,
  },
  switchPrompt: {
    fontSize: 13.5,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  switchAction: {
    fontSize: 13.5,
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  pressedLink: {
    opacity: 0.65,
  },
})
