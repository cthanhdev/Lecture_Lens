import { AccessibilityInfo, Animated, Easing } from 'react-native'
import type {
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  StackCardStyleInterpolator,
  StackNavigationOptions,
} from 'expo-router/js-stack'
import { KITSUNE_COLORS, KITSUNE_MOTION } from '../theme/tokens'
import type { NavigationDirection } from './navigationHistory'
import {
  STACK_EASING_BEZIER,
  STACK_TRANSITION_DURATION_MS,
  STACK_UNDERLAY_PARALLAX_FACTOR,
  resolveReplaceAnimationType,
} from './stackTransitionSpec'

let cachedReduceMotion = false

if (typeof AccessibilityInfo?.isReduceMotionEnabled === 'function') {
  AccessibilityInfo.isReduceMotionEnabled()
    .then((enabled) => {
      cachedReduceMotion = Boolean(enabled)
    })
    .catch(() => {})

  AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
    cachedReduceMotion = Boolean(enabled)
  })
}

export interface BookStackOptionsInput {
  readonly actionDirection?: NavigationDirection
  readonly reducedMotion?: boolean
  readonly gestureEnabled?: boolean
}

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

export function createBookPageTurnInterpolator(
  options: Pick<BookStackOptionsInput, 'actionDirection' | 'reducedMotion'> = {},
): StackCardStyleInterpolator {
  const actionDirection = options.actionDirection ?? 'forward'
  const reducedMotion = options.reducedMotion ?? cachedReduceMotion
  const book = KITSUNE_MOTION.bookPageTurn

  return function bookPageTurnInterpolator({
    current,
    next,
    closing,
    layouts: { screen },
  }: StackCardInterpolationProps): StackCardInterpolatedStyle {
    if (reducedMotion) {
      return {
        cardStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
        },
        overlayStyle: {
          opacity: 0,
        },
      }
    }

    const openDelta = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [screen.width, 0],
      extrapolate: 'clamp',
    })

    const directionBase = actionDirection === 'forward' ? 1 : -1
    const directionMultiplier = closing.interpolate({
      inputRange: [0, 1],
      outputRange: [directionBase, 1],
      extrapolate: 'clamp',
    })

    const translateFocused = Animated.multiply(openDelta, directionMultiplier)

    const rotateYFocused = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [`${book.incomingRotateYDeg}deg`, '0deg'],
      extrapolate: 'clamp',
    })

    const translateUnfocused = next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -screen.width * book.underlayParallaxFactor],
          extrapolate: 'clamp',
        })
      : 0

    const rotateYUnfocused = next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${book.underlayRotateYDeg}deg`],
          extrapolate: 'clamp',
        })
      : '0deg'

    const scaleUnfocused = next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, book.underlayMinScale],
          extrapolate: 'clamp',
        })
      : 1

    const overlayOpacity = current.progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, book.spineShadowMaxOpacity, 0],
      extrapolate: 'clamp',
    })

    return {
      cardStyle: {
        transform: [
          { perspective: book.perspective },
          { translateX: translateFocused },
          { translateX: translateUnfocused },
          { rotateY: rotateYFocused },
          { rotateY: rotateYUnfocused },
          { scale: scaleUnfocused },
        ],
      },
      overlayStyle: {
        opacity: overlayOpacity,
      },
    }
  }
}

export const forBookPageTurnSlide: StackCardStyleInterpolator =
  createBookPageTurnInterpolator({
    actionDirection: 'forward',
    reducedMotion: false,
  })

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

export function buildKitsuneBookStackOptions(
  input?: BookStackOptionsInput | NavigationDirection,
): StackNavigationOptions {
  const normalized: BookStackOptionsInput =
    typeof input === 'string' ? { actionDirection: input } : (input ?? {})
  const actionDirection = normalized.actionDirection ?? 'forward'
  const reducedMotion = normalized.reducedMotion ?? cachedReduceMotion
  const gestureEnabled = normalized.gestureEnabled ?? true
  const book = KITSUNE_MOTION.bookPageTurn

  const bookTransitionSpec = {
    animation: 'timing' as const,
    config: {
      duration: reducedMotion
        ? KITSUNE_MOTION.reducedMotion.durationMs
        : book.durationMs,
      easing: Easing.bezier(
        book.easingBezier[0],
        book.easingBezier[1],
        book.easingBezier[2],
        book.easingBezier[3],
      ),
    },
  }

  return {
    headerShown: false,
    animation: 'default',
    detachPreviousScreen: false,
    gestureEnabled,
    gestureDirection: 'horizontal',
    cardOverlayEnabled: !reducedMotion,
    animationTypeForReplace: resolveReplaceAnimationType(actionDirection),
    transitionSpec: {
      open: bookTransitionSpec,
      close: bookTransitionSpec,
    },
    cardStyleInterpolator: createBookPageTurnInterpolator({
      actionDirection,
      reducedMotion,
    }),
    cardStyle: {
      backgroundColor: KITSUNE_COLORS.washiCream,
    },
  }
}

export const KITSUNE_STACK_SCREEN_OPTIONS: StackNavigationOptions =
  buildKitsuneStackScreenOptions('push')
