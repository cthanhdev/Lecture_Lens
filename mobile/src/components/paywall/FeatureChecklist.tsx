import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Icon } from '../ui/icons/Icon'
import type { PaywallFeatureItem } from '../../modules/subscription'
import { KITSUNE_COLORS, KITSUNE_SHADOWS } from '../../theme/tokens'

export interface FeatureChecklistProps {
  readonly items: readonly PaywallFeatureItem[]
}

export const FeatureChecklist: React.FC<FeatureChecklistProps> = ({ items }) => {
  return (
    <View style={styles.card}>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.checkBadge}>
            <Icon
              name="check"
              size="xs"
              strokeColor="#0A4325"
              strokeWidth={2.2}
            />
          </View>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    ...KITSUNE_SHADOWS.miruku,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: KITSUNE_COLORS.matchaMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13.5,
    lineHeight: 19,
    color: KITSUNE_COLORS.plumInk,
  },
})
