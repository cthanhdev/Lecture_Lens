import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable'
import type { PaywallPlanCardViewModel } from '../../modules/subscription'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

export interface PlanOptionCardProps {
  readonly plan: PaywallPlanCardViewModel
  readonly onSelect: () => void
}

export const PlanOptionCard: React.FC<PlanOptionCardProps> = ({
  plan,
  onSelect,
}) => {
  return (
    <MochiPressable
      accessibilityRole="radio"
      accessibilityLabel={`${plan.label} plan ${plan.priceText}${plan.billingUnit}`}
      accessibilityState={{ selected: plan.selected }}
      onPress={onSelect}
      style={[styles.card, plan.selected && styles.selectedCard]}
    >
      {plan.badgeText ? (
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueText}>{plan.badgeText}</Text>
        </View>
      ) : null}

      <View style={styles.topRow}>
        <Text style={styles.planLabel}>{plan.label}</Text>
        <View style={[styles.radioOuter, plan.selected && styles.radioSelected]}>
          {plan.selected ? (
            <Icon name="check" size={11} strokeColor="#FFFFFF" strokeWidth={2.5} />
          ) : null}
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.priceText}>{plan.priceText}</Text>
        <Text style={styles.unitText}>{plan.billingUnit}</Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.secondaryText}>{plan.secondaryText}</Text>
    </MochiPressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 122,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.08)',
    position: 'relative',
    ...KITSUNE_SHADOWS.miruku,
  },
  selectedCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: KITSUNE_COLORS.kitsuneCoral,
    shadowColor: KITSUNE_COLORS.kitsuneCoral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -11,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: KITSUNE_COLORS.mochiYellow,
    ...KITSUNE_SHADOWS.miruku,
  },
  bestValueText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: KITSUNE_COLORS.plumInk,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.7,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(38, 19, 51, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    borderColor: KITSUNE_COLORS.kitsuneCoral,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 4,
  },
  priceText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
    lineHeight: 26,
    color: KITSUNE_COLORS.plumInk,
  },
  unitText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12.5,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(38, 19, 51, 0.06)',
    marginVertical: 6,
  },
  secondaryText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInkMuted,
  },
})
