// Web fallback for FloatingPetals2D using react-native-reanimated + react-native-svg
// Renders crisp falling teardrop Sakura petals matching Kitsune Soft SVGs with optional swipe parallax.
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import {
  SAKURA_PETALS,
  SAKURA_PETAL_SVG_PATH,
  type SakuraPetalParticle,
} from '../../modules/canvas/sakuraPetals'

export interface FloatingPetals2DProps {
  scrollProgress?: SharedValue<number>
}

interface WebFallingPetalProps {
  petal: SakuraPetalParticle
  petalIndex: number
  containerHeight: number
  scrollProgress?: SharedValue<number>
}

const WebFallingPetal: React.FC<WebFallingPetalProps> = ({
  petal,
  petalIndex,
  containerHeight,
  scrollProgress,
}) => {
  const cycle = useSharedValue(0)

  useEffect(() => {
    const durationMs = Math.round(13500 / petal.speedMultiplier)
    cycle.set(
      withRepeat(
        withTiming(1, { duration: durationMs, easing: Easing.linear }),
        -1,
        false
      )
    )
  }, [cycle, petal.speedMultiplier])

  const animatedStyle = useAnimatedStyle(() => {
    const wrapped = (cycle.value + petal.initialProgress) % 1
    const y = wrapped * (containerHeight + 56) - 28
    const sway =
      Math.sin(wrapped * Math.PI * 2 + petalIndex * 1.15) *
      petal.swayAmplitudePx
    const parallax = scrollProgress
      ? (scrollProgress.value - 0.5) * petal.parallaxFactor
      : 0
    const deg =
      petal.rotationBaseDeg +
      Math.sin(wrapped * Math.PI * 2 + petalIndex * 0.9) *
        petal.rotationAmplitudeDeg

    const edgeFade =
      wrapped < 0.08
        ? wrapped / 0.08
        : wrapped > 0.88
          ? Math.max(0, (1 - wrapped) / 0.12)
          : 1

    return {
      opacity: petal.opacity * edgeFade,
      transform: [
        { translateX: sway + parallax },
        { translateY: y },
        { rotate: `${deg}deg` },
      ],
    }
  }, [containerHeight, petal, petalIndex, scrollProgress])

  return (
    <Animated.View
      style={[
        styles.petalWrapper,
        {
          left: `${petal.xRatio * 100}%`,
          width: petal.width,
          height: petal.height,
        },
        animatedStyle,
      ]}
    >
      <Svg
        width={petal.width}
        height={petal.height}
        viewBox="0 0 14 18"
        fill="none"
      >
        <Path d={SAKURA_PETAL_SVG_PATH} fill={petal.color} />
      </Svg>
    </Animated.View>
  )
}

export const FloatingPetals2D: React.FC<FloatingPetals2DProps> = ({
  scrollProgress,
}) => {
  const windowDims = useWindowDimensions()
  const [containerHeight, setContainerHeight] = useState(windowDims.height)

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout
        if (height > 0 && height !== containerHeight) {
          setContainerHeight(height)
        }
      }}
    >
      {containerHeight > 0
        ? SAKURA_PETALS.map((petal, index) => (
            <WebFallingPetal
              key={petal.id}
              petal={petal}
              petalIndex={index}
              containerHeight={containerHeight}
              scrollProgress={scrollProgress}
            />
          ))
        : null}
    </View>
  )
}

const styles = StyleSheet.create({
  petalWrapper: {
    position: 'absolute',
    top: 0,
  },
})
