// Step1SlideContent: Screen 02 - Onboarding Step 1 (Record or Upload)
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Icon } from '../ui/icons/Icon'
import { FramedBrandLogo } from './FramedBrandLogo'
import { OnboardingSlideHeader } from './OnboardingSlideHeader'
import {
  ONBOARDING_SLIDES,
  STEP_1_FEATURE_CARDS,
} from '../../modules/onboarding/onboardingSlides'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

interface Step1SlideContentProps {
  compactScale: number
}

export const Step1SlideContent: React.FC<Step1SlideContentProps> = ({
  compactScale,
}) => {
  const slide = ONBOARDING_SLIDES[0]

  return (
    <View style={styles.container}>
      <OnboardingSlideHeader pillLabel={slide.headerPill} variant="sakura" />

      <View style={styles.body}>
        <View style={styles.heroWrapper}>
          <FramedBrandLogo variant="step1" scale={compactScale} />
        </View>

        {slide.contextPill ? (
          <View style={styles.contextPill}>
            <Icon
              name={slide.contextPill.icon}
              size={14}
              strokeColor={KITSUNE_COLORS.kitsuneCoral}
            />
            <Text style={styles.contextPillText}>{slide.contextPill.label}</Text>
          </View>
        ) : null}

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        <View style={styles.cardsRow}>
          {STEP_1_FEATURE_CARDS.map((card) => {
            const isCoral = card.tone === 'coral'
            return (
              <View key={card.id} style={styles.featureCard}>
                <View
                  style={[
                    styles.cardIconCircle,
                    isCoral ? styles.cardIconCoral : styles.cardIconMist,
                  ]}
                >
                  <Icon
                    name={card.icon}
                    size={16}
                    strokeColor={isCoral ? KITSUNE_COLORS.kitsuneCoral : '#3A6475'}
                  />
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </View>
              </View>
            )
          })}
        </View>
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
  heroWrapper: {
    marginBottom: 16,
    alignItems: 'center',
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 14,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(240, 229, 240, 0.90)',
    marginBottom: 16,
  },
  contextPillText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 26,
    lineHeight: 33,
    letterSpacing: -0.5,
    color: KITSUNE_COLORS.plumInk,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14.5,
    lineHeight: 21,
    color: KITSUNE_COLORS.plumInkMuted,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  featureCard: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: 'rgba(246, 234, 246, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    ...KITSUNE_SHADOWS.miruku,
  },
  cardIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconCoral: {
    backgroundColor: 'rgba(244, 127, 114, 0.20)',
  },
  cardIconMist: {
    backgroundColor: 'rgba(125, 167, 186, 0.28)',
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: KITSUNE_COLORS.plumInk,
  },
  cardSubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkMuted,
    marginTop: 1,
  },
})
