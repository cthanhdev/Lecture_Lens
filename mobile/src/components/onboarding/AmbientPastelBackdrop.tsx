// AmbientPastelBackdrop: Soft Washi Cream canvas with layered pastel aura halos
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FloatingPetals2D } from '../canvas/FloatingPetals2D'
import { KITSUNE_COLORS } from '../../theme/tokens'

export type BackdropPreset = 'splash' | 'step1' | 'step2' | 'step3'

interface OrbSpec {
  size: number
  color: string
  top?: number
  bottom?: number
  left?: number
  right?: number
}

// Lookup table matching exact SVG ambient circle positions/colors (Screens 01-04)
// Circular orbs require no rotation transform, preventing Fabric processTransform(null) diffs.
const AMBIENT_ORBS_BY_PRESET: Record<BackdropPreset, readonly OrbSpec[]> = {
  splash: [
    { size: 300, color: 'rgba(244, 127, 114, 0.14)', top: -60, left: -70 },
    { size: 320, color: 'rgba(169, 212, 232, 0.22)', bottom: 40, right: -80 },
  ],
  step1: [
    { size: 288, color: 'rgba(244, 127, 114, 0.20)', top: -54, left: 51 },
    { size: 224, color: 'rgba(162, 205, 225, 0.30)', top: 112, left: -56 },
    { size: 240, color: 'rgba(253, 203, 209, 0.28)', top: 176, right: -64 },
  ],
  step2: [
    { size: 208, color: 'rgba(253, 203, 209, 0.42)', top: 92, left: -58 },
    { size: 224, color: 'rgba(190, 233, 253, 0.55)', top: 224, right: -48 },
    { size: 192, color: 'rgba(255, 180, 170, 0.30)', top: 178, left: 96 },
  ],
  step3: [
    { size: 220, color: 'rgba(253, 203, 209, 0.55)', top: 24, left: -44 },
    { size: 204, color: 'rgba(255, 218, 213, 0.48)', top: 184, right: -38 },
  ],
}

interface AmbientPastelBackdropProps {
  preset: BackdropPreset
  showPetals?: boolean
}

export const AmbientPastelBackdrop: React.FC<AmbientPastelBackdropProps> = ({
  preset,
  showPetals = false,
}) => {
  const orbs = AMBIENT_ORBS_BY_PRESET[preset]

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {preset === 'splash' ? (
        <LinearGradient
          colors={[
            'rgba(245, 195, 201, 0.35)',
            KITSUNE_COLORS.washiCream,
            KITSUNE_COLORS.washiCream,
          ]}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.solidWashi]} />
      )}

      {orbs.map((orb, index) => (
        <View
          key={`${preset}-${index}`}
          style={[
            styles.orbBase,
            {
              width: orb.size,
              height: orb.size,
              borderRadius: orb.size / 2,
              backgroundColor: orb.color,
              top: orb.top,
              bottom: orb.bottom,
              left: orb.left,
              right: orb.right,
            },
          ]}
        />
      ))}

      {showPetals ? <FloatingPetals2D /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  solidWashi: {
    backgroundColor: KITSUNE_COLORS.washiCream,
  },
  orbBase: {
    position: 'absolute',
  },
})
