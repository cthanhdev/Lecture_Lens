// OnboardingSlideHeader: Top Safe Area status pill (no Skip button — swipe navigation enabled)
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { KITSUNE_COLORS, KITSUNE_RADII } from '../../theme/tokens'

interface OnboardingSlideHeaderProps {
  pillLabel?: string
  variant?: 'sakura' | 'lavender'
}

export const OnboardingSlideHeader: React.FC<OnboardingSlideHeaderProps> = ({
  pillLabel,
  variant = 'sakura',
}) => {
  return (
    <View style={styles.headerRow}>
      {pillLabel ? (
        <View
          style={[
            styles.pill,
            variant === 'sakura' ? styles.pillSakura : styles.pillLavender,
          ]}
        >
          <View style={styles.dot} />
          <Text style={styles.pillText}>{pillLabel}</Text>
        </View>
      ) : (
        <View style={styles.emptySpacer} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  headerRow: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  emptySpacer: {
    height: 26,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 26,
    paddingHorizontal: 12,
    borderRadius: KITSUNE_RADII.pill,
  },
  pillSakura: {
    backgroundColor: 'rgba(253, 203, 209, 0.45)',
  },
  pillLavender: {
    backgroundColor: 'rgba(240, 229, 240, 0.85)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  pillText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10.5,
    letterSpacing: 0.75,
    color: KITSUNE_COLORS.plumInkMuted,
  },
})
