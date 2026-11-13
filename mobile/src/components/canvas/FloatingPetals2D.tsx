// FloatingPetals2D Component using @shopify/react-native-skia
// Renders curved teardrop falling Sakura petals matching Kitsune Soft screens with optional swipe parallax.
import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia'
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import {
  SAKURA_PETALS,
  SAKURA_PETAL_SVG_PATH,
  type SakuraPetalParticle,
} from '../../modules/canvas/sakuraPetals'

export interface FloatingPetals2DProps {
  scrollProgress?: SharedValue<number>
}

const PETAL_ORIGIN = { x: 7, y: 9 }

interface SkiaPetalNodeProps {
  petal: SakuraPetalParticle
  petalIndex: number
  containerWidth: number
  containerHeight: number
  petalPath: NonNullable<ReturnType<typeof Skia.Path.MakeFromSVGString>>
  scrollProgress?: SharedValue<number>
}

const SkiaPetalNode: React.FC<SkiaPetalNodeProps> = ({
  petal,
  petalIndex,
  containerWidth,
  containerHeight,
  petalPath,
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

  const translateTransform = useDerivedValue(() => {
    const wrapped = (cycle.value + petal.initialProgress) % 1
    const y = wrapped * (containerHeight + 56) - 28
    const sway =
      Math.sin(wrapped * Math.PI * 2 + petalIndex * 1.15) *
      petal.swayAmplitudePx
    const parallax = scrollProgress
      ? (scrollProgress.value - 0.5) * petal.parallaxFactor
      : 0
    const x = petal.xRatio * containerWidth + sway + parallax - 7
    return [{ translateX: x }, { translateY: y }]
  })

  const spinTransform = useDerivedValue(() => {
    const wrapped = (cycle.value + petal.initialProgress) % 1
    const deg =
      petal.rotationBaseDeg +
      Math.sin(wrapped * Math.PI * 2 + petalIndex * 0.9) *
        petal.rotationAmplitudeDeg
    const rad = (deg * Math.PI) / 180
    const scale = petal.width / 14
    return [{ rotate: rad }, { scale }]
  })

  return (
    <Group transform={translateTransform}>
      <Group origin={PETAL_ORIGIN} transform={spinTransform}>
        <Path
          path={petalPath}
          color={petal.color}
          opacity={petal.opacity}
        />
      </Group>
    </Group>
  )
}

export const FloatingPetals2D: React.FC<FloatingPetals2DProps> = ({
  scrollProgress,
}) => {
  const windowDims = useWindowDimensions()
  const [containerSize, setContainerSize] = useState({
    width: windowDims.width,
    height: windowDims.height,
  })
  const petalPath = useMemo(
    () => Skia.Path.MakeFromSVGString(SAKURA_PETAL_SVG_PATH),
    []
  )

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout
        if (width > 0 && height > 0) {
          setContainerSize((prev) =>
            prev.width === width && prev.height === height
              ? prev
              : { width, height }
          )
        }
      }}
    >
      {petalPath && containerSize.width > 0 && containerSize.height > 0 ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {SAKURA_PETALS.map((petal, index) => (
            <SkiaPetalNode
              key={petal.id}
              petal={petal}
              petalIndex={index}
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              petalPath={petalPath}
              scrollProgress={scrollProgress}
            />
          ))}
        </Canvas>
      ) : null}
    </View>
  )
}
