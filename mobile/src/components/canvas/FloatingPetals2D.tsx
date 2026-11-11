// FloatingPetals2D Component using @shopify/react-native-skia
// Hiệu ứng cánh hoa anh đào Sakura bay nhẹ nhàng chuẩn 60-120fps
import React, { useEffect } from 'react'
import { StyleSheet, Dimensions } from 'react-native'
import { Canvas, Circle, Group } from '@shopify/react-native-skia'
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { KITSUNE_COLORS } from '../../theme/tokens'

const { width, height } = Dimensions.get('window')
const PETAL_COUNT = 16

interface PetalState {
  x: number
  y: number
  radius: number
  speed: number
}

export const FloatingPetals2D: React.FC = () => {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.linear }),
      -1,
      false
    )
  }, [progress])

  const petals: PetalState[] = Array.from({ length: PETAL_COUNT }).map((_, idx) => ({
    x: (idx * 27 + 15) % width,
    y: (idx * 53) % height,
    radius: 3 + (idx % 3),
    speed: 0.7 + (idx % 3) * 0.35,
  }))

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group>
        {petals.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={(p.y + progress.value * height * p.speed) % height}
            r={p.radius}
            color={KITSUNE_COLORS.sakuraPink}
            opacity={0.50}
          />
        ))}
      </Group>
    </Canvas>
  )
}
