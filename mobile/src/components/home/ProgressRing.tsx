import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { KITSUNE_COLORS } from '../../theme/tokens'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export interface ProgressRingProps {
  readonly progress: number
  readonly size?: number
  readonly strokeWidth?: number
  readonly trackColor?: string
  readonly fillColor?: string
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 26,
  strokeWidth = 3,
  trackColor = 'rgba(190, 225, 208, 0.35)',
  fillColor = KITSUNE_COLORS.matchaMint,
}) => {
  const clamped = Math.min(1, Math.max(0, progress))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const animatedProgress = useSharedValue(0)

  useEffect(() => {
    animatedProgress.value = withTiming(clamped, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    })
  }, [animatedProgress, clamped])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }))

  return (
    <View style={{ width: size, height: size, transform: [{ rotate: '-90deg' }] }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          fill="none"
        />
      </Svg>
    </View>
  )
}
