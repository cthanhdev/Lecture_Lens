import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg'
import {
  AUTH_BASE_ORB_SIZE,
  AUTH_REFERENCE_WIDTH,
  buildAuthOrbTracks,
  buildAuthParallaxElements,
  type AuthOrbInterpolationSpec,
  type AuthParallaxElementSpec,
} from '../../modules/auth/authPagerMotion'
import {
  SAKURA_PETAL_SVG_PATH,
  SAKURA_SPARKLE_SVG_PATH,
} from '../../modules/canvas/sakuraPetals'
import { KITSUNE_COLORS } from '../../theme/tokens'
import { FloatingPetals2D } from '../canvas'

interface MorphingAuthOrbProps {
  spec: AuthOrbInterpolationSpec
  scrollProgress: SharedValue<number>
}

const MorphingAuthOrb: React.FC<MorphingAuthOrbProps> = ({
  spec,
  scrollProgress,
}) => {
  const gradId = `auth-orb-${spec.id}`

  const animatedStyle = useAnimatedStyle(() => {
    const p = scrollProgress.value
    const translateX = interpolate(
      p,
      [...spec.inputRange],
      [...spec.translateX],
      Extrapolation.CLAMP
    )
    const translateY = interpolate(
      p,
      [...spec.inputRange],
      [...spec.translateY],
      Extrapolation.CLAMP
    )
    const scale = interpolate(
      p,
      [...spec.inputRange],
      [...spec.scale],
      Extrapolation.CLAMP
    )
    const opacity = interpolate(
      p,
      [...spec.inputRange],
      [...spec.opacity],
      Extrapolation.CLAMP
    )

    return {
      opacity,
      transform: [{ translateX }, { translateY }, { scale }],
    }
  }, [scrollProgress, spec])

  return (
    <Animated.View style={[styles.morphOrbBase, animatedStyle]}>
      {/* Smooth multi-stop radial gradient replicates Gaussian watercolor bloom with zero hard rings */}
      <Svg
        width={AUTH_BASE_ORB_SIZE}
        height={AUTH_BASE_ORB_SIZE}
        viewBox="0 0 100 100"
      >
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop
              offset="0%"
              stopColor={spec.baseHex}
              stopOpacity={spec.peakOpacity}
            />
            <Stop
              offset="40%"
              stopColor={spec.baseHex}
              stopOpacity={spec.peakOpacity * 0.54}
            />
            <Stop
              offset="74%"
              stopColor={spec.baseHex}
              stopOpacity={spec.peakOpacity * 0.14}
            />
            <Stop offset="100%" stopColor={spec.baseHex} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill={`url(#${gradId})`} />
      </Svg>
    </Animated.View>
  )
}

interface ParallaxAccentElementProps {
  spec: AuthParallaxElementSpec
  scrollProgress: SharedValue<number>
}

const ParallaxAccentElement: React.FC<ParallaxAccentElementProps> = ({
  spec,
  scrollProgress,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const p = scrollProgress.value
    const translateX = interpolate(
      p,
      [...spec.inputRange],
      [...spec.translateX],
      Extrapolation.CLAMP
    )
    const translateY = interpolate(
      p,
      [...spec.inputRange],
      [...spec.translateY],
      Extrapolation.CLAMP
    )
    const rotate = interpolate(
      p,
      [...spec.inputRange],
      [...spec.rotateDeg],
      Extrapolation.CLAMP
    )
    const scale = interpolate(
      p,
      [...spec.inputRange],
      [...spec.scale],
      Extrapolation.CLAMP
    )
    const opacity = interpolate(
      p,
      [...spec.inputRange],
      [...spec.opacity],
      Extrapolation.CLAMP
    )

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotate}deg` },
        { scale },
      ],
    }
  }, [scrollProgress, spec])

  return (
    <Animated.View style={[styles.parallaxElementBase, animatedStyle]}>
      {spec.kind === 'petal' ? (
        <Svg
          width={spec.size}
          height={Math.round(spec.size * 1.28)}
          viewBox="0 0 14 18"
          fill="none"
        >
          <Path d={SAKURA_PETAL_SVG_PATH} fill={spec.color} />
        </Svg>
      ) : spec.kind === 'sparkle' ? (
        <Svg width={spec.size} height={spec.size} viewBox="0 0 12 12" fill="none">
          <Path d={SAKURA_SPARKLE_SVG_PATH} fill={spec.color} />
        </Svg>
      ) : (
        <View
          style={{
            width: spec.size,
            height: spec.size,
            borderRadius: spec.size / 2,
            backgroundColor: spec.color,
          }}
        />
      )}
    </Animated.View>
  )
}

export interface AuthAmbientBackdropProps {
  frameWidth?: number
  scrollProgress?: SharedValue<number>
  staticStep?: 0 | 1
}

/**
 * Full-bleed Washi & Sakura pastel backdrop synchronized behind BOTH the header bar and auth forms:
 * - Zero separate header strip or horizontal seams
 * - Feathered SVG RadialGradient Sakura/Coral morphing glow clouds
 * - Organic falling Sakura teardrop petals with subtle depth parallax
 * - Floating header/hero micro-elements blooming during Sign In <-> Create Account transitions
 */
export const AuthAmbientBackdrop: React.FC<AuthAmbientBackdropProps> = ({
  frameWidth = AUTH_REFERENCE_WIDTH,
  scrollProgress,
  staticStep = 0,
}) => {
  const fallbackProgress = useSharedValue<number>(staticStep)
  const activeProgress = scrollProgress ?? fallbackProgress

  const orbTracks = useMemo(() => buildAuthOrbTracks(frameWidth, 0), [frameWidth])
  const parallaxElements = useMemo(
    () => buildAuthParallaxElements(frameWidth),
    [frameWidth]
  )

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      <LinearGradient
        colors={[
          'rgba(253, 203, 209, 0.44)',
          'rgba(244, 127, 114, 0.12)',
          'rgba(255, 247, 253, 0)',
        ]}
        locations={[0, 0.40, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topGradientWash}
      />

      {orbTracks.map((spec) => (
        <MorphingAuthOrb
          key={spec.id}
          spec={spec}
          scrollProgress={activeProgress}
        />
      ))}

      <FloatingPetals2D scrollProgress={activeProgress} />

      {parallaxElements.map((element) => (
        <ParallaxAccentElement
          key={element.id}
          spec={element}
          scrollProgress={activeProgress}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: KITSUNE_COLORS.washiCream,
    overflow: 'hidden',
  },
  topGradientWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '44%',
  },
  morphOrbBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: AUTH_BASE_ORB_SIZE,
    height: AUTH_BASE_ORB_SIZE,
  },
  parallaxElementBase: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
})
