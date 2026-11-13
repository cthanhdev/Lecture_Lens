import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import type { AuthTransitionDirection } from '../../modules/resilience'

export interface AuthTransitionStageProps {
  direction: AuthTransitionDirection
  transitionKey: string
  children: React.ReactNode
}

const SMOOTH_AUTH_EASING = Easing.bezier(0.22, 1, 0.36, 1)

/**
 * Synchronized Reanimated container driving consistent, glitch-free directional transitions
 * when navigating between Screen 05 (Sign In) and Screen 06 (Create Account) across Web, iOS, and Android.
 */
export const AuthTransitionStage: React.FC<AuthTransitionStageProps> = ({
  direction,
  transitionKey,
  children,
}) => {
  const startX =
    direction === 'forward' ? 24 : direction === 'back' ? -24 : 0
  const startY = direction === 'neutral' ? 6 : 0

  const opacity = useSharedValue(direction === 'neutral' ? 0.55 : 0.25)
  const translateX = useSharedValue(startX)
  const translateY = useSharedValue(startY)
  const scale = useSharedValue(0.986)

  useEffect(() => {
    opacity.set(direction === 'neutral' ? 0.55 : 0.25)
    translateX.set(startX)
    translateY.set(startY)
    scale.set(0.986)

    const timingConfig = {
      duration: 240,
      easing: SMOOTH_AUTH_EASING,
    }

    opacity.set(withTiming(1, timingConfig))
    translateX.set(withTiming(0, timingConfig))
    translateY.set(withTiming(0, timingConfig))
    scale.set(withTiming(1, timingConfig))
  }, [direction, transitionKey, startX, startY, opacity, translateX, translateY, scale])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  return (
    <Animated.View style={[styles.stage, animatedStyle]}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
  },
})
