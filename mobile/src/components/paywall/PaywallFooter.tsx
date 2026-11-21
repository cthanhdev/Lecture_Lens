import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '../ui/button'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

export interface PaywallFooterProps {
  readonly ctaLabel: string
  readonly ctaDisabled: boolean
  readonly isSubmitting: boolean
  readonly footnote: string
  readonly statusMessage: string | null
  readonly onStartTrial: () => void
  readonly onRestorePurchases: () => void
  readonly onOpenTerms: () => void
  readonly onOpenPrivacy: () => void
}

export const PaywallFooter: React.FC<PaywallFooterProps> = ({
  ctaLabel,
  ctaDisabled,
  isSubmitting,
  footnote,
  statusMessage,
  onStartTrial,
  onRestorePurchases,
  onOpenTerms,
  onOpenPrivacy,
}) => {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.sheet,
        { paddingBottom: Math.max(insets.bottom, 16) },
      ]}
    >
      <View style={styles.innerStage}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          disabled={ctaDisabled}
          onPress={onStartTrial}
          rightIcon={<Icon name="arrow-right" size="md" strokeColor="#FFFFFF" />}
          style={styles.ctaButton}
        >
          {ctaLabel}
        </Button>

        {statusMessage ? (
          <Text style={styles.statusMessage}>{statusMessage}</Text>
        ) : null}

        <Text style={styles.footnote}>{footnote}</Text>

        <View style={styles.linksRow}>
          <MochiPressable onPress={onRestorePurchases} hitSlop={8}>
            <Text style={styles.linkText}>Restore purchases</Text>
          </MochiPressable>
          <Text style={styles.dot}>•</Text>
          <MochiPressable onPress={onOpenTerms} hitSlop={8}>
            <Text style={styles.linkText}>Terms</Text>
          </MochiPressable>
          <Text style={styles.dot}>•</Text>
          <MochiPressable onPress={onOpenPrivacy} hitSlop={8}>
            <Text style={styles.linkText}>Privacy</Text>
          </MochiPressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: KITSUNE_RADII.sheetTop,
    borderTopRightRadius: KITSUNE_RADII.sheetTop,
    paddingHorizontal: 20,
    paddingTop: 18,
    alignItems: 'center',
    ...KITSUNE_SHADOWS.plumModal,
  },
  innerStage: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    gap: 10,
  },
  ctaButton: {
    shadowColor: KITSUNE_COLORS.kitsuneCoral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.36,
    shadowRadius: 16,
  },
  statusMessage: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: KITSUNE_COLORS.kitsuneCoralDark,
    textAlign: 'center',
  },
  footnote: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: KITSUNE_COLORS.plumInkMuted,
    textAlign: 'center',
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 2,
  },
  linkText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  dot: {
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkSubtle,
  },
})
