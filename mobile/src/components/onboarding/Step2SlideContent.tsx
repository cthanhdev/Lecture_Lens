// Step2SlideContent: Screen 03 - Onboarding Step 2 (Find What Matters)
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Icon } from '../ui/icons/Icon'
import { MiniWaveformBars } from './MiniWaveformBars'
import { OnboardingSlideHeader } from './OnboardingSlideHeader'
import {
  ONBOARDING_SLIDES,
  STEP_2_KEYWORD_CHIPS,
  STEP_2_PREVIEW_COPY,
  STEP_2_WAVEFORM_BARS,
} from '../../modules/onboarding/onboardingSlides'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

interface Step2SlideContentProps {
  compactScale: number
}

export const Step2SlideContent: React.FC<Step2SlideContentProps> = ({
  compactScale,
}) => {
  const slide = ONBOARDING_SLIDES[1]

  return (
    <View style={styles.container}>
      <OnboardingSlideHeader />

      <View style={styles.body}>
        {/* Interactive Miruku Glass Collage */}
        <View style={styles.collageStage}>
          {/* Tilted Back Card (-3.5deg): Audio Waveform Preview */}
          <View style={styles.backAudioCard}>
            <View style={styles.audioHeaderRow}>
              <View style={styles.playCircle}>
                <Icon name="play" size={11} strokeColor="#FFFFFF" />
              </View>
              <View style={styles.audioMeta}>
                <Text style={styles.audioTitle}>{STEP_2_PREVIEW_COPY.audioTitle}</Text>
                <Text style={styles.audioTime}>{STEP_2_PREVIEW_COPY.audioTimestamp}</Text>
              </View>
              <View style={styles.insightBadge}>
                <Text style={styles.insightBadgeText}>
                  {STEP_2_PREVIEW_COPY.audioBadge}
                </Text>
              </View>
            </View>

            <View style={styles.waveformBox}>
              <MiniWaveformBars
                bars={STEP_2_WAVEFORM_BARS}
                barWidth={3}
                gap={Math.max(4, Math.round(7 * compactScale))}
                inactiveColor="rgba(38, 19, 51, 0.22)"
                activeColor={KITSUNE_COLORS.kitsuneCoral}
                scale={0.85 * compactScale}
              />
            </View>
          </View>

          {/* Tilted Front Card (+2.5deg): AI Highlight & Summary Note */}
          <View style={styles.frontNotesCard}>
            <View style={styles.notesHeaderRow}>
              <View style={styles.notesTitleGroup}>
                <Icon
                  name="sparkles"
                  size={14}
                  strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
                />
                <Text style={styles.notesHeaderText}>
                  {STEP_2_PREVIEW_COPY.notesHeader}
                </Text>
              </View>
              <Text style={styles.syncBadgeText}>{STEP_2_PREVIEW_COPY.syncBadge}</Text>
            </View>

            <Text style={styles.notesQuote} numberOfLines={1}>
              {STEP_2_PREVIEW_COPY.notesQuote}
            </Text>

            <View style={styles.mochiHighlightBox}>
              <View style={styles.highlightTextRow}>
                <View style={styles.starBadge}>
                  <Icon
                    name="star"
                    size={10}
                    strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
                  />
                </View>
                <Text style={styles.highlightText}>
                  {STEP_2_PREVIEW_COPY.highlightText}
                </Text>
              </View>

              <View style={styles.highlightFooter}>
                <Text style={styles.bookmarkLabel}>
                  {STEP_2_PREVIEW_COPY.highlightFooterLabel}
                </Text>
                <Text style={styles.bookmarkTime}>
                  {STEP_2_PREVIEW_COPY.highlightTimestamp}
                </Text>
              </View>
            </View>
          </View>

          {/* 3 Floating Keyword Chips */}
          <View style={styles.chipsRow}>
            {STEP_2_KEYWORD_CHIPS.map((chip) => (
              <View
                key={chip.id}
                style={[
                  styles.floatingChip,
                  chip.id === 'central-bank' ? styles.floatingChipFeatured : undefined,
                  { transform: [{ rotate: `${chip.rotationDeg}deg` }] },
                ]}
              >
                <View style={[styles.chipDot, { backgroundColor: chip.dotColor }]} />
                <Text style={styles.chipLabel}>{chip.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {slide.contextPill ? (
          <View style={styles.contextPill}>
            <Icon
              name={slide.contextPill.icon}
              size={12}
              strokeColor={KITSUNE_COLORS.kitsuneCoral}
            />
            <Text style={styles.contextPillText}>{slide.contextPill.label}</Text>
          </View>
        ) : null}

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
  collageStage: {
    width: '100%',
    marginBottom: 18,
  },
  backAudioCard: {
    width: '78%',
    alignSelf: 'flex-start',
    borderRadius: KITSUNE_RADII.squircleCard,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.96)',
    padding: 14,
    transform: [{ rotate: '-3.5deg' }],
    ...KITSUNE_SHADOWS.miruku,
  },
  audioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioMeta: {
    flex: 1,
  },
  audioTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInk,
  },
  audioTime: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 10.5,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  insightBadge: {
    paddingHorizontal: 9,
    height: 22,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(253, 203, 209, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
  waveformBox: {
    marginTop: 10,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(252, 240, 251, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  frontNotesCard: {
    width: '84%',
    alignSelf: 'flex-end',
    marginTop: -40,
    borderRadius: KITSUNE_RADII.squircleCard,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.98)',
    padding: 15,
    transform: [{ rotate: '2.5deg' }],
    ...KITSUNE_SHADOWS.plumModal,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notesTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  notesHeaderText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInk,
  },
  syncBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: '#3A6475',
  },
  notesQuote: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInkMuted,
    marginBottom: 8,
  },
  mochiHighlightBox: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 226, 122, 0.55)',
    padding: 11,
  },
  highlightTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  starBadge: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  highlightText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: KITSUNE_COLORS.plumInk,
  },
  highlightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
    paddingLeft: 25,
  },
  bookmarkLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
  bookmarkTime: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: KITSUNE_COLORS.plumInk,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  floatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 27,
    paddingHorizontal: 11,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    ...KITSUNE_SHADOWS.miruku,
  },
  floatingChipFeatured: {
    height: 31,
    paddingHorizontal: 14,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInk,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 14,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(253, 203, 209, 0.42)',
    marginBottom: 14,
  },
  contextPillText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.7,
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
    paddingHorizontal: 6,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14.5,
    lineHeight: 21,
    color: KITSUNE_COLORS.plumInkMuted,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
})
