// AmbientPastelBackdrop: Soft Washi Cream canvas with continuous scroll-linked morphing orbs
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { FloatingPetals2D } from '../canvas/FloatingPetals2D'
import {
  BACKDROP_BASE_ORB_SIZE,
  BACKDROP_REFERENCE_WIDTH,
  buildOnboardingOrbTracks,
  type OnboardingOrbInterpolationSpec,
} from '../../modules/onboarding/backdropMotion'
import { KITSUNE_COLORS } from '../../theme/tokens'

export type BackdropPreset = 'splash' | 'step1' | 'step2' | 'step3'

interface StaticOrbSpec {
  size: number
  color: string
  top?: number
  bottom?: number
  left?: number
  right?: number
}

// Static lookup preserved for Splash (Screen 01) and non-scroll-linked usage.
const STATIC_ORBS_BY_PRESET: Record<BackdropPreset, readonly StaticOrbSpec[]> = {
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

function MorphingBackdropOrb({
  spec,
  scrollProgress,
}: {
  spec: OnboardingOrbInterpolationSpec
  scrollProgress: SharedValue<number>
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = scrollProgress.value
    return {
      opacity: interpolate(
        progress,
        spec.inputRange,
        spec.opacity,
        Extrapolation.CLAMP
      ),
      backgroundColor: interpolateColor(
        progress,
        spec.inputRange,
        spec.colors,
        'RGB'
      ),
      transform: [
        {
          translateX: interpolate(
            progress,
            spec.inputRange,
            spec.translateX,
            Extrapolation.CLAMP
          ),
        },
        {
          translateY: interpolate(
            progress,
            spec.inputRange,
            spec.translateY,
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(
            progress,
            spec.inputRange,
            spec.scale,
            Extrapolation.CLAMP
          ),
        },
      ],
    }
  }, [scrollProgress, spec])

  return <Animated.View style={[styles.morphOrbBase, animatedStyle]} />
}

interface AmbientPastelBackdropProps {
  preset?: BackdropPreset
  showPetals?: boolean
  scrollProgress?: SharedValue<number>
  frameWidth?: number
  stageOffsetX?: number
}

export const AmbientPastelBackdrop: React.FC<AmbientPastelBackdropProps> = ({
  preset = 'splash',
  showPetals = false,
  scrollProgress,
  frameWidth = BACKDROP_REFERENCE_WIDTH,
  stageOffsetX = 0,
}) => {
  const morphOrbTracks = useMemo(
    () => buildOnboardingOrbTracks(frameWidth, stageOffsetX),
    [frameWidth, stageOffsetX]
  )
  const staticOrbs = STATIC_ORBS_BY_PRESET[preset]

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {!scrollProgress && preset === 'splash' ? (
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

      {scrollProgress
        ? morphOrbTracks.map((spec) => (
            <MorphingBackdropOrb
              key={spec.id}
              spec={spec}
              scrollProgress={scrollProgress}
            />
          ))
        : staticOrbs.map((orb, index) => (
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
  morphOrbBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BACKDROP_BASE_ORB_SIZE,
    height: BACKDROP_BASE_ORB_SIZE,
    borderRadius: BACKDROP_BASE_ORB_SIZE / 2,
  },
})
