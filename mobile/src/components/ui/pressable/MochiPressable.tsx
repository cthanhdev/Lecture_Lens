import React from 'react'
import {
  Pressable,
  type AccessibilityRole,
  type AccessibilityState,
  type Insets,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const MOCHI_EASING = Easing.bezier(0.2, 0.8, 0.2, 1)
const MOCHI_DURATION_MS = 150

export interface MochiPressableProps {
  readonly children: React.ReactNode
  readonly onPress?: () => void
  readonly disabled?: boolean
  readonly pressedScale?: number
  readonly haptic?: 'selection' | 'impact' | 'none'
  readonly style?: StyleProp<ViewStyle>
  readonly hitSlop?: number | Insets
  readonly accessibilityRole?: AccessibilityRole
  readonly accessibilityLabel?: string
  readonly accessibilityHint?: string
  readonly accessibilityState?: AccessibilityState
}

/**
 * Kitsune Soft Mochi tactile press wrapper (scale 0.97 / 150ms + Haptics).
 * Mirrors docs/design-system.md §5.2.
 */
export const MochiPressable: React.FC<MochiPressableProps> = ({
  children,
  onPress,
  disabled = false,
  pressedScale = 0.97,
  haptic = 'selection',
  style,
  hitSlop,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}) => {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    if (disabled) return
    scale.set(
      withTiming(pressedScale, {
        duration: MOCHI_DURATION_MS,
        easing: MOCHI_EASING,
      }),
    )
    if (haptic === 'impact') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    } else if (haptic === 'selection') {
      Haptics.selectionAsync().catch(() => {})
    }
  }

  const handlePressOut = () => {
    scale.set(
      withTiming(1, {
        duration: MOCHI_DURATION_MS,
        easing: MOCHI_EASING,
      }),
    )
  }

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        disabled && { opacity: 0.5 },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  )
}
