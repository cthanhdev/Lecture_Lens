// LibraryEmptyStateView: Screen 11 (Library - Empty State)
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { LibraryEmptyStateModel, SubjectTone } from '../../modules/study/types'
import { KITSUNE_COLORS, KITSUNE_SHADOWS } from '../../theme/tokens'
import { FramedBrandLogo } from '../onboarding/FramedBrandLogo'
import { Button } from '../ui/button/Button'
import { Icon } from '../ui/icons/Icon'

export interface LibraryEmptyStateViewProps {
  model: LibraryEmptyStateModel
  onRecordFirstLecture: () => void
  onUploadFile: () => void
}

const FEATURE_ICON_BG: Record<SubjectTone, string> = {
  mist: 'rgba(169, 212, 232, 0.45)',
  sakura: 'rgba(245, 195, 201, 0.48)',
  matcha: 'rgba(190, 225, 208, 0.48)',
  mochi: 'rgba(255, 226, 122, 0.45)',
}

export const LibraryEmptyStateView: React.FC<LibraryEmptyStateViewProps> = ({
  model,
  onRecordFirstLecture,
  onUploadFile,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.mascotStage}>
          <View style={[styles.petalDot, styles.petalTopLeft]} />
          <View style={[styles.petalDot, styles.petalTopRight]} />
          <View style={[styles.petalDot, styles.petalMidLeft]} />
          <View style={[styles.petalDot, styles.petalBottomLeft]} />
          <View style={[styles.petalDot, styles.petalBottomRight]} />
          <FramedBrandLogo variant="auth" scale={1.18} />
        </View>

        <View style={styles.copyGroup}>
          <Text style={styles.title}>{model.title}</Text>
          <Text style={styles.subtitle}>{model.subtitle}</Text>
        </View>

        <View style={styles.actionsGroup}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={onRecordFirstLecture}
            leftIcon={<Icon name="mic" size="md" strokeColor="#FFFFFF" />}
            accessibilityLabel={model.primaryCtaLabel}
          >
            {model.primaryCtaLabel}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onPress={onUploadFile}
            leftIcon={
              <Icon
                name="upload"
                size="md"
                strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
              />
            }
            accessibilityLabel={model.secondaryCtaLabel}
          >
            {model.secondaryCtaLabel}
          </Button>
        </View>

        <View style={styles.privacyRow}>
          <Icon
            name="lock"
            size="xs"
            strokeColor={KITSUNE_COLORS.plumInkSubtle}
          />
          <Text style={styles.privacyText}>{model.privacyNote}</Text>
        </View>
      </View>

      <View style={styles.bentoRow}>
        {model.featureCards.map((card) => (
          <View key={card.id} style={styles.bentoCard}>
            <View
              style={[
                styles.featureIconCircle,
                { backgroundColor: FEATURE_ICON_BG[card.tone] },
              ]}
            >
              <Icon
                name={card.icon}
                size="sm"
                strokeColor={KITSUNE_COLORS.plumInk}
              />
            </View>
            <Text style={styles.featureTitle}>{card.title}</Text>
            <Text style={styles.featureDescription}>{card.description}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 22,
    paddingVertical: 26,
    alignItems: 'center',
    gap: 18,
    ...KITSUNE_SHADOWS.miruku,
  },
  mascotStage: {
    width: 176,
    height: 152,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  petalDot: {
    position: 'absolute',
    backgroundColor: 'rgba(245, 195, 201, 0.72)',
  },
  petalTopLeft: {
    top: 4,
    left: 24,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  petalTopRight: {
    top: 14,
    right: 18,
    width: 11,
    height: 7,
    borderRadius: 5,
    transform: [{ rotate: '-35deg' }],
    backgroundColor: 'rgba(244, 127, 114, 0.55)',
  },
  petalMidLeft: {
    top: 70,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(244, 127, 114, 0.60)',
  },
  petalBottomLeft: {
    bottom: 6,
    left: 24,
    width: 11,
    height: 7,
    borderRadius: 5,
    transform: [{ rotate: '35deg' }],
  },
  petalBottomRight: {
    bottom: 2,
    right: 28,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  copyGroup: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 21,
    lineHeight: 27,
    color: KITSUNE_COLORS.plumInk,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    lineHeight: 20,
    color: KITSUNE_COLORS.plumInkMuted,
    textAlign: 'center',
  },
  actionsGroup: {
    width: '100%',
    gap: 12,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 2,
  },
  privacyText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: KITSUNE_COLORS.plumInkSubtle,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    padding: 16,
    gap: 8,
    ...KITSUNE_SHADOWS.miruku,
  },
  featureIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  featureTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13.5,
    lineHeight: 18,
    color: KITSUNE_COLORS.plumInk,
  },
  featureDescription: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: KITSUNE_COLORS.plumInkMuted,
  },
})
