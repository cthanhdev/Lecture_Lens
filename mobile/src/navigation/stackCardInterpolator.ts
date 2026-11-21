import { Animated, Easing } from 'react-native'
import type {
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  StackNavigationOptions,
} from 'expo-router/js-stack'
import { KITSUNE_COLORS } from '../theme/tokens'
import {
  STACK_EASING_BEZIER,
  STACK_TRANSITION_DURATION_MS,
  STACK_UNDERLAY_PARALLAX_FACTOR,
} from './stackTransitionSpec'

/**
 * Custom JSStack card interpolator:
 * - Forward (closing = 0): new screen glides in from right (+screen.width -> 0) while underlay shifts gently left.
 * - Backward / Dismiss (closing = 1): outgoing screen glides completely LEFT (0 -> -screen.width).
 * - Never mutates `scale`, eliminating center-point shrink/collapse artifacts across Web, Android, and iOS.
 */
export function forLeftExitHorizontalSlide({
  current,
  next,
  closing,
  layouts: { screen },
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const openDelta = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [screen.width, 0],
    extrapolate: 'clamp',
  })

  const directionMultiplier = closing.interpolate({
    inputRange: [0, 1],
    outputRange: [1, -1],
    extrapolate: 'clamp',
  })

  const translateFocused = Animated.multiply(openDelta, directionMultiplier)

  const translateUnfocused = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -screen.width * STACK_UNDERLAY_PARALLAX_FACTOR],
        extrapolate: 'clamp',
      })
    : 0

  const overlayOpacity = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.08],
    extrapolate: 'clamp',
  })

  return {
    cardStyle: {
      transform: [
        { translateX: translateFocused },
        { translateX: translateUnfocused },
      ],
    },
    overlayStyle: {
      opacity: overlayOpacity,
    },
  }
}

const transitionConfig = {
  animation: 'timing' as const,
  config: {
    duration: STACK_TRANSITION_DURATION_MS,
    easing: Easing.bezier(
      STACK_EASING_BEZIER[0],
      STACK_EASING_BEZIER[1],
      STACK_EASING_BEZIER[2],
      STACK_EASING_BEZIER[3],
    ),
  },
}

export function buildKitsuneStackScreenOptions(
  animationTypeForReplace: 'push' | 'pop' = 'push',
): StackNavigationOptions {
  return {
    headerShown: false,
    animation: 'default',
    detachPreviousScreen: false,
    gestureEnabled: false,
    gestureDirection: 'horizontal',
    cardOverlayEnabled: true,
    animationTypeForReplace,
    transitionSpec: {
      open: transitionConfig,
      close: transitionConfig,
    },
    cardStyleInterpolator: forLeftExitHorizontalSlide,
    cardStyle: {
      backgroundColor: KITSUNE_COLORS.washiCream,
    },
  }
}

export const KITSUNE_STACK_SCREEN_OPTIONS: StackNavigationOptions =
  buildKitsuneStackScreenOptions('push')
