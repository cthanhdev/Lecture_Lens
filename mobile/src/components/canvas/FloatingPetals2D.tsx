// FloatingPetals2D Component using @shopify/react-native-skia
// Hiệu ứng cánh hoa anh đào Sakura bay nhẹ nhàng chuẩn 60-120fps trên Native
import React, { useEffect, useMemo } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import { Canvas, Circle, Group } from '@shopify/react-native-skia'
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { KITSUNE_COLORS } from '../../theme/tokens'

const PETAL_COUNT = 14

interface PetalSeed {
  xRatio: number
  yRatio: number
  radius: number
  speed: number
  opacity: number
}

const PETAL_SEEDS: readonly PetalSeed[] = Array.from({ length: PETAL_COUNT }).map(
  (_, idx) => ({
    xRatio: ((idx * 37 + 19) % 100) / 100,
    yRatio: ((idx * 53 + 11) % 100) / 100,
    radius: 3 + (idx % 3) * 1.2,
    speed: 0.65 + (idx % 4) * 0.25,
    opacity: idx % 2 === 0 ? 0.45 : 0.3,
  })
)

function SkiaPetal({
  seed,
  viewportWidth,
  viewportHeight,
  progress,
}: {
  seed: PetalSeed
  viewportWidth: number
  viewportHeight: number
  progress: SharedValue<number>
}) {
  const baseX = seed.xRatio * viewportWidth
  const baseY = seed.yRatio * viewportHeight

  const cy = useDerivedValue(() => {
    const travel = progress.value * viewportHeight * seed.speed
    return (baseY + travel) % Math.max(viewportHeight, 1)
  })

  const cx = useDerivedValue(() => {
    return baseX + Math.sin(progress.value * Math.PI * 2 + seed.yRatio * 6) * 10
  })

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={seed.radius}
      color={KITSUNE_COLORS.sakuraPink}
      opacity={seed.opacity}
    />
  )
}

export const FloatingPetals2D: React.FC = () => {
  const { width, height } = useWindowDimensions()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.set(
      withRepeat(
        withTiming(1, { duration: 10000, easing: Easing.linear }),
        -1,
        false
      )
    )
  }, [progress])

  const seeds = useMemo(() => PETAL_SEEDS, [])

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group>
        {seeds.map((seed, idx) => (
          <SkiaPetal
            key={idx}
            seed={seed}
            viewportWidth={width}
            viewportHeight={height}
            progress={progress}
          />
        ))}
      </Group>
    </Canvas>
  )
}
