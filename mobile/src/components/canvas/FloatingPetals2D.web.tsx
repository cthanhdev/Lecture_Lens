// Web fallback for FloatingPetals2D using react-native-reanimated
// Tránh phụ thuộc CanvasKit WASM khi xem trước trên Expo Web
import React, { useEffect } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { KITSUNE_COLORS } from '../../theme/tokens'

const WEB_PETALS = [
  { left: 0.16, top: 0.24, size: 8, opacity: 0.5 },
  { left: 0.78, top: 0.27, size: 7, opacity: 0.45 },
  { left: 0.14, top: 0.39, size: 6, opacity: 0.4 },
  { left: 0.8, top: 0.49, size: 8, opacity: 0.5 },
  { left: 0.21, top: 0.52, size: 7, opacity: 0.42 },
  { left: 0.72, top: 0.19, size: 6, opacity: 0.38 },
] as const

function WebPetalDot({
  left,
  top,
  size,
  opacity,
  viewportHeight,
  progress,
  phase,
}: {
  left: number
  top: number
  size: number
  opacity: number
  viewportHeight: number
  progress: SharedValue<number>
  phase: number
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const yDrift = Math.sin(progress.value * Math.PI * 2 + phase) * 14
    const xDrift = Math.cos(progress.value * Math.PI * 2 + phase) * 8
    return {
      transform: [{ translateX: xDrift }, { translateY: yDrift }],
    }
  })

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${left * 100}%`,
          top: top * viewportHeight,
          width: size,
          height: size * 1.25,
          borderRadius: size,
          backgroundColor: KITSUNE_COLORS.sakuraPink,
          opacity,
        },
        animatedStyle,
      ]}
    />
  )
}

export const FloatingPetals2D: React.FC = () => {
  const { height } = useWindowDimensions()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.set(
      withRepeat(
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    )
  }, [progress])

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {WEB_PETALS.map((petal, idx) => (
        <WebPetalDot
          key={idx}
          left={petal.left}
          top={petal.top}
          size={petal.size}
          opacity={petal.opacity}
          viewportHeight={height}
          progress={progress}
          phase={idx * 1.1}
        />
      ))}
    </View>
  )
}
