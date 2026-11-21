import React from 'react'
import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FloatingPetals2D } from '../canvas/FloatingPetals2D'
import { KITSUNE_COLORS } from '../../theme/tokens'

export const PaywallBackdrop: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#FDE8EF', '#FFF7FD', KITSUNE_COLORS.washiCream]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.coralGlow} />
      <View style={styles.mistGlow} />
      <FloatingPetals2D />
    </View>
  )
}

const styles = StyleSheet.create({
  coralGlow: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(244, 127, 114, 0.16)',
  },
  mistGlow: {
    position: 'absolute',
    top: 240,
    left: -60,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(169, 212, 232, 0.24)',
  },
})
