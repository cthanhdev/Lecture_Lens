import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, shadows, spacing } from '../../core/theme';
import { Screen } from '../../shared/components';
import { Text, Button, GlassCard } from '../../shared/ui';
import { useAuth } from '../../core/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  iconName: keyof typeof Feather.glyphMap;
  badge1: { icon: keyof typeof Feather.glyphMap; title: string; desc: string };
  badge2: { icon: keyof typeof Feather.glyphMap; title: string; desc: string };
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'slide-1',
    step: '1 / 3',
    title: 'Record or Upload Any Lecture',
    subtitle: 'Capture live audio in class with real-time bookmarking, or import your MP3, M4A, and WAV files.',
    iconName: 'mic',
    badge1: { icon: 'mic', title: 'Live Voice', desc: 'Instant capture in lecture halls' },
    badge2: { icon: 'upload-cloud', title: 'Import File', desc: 'MP3, M4A, WAV audio files' },
  },
  {
    id: 'slide-2',
    step: '2 / 3',
    title: 'Find What Matters in Seconds',
    subtitle: 'AI automatically distills lectures into Cornell-structured notes, definitions, and clickable timestamps.',
    iconName: 'book-open',
    badge1: { icon: 'file-text', title: 'Auto-Summaries', desc: 'Clean chapter outlines' },
    badge2: { icon: 'clock', title: 'Audio Timestamps', desc: 'Jump directly to key quotes' },
  },
  {
    id: 'slide-3',
    step: '3 / 3',
    title: 'Remember It for Exams',
    subtitle: 'Transform complex lecture concepts into active recall flashcards powered by spaced repetition.',
    iconName: 'award',
    badge1: { icon: 'layers', title: 'Active Recall', desc: 'Interactive 3D flip cards' },
    badge2: { icon: 'zap', title: 'Spaced Repetition', desc: 'Maintain your daily study streak' },
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { completeOnboarding } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slideIndex !== activeIndex && slideIndex >= 0 && slideIndex < ONBOARDING_SLIDES.length) {
      setActiveIndex(slideIndex);
    }
  };

  const handleNext = async () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    } else {
      await completeOnboarding();
      navigation.navigate('SignIn');
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigation.navigate('SignIn');
  };

  const renderSlideItem = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={styles.slideContainer}>
        {/* Mascot / Icon Hero Plate */}
        <View style={styles.heroBox}>
          <View style={styles.ambientGlow} />
          <View style={[styles.mascotSquircle, shadows.card]}>
            <Feather name={item.iconName} size={54} color={colors.brand.primary} />
            <View style={styles.starBadge}>
              <Feather name="star" size={12} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Narrative Zone */}
        <View style={styles.narrativeZone}>
          <Text variant="caption" color="coralDeep" style={styles.stepBadge}>
            STEP {item.step}
          </Text>
          <Text variant="h1" center style={styles.slideTitle}>
            {item.title}
          </Text>
          <Text variant="body" color="secondary" center style={styles.slideSubtitle}>
            {item.subtitle}
          </Text>
        </View>

        {/* Feature Preview Badges */}
        <View style={styles.badgesRow}>
          <GlassCard style={styles.featureBadge} padding="base">
            <View style={styles.badgeIconCircle}>
              <Feather name={item.badge1.icon} size={16} color={colors.brand.primary} />
            </View>
            <View style={styles.badgeTextCol}>
              <Text variant="title" style={{ fontSize: 13 }}>
                {item.badge1.title}
              </Text>
              <Text variant="caption" color="muted">
                {item.badge1.desc}
              </Text>
            </View>
          </GlassCard>

          <GlassCard style={styles.featureBadge} padding="base">
            <View style={styles.badgeIconCircle}>
              <Feather name={item.badge2.icon} size={16} color={colors.brand.primary} />
            </View>
            <View style={styles.badgeTextCol}>
              <Text variant="title" style={{ fontSize: 13 }}>
                {item.badge2.title}
              </Text>
              <Text variant="caption" color="muted">
                {item.badge2.desc}
              </Text>
            </View>
          </GlassCard>
        </View>
      </View>
    );
  };

  return (
    <Screen style={styles.screen}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandLogoBox}>
            <Feather name="book" size={16} color={colors.brand.primary} />
          </View>
          <Text variant="title" color="primary" style={styles.brandName}>
            LectureLens
          </Text>
        </View>
        <Button
          title="Skip"
          variant="ghost"
          size="sm"
          onPress={handleSkip}
        />
      </View>

      {/* Swipeable Slides Pager */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlideItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.pager}
      />

      {/* Footer Stepper & Action */}
      <View style={styles.footer}>
        <View style={styles.stepperDots}>
          {ONBOARDING_SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Button
          title={activeIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Continue'}
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
  screen: {
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  brandName: {
    fontSize: 16,
  },
  pager: {
    flex: 1,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
  heroBox: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: spacing.md,
  },
  ambientGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.brand.primarySoft,
    opacity: 0.55,
  },
  mascotSquircle: {
    width: 140,
    height: 140,
    borderRadius: radius.card,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.glass,
    position: 'relative',
  },
  starBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  narrativeZone: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  stepBadge: {
    fontWeight: '700',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  slideTitle: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: spacing.xs,
  },
  slideSubtitle: {
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  badgesRow: {
    width: '100%',
    gap: spacing.sm,
    marginVertical: spacing.base,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  badgeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  badgeTextCol: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  stepperDots: {
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
    width: 28,
    backgroundColor: colors.brand.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.bg.containerHigh,
  },
});
