import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'
import { AUTH_CARD_DECK_SPEC, type AuthScreenStep } from '../../modules/auth'
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

export interface AuthFlashcardStageProps {
  readonly pageIndex: AuthScreenStep
  readonly scrollProgress: SharedValue<number>
  readonly children: React.ReactNode
}

/**
 * Scroll-linked 2.5D Mochi Flashcard deck wrapper giving Auth cards soft lift,
 * gentle lateral magnetic pull, depth scale, and cushioned card-tilt kinematics.
 */
export const AuthFlashcardStage: React.FC<AuthFlashcardStageProps> = ({
  pageIndex,
  scrollProgress,
  children,
}) => {
  const flashcardAnimatedStyle = useAnimatedStyle(() => {
    const delta = scrollProgress.value - pageIndex
    const input = [-1, -0.5, 0, 0.5, 1]

    const translateX = interpolate(
      delta,
      input,
      [
        -AUTH_CARD_DECK_SPEC.maxTranslateX,
        -AUTH_CARD_DECK_SPEC.midTranslateX,
        0,
        AUTH_CARD_DECK_SPEC.midTranslateX,
        AUTH_CARD_DECK_SPEC.maxTranslateX,
      ],
      Extrapolation.CLAMP
    )
    const translateY = interpolate(
      delta,
      input,
      [
        AUTH_CARD_DECK_SPEC.maxTranslateY,
        AUTH_CARD_DECK_SPEC.midTranslateY,
        0,
        AUTH_CARD_DECK_SPEC.midTranslateY,
        AUTH_CARD_DECK_SPEC.maxTranslateY,
      ],
      Extrapolation.CLAMP
    )
    const scale = interpolate(
      delta,
      input,
      [
        AUTH_CARD_DECK_SPEC.minScale,
        AUTH_CARD_DECK_SPEC.midScale,
        1,
        AUTH_CARD_DECK_SPEC.midScale,
        AUTH_CARD_DECK_SPEC.minScale,
      ],
      Extrapolation.CLAMP
    )
    const rotateZDeg = interpolate(
      delta,
      input,
      [
        AUTH_CARD_DECK_SPEC.maxRotateZDeg,
        AUTH_CARD_DECK_SPEC.midRotateZDeg,
        0,
        -AUTH_CARD_DECK_SPEC.midRotateZDeg,
        -AUTH_CARD_DECK_SPEC.maxRotateZDeg,
      ],
      Extrapolation.CLAMP
    )
    const rotateYDeg = interpolate(
      delta,
      input,
      [
        -AUTH_CARD_DECK_SPEC.maxRotateYDeg,
        -AUTH_CARD_DECK_SPEC.midRotateYDeg,
        0,
        AUTH_CARD_DECK_SPEC.midRotateYDeg,
        AUTH_CARD_DECK_SPEC.maxRotateYDeg,
      ],
      Extrapolation.CLAMP
    )
    const opacity = interpolate(
      delta,
      input,
      [
        AUTH_CARD_DECK_SPEC.minOpacity,
        AUTH_CARD_DECK_SPEC.midOpacity,
        1,
        AUTH_CARD_DECK_SPEC.midOpacity,
        AUTH_CARD_DECK_SPEC.minOpacity,
      ],
      Extrapolation.CLAMP
    )

    return {
      opacity,
      transform: [
        { perspective: AUTH_CARD_DECK_SPEC.perspective },
        { translateX },
        { translateY },
        { scale },
        { rotateZ: `${rotateZDeg}deg` as const },
        { rotateY: `${rotateYDeg}deg` as const },
      ],
    }
  }, [pageIndex, scrollProgress])

  return (
    <Animated.View style={[authPaneStyles.flashcardStage, flashcardAnimatedStyle]}>
      {children}
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
    justifyContent: 'flex-start',
    minHeight: 186,
    marginTop: 2,
    marginBottom: 16,
  },
  heroBlockCompact: {
    minHeight: 186,
    marginTop: 2,
    marginBottom: 16,
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 26,
    lineHeight: 32,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    textAlign: 'center',
  },
  heroTitleCompact: {
    marginTop: 12,
    fontSize: 26,
    lineHeight: 32,
  },
  heroSubtitle: {
    marginTop: 4,
    maxWidth: 320,
    minHeight: 38,
    fontSize: 13.5,
    lineHeight: 19,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'center',
  },
  heroSubtitleCompact: {
    maxWidth: 320,
    minHeight: 38,
  },
  flashcardStage: {
    width: '100%',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderRadius: KITSUNE_RADII.squircleCard,
    borderWidth: 1.5,
    borderColor: KITSUNE_COLORS.mirukuBorder,
    padding: 20,
    ...KITSUNE_SHADOWS.miruku,
  },
  formCardSignIn: {
    minHeight: 316,
    paddingVertical: 22,
    justifyContent: 'space-between',
  },
  formCardCreateAccount: {
    paddingVertical: 20,
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
