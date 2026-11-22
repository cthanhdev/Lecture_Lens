import React from 'react'
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { KITSUNE_MOTION } from '../../../theme/tokens'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export type MochiHapticFeedback = 'light' | 'medium' | 'selection' | 'none'

export interface MochiPressableProps extends Omit<PressableProps, 'style'> {
  readonly children?: React.ReactNode
  readonly style?: StyleProp<ViewStyle>
  readonly pressedScale?: number
  readonly haptic?: MochiHapticFeedback
}

const MOCHI_EASING = Easing.bezier(
  KITSUNE_MOTION.mochiPress.easingBezier[0],
  KITSUNE_MOTION.mochiPress.easingBezier[1],
  KITSUNE_MOTION.mochiPress.easingBezier[2],
  KITSUNE_MOTION.mochiPress.easingBezier[3],
)

function triggerMochiHaptic(haptic: MochiHapticFeedback): void {
  if (haptic === 'none') return
  if (haptic === 'selection') {
    Haptics.selectionAsync().catch(() => {})
    return
  }
  if (haptic === 'medium') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    return
  }
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}

export const MochiPressable: React.FC<MochiPressableProps> = ({
  children,
  style,
  pressedScale = KITSUNE_MOTION.mochiPress.scale,
  haptic = 'light',
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const reducedMotion = useReducedMotion()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = (event: GestureResponderEvent) => {
    if (!disabled) {
      if (!reducedMotion) {
        scale.set(
          withTiming(pressedScale, {
            duration: KITSUNE_MOTION.mochiPress.durationMs,
            easing: MOCHI_EASING,
          }),
        )
      }
      triggerMochiHaptic(haptic)
    }
    onPressIn?.(event)
  }

  const handlePressOut = (event: GestureResponderEvent) => {
    if (!reducedMotion) {
      scale.set(
        withTiming(1, {
          duration: KITSUNE_MOTION.mochiPress.durationMs,
          easing: MOCHI_EASING,
        }),
      )
    }
    onPressOut?.(event)
  }

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  )
}
