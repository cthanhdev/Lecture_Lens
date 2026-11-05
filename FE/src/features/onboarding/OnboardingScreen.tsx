import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import { Screen } from '../../shared/components';
import { Text, Button } from '../../shared/ui';
import { useAuth } from '../../core/auth';

const SLIDES = [
  {
    step: '1 / 3',
    title: 'Record or Upload Any Lecture',
    desc: 'Capture live audio from class or import MP3, M4A, and WAV files with instant on-device processing.',
    icon: 'mic',
  },
  {
    step: '2 / 3',
    title: 'Find What Matters in Seconds',
    desc: 'Automatic Cornell-structured summaries, keyword clouds, and definitions with clickable timestamps.',
    icon: 'search',
  },
  {
    step: '3 / 3',
    title: 'Remember It for Exams',
    desc: 'Smart flashcards generated directly from your lectures with spaced repetition algorithms.',
    icon: 'check-circle',
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { completeOnboarding } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = async () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      await completeOnboarding();
      navigation.navigate('SignIn');
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigation.navigate('SignIn');
  };

  const slide = SLIDES[currentSlide];

  return (
    <Screen style={styles.container}>
      <View style={styles.topBar}>
        <Text variant="label" color="muted">
          KITSUNE ONBOARDING
        </Text>
        <Button title="Skip" variant="ghost" size="sm" onPress={handleSkip} />
      </View>

      <View style={styles.heroArea}>
        <View style={styles.mascotCircle}>
          <Feather name={slide.icon as any} size={54} color={colors.brand.primary} />
        </View>
        <Text variant="caption" color="muted" style={styles.stepBadge}>
          {slide.step}
        </Text>
        <Text variant="h1" center style={styles.slideTitle}>
          {slide.title}
        </Text>
        <Text variant="body" color="secondary" center style={styles.slideDesc}>
          {slide.desc}
        </Text>
      </View>

      <View style={styles.footer}>
        {/* Stepper dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlide ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Button
          title={currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleNext}
          icon={<Feather name="arrow-right" size={18} color="#FFFFFF" />}
          iconPosition="right"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  heroArea: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  mascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  stepBadge: {
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  slideTitle: {
    marginBottom: spacing.base,
  },
  slideDesc: {
    lineHeight: 22,
  },
  footer: {
    paddingBottom: spacing.xxl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.brand.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.bg.containerHigh,
  },
});
