// Step3SlideContent: Screen 04 - Onboarding Step 3 (Remember It)
import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Icon } from '../ui/icons/Icon'
import { MiniWaveformBars } from './MiniWaveformBars'
import { OnboardingSlideHeader } from './OnboardingSlideHeader'
import {
  ONBOARDING_SLIDES,
  STEP_3_FLASHCARD_COPY,
  STEP_3_MINI_WAVEFORM_BARS,
} from '../../modules/onboarding/onboardingSlides'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const Step3SlideContent: React.FC = () => {
  const slide = ONBOARDING_SLIDES[2]
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const barScale = useSharedValue(1)

  useEffect(() => {
    if (!isPreviewPlaying) return
    const timer = setTimeout(() => {
      setIsPreviewPlaying(false)
    }, 2400)
    return () => clearTimeout(timer)
  }, [isPreviewPlaying])

  const barAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: barScale.value }],
  }))

  const handleTogglePreview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setIsPreviewPlaying((prev) => !prev)
  }

  return (
    <View style={styles.container}>
      {/* Clean top Safe Area header without Skip pill */}
      <OnboardingSlideHeader />

      <View style={styles.body}>
        {/* Single Gently Tilted Miruku Flashcard (-1deg per SVG 04) */}
        <View style={styles.flashcard}>
          {/* Top Metadata Pills */}
          <View style={styles.cardTopRow}>
            <View style={styles.subjectPill}>
              <View style={styles.subjectDot} />
              <Text style={styles.subjectPillText}>
                {STEP_3_FLASHCARD_COPY.subject}
              </Text>
            </View>

            <View style={styles.streakPill}>
              <Icon
                name="flame"
                size={12}
                strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
              />
              <Text style={styles.streakPillText}>
                {STEP_3_FLASHCARD_COPY.streak}
              </Text>
            </View>
          </View>

          {/* Q&A Flashcard Content */}
          <Text style={styles.question}>{STEP_3_FLASHCARD_COPY.question}</Text>
          <Text style={styles.answer}>{STEP_3_FLASHCARD_COPY.answer}</Text>

          {/* Coral Audio Replay Bar */}
          <AnimatedPressable
            onPress={handleTogglePreview}
            onPressIn={() => {
              barScale.set(withTiming(0.97, { duration: 150 }))
            }}
            onPressOut={() => {
              barScale.set(withTiming(1, { duration: 150 }))
            }}
            style={[styles.replayBar, barAnimatedStyle]}
            accessibilityRole="button"
            accessibilityLabel={STEP_3_FLASHCARD_COPY.replayLabel}
          >
            <View style={styles.replayLeft}>
              <View style={styles.replayPlayCircle}>
                <Icon
                  name={isPreviewPlaying ? 'pause' : 'play'}
                  size={11}
                  strokeColor={KITSUNE_COLORS.kitsuneCoral}
                />
              </View>
              <Text style={styles.replayLabel}>
                {isPreviewPlaying
                  ? 'Playing 0:24 clip...'
                  : STEP_3_FLASHCARD_COPY.replayLabel}
              </Text>
            </View>

            <MiniWaveformBars
              bars={STEP_3_MINI_WAVEFORM_BARS}
              barWidth={2}
              gap={2.5}
              activeColor="#FFFFFF"
            />
          </AnimatedPressable>

          {/* Bottom Review Status Pills */}
          <View style={styles.cardBottomRow}>
            <View style={styles.nextReviewPill}>
              <Icon
                name="clock"
                size={11}
                strokeColor={KITSUNE_COLORS.plumInkMuted}
              />
              <Text style={styles.nextReviewText}>
                {STEP_3_FLASHCARD_COPY.nextReviewLabel}
              </Text>
            </View>

            <View style={styles.masteredPill}>
              <Icon name="check" size={11} strokeColor={KITSUNE_COLORS.plumInk} />
              <Text style={styles.masteredText}>
                {STEP_3_FLASHCARD_COPY.statusLabel}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashcard: {
    width: '100%',
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.96)',
    padding: 20,
    marginBottom: 28,
    transform: [{ rotate: '-1deg' }],
    ...KITSUNE_SHADOWS.plumModal,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  subjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 24,
    paddingHorizontal: 11,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: '#BEE9FD',
  },
  subjectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3A6475',
  },
  subjectPillText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#234756',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 24,
    paddingHorizontal: 11,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: '#FFD9DD',
  },
  streakPillText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
  question: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 19,
    lineHeight: 25,
    color: KITSUNE_COLORS.plumInk,
    marginBottom: 6,
  },
  answer: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    lineHeight: 19.5,
    color: KITSUNE_COLORS.plumInkMuted,
    marginBottom: 16,
  },
  replayBar: {
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  replayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  replayPlayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nextReviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 24,
    paddingHorizontal: 10,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: '#F0E5F0',
  },
  nextReviewText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  masteredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 24,
    paddingHorizontal: 11,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: '#FDCBD1',
  },
  masteredText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: KITSUNE_COLORS.plumInk,
  },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 26,
    lineHeight: 33,
    letterSpacing: -0.5,
    color: KITSUNE_COLORS.plumInk,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14.5,
    lineHeight: 21,
    color: KITSUNE_COLORS.plumInkMuted,
    textAlign: 'center',
    paddingHorizontal: 14,
  },
})
