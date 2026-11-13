import React from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import { Stack } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { FloatingPetals2D } from '../../components/canvas'
import { KITSUNE_COLORS } from '../../theme/tokens'

/**
 * Auth Stack Layout for Screens 05 (Sign In) and 06 (Create Account).
 * Owns the persistent Washi Cream canvas, unified Sakura top gradient wash, and Skia floating petals
 * so switching between Sign In <-> Create Account flows with zero flicker or gradient cutoffs.
 */
export default function AuthLayout() {
  const { width } = useWindowDimensions()
  const frameWidth = width <= 440 ? width : 390

  return (
    <View style={styles.root}>
      <View style={[styles.frame, { width: frameWidth }]}>
        <View style={styles.backdropLayer} pointerEvents="none">
          <LinearGradient
            colors={[
              'rgba(245, 195, 201, 0.44)',
              'rgba(244, 127, 114, 0.14)',
              'rgba(255, 247, 253, 0)',
            ]}
            locations={[0, 0.44, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.topGradientWash}
          />
          <FloatingPetals2D />
        </View>

        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
    position: 'relative',
    overflow: 'hidden',
  },
  backdropLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  topGradientWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 340,
  },
})
