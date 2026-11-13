import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'
import type { AuthScreenStep } from '../../modules/auth/authPagerMotion'
import { KITSUNE_COLORS, KITSUNE_RADII } from '../../theme/tokens'
import { Icon } from '../ui/icons'

export interface AuthTopBarProps {
  scrollProgress?: SharedValue<number>
  activeStep: AuthScreenStep
  onPressBack: () => void
  onSelectStep?: (step: AuthScreenStep) => void
  showSwipeIndicator?: boolean
}

/**
 * Seamless borderless transparent top bar flush against the Sakura gradient backdrop.
 * Features centered crossfading titles ("Sign In" <-> "Create Account"), a minimalist
 * 2-dot swipe pill indicator, and zero circular user icon on the right.
 */
export const AuthTopBar: React.FC<AuthTopBarProps> = ({
  scrollProgress,
  activeStep,
  onPressBack,
  onSelectStep,
  showSwipeIndicator = true,
}) => {
  const fallbackProgress = useSharedValue<number>(activeStep)
  const progress = scrollProgress ?? fallbackProgress

  const signInTitleStyle = useAnimatedStyle(() => {
    const p = progress.value
    return {
      opacity: interpolate(p, [0, 0.45, 1], [1, 0, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(p, [0, 1], [0, -18], Extrapolation.CLAMP) },
        { scale: interpolate(p, [0, 0.5, 1], [1, 0.94, 0.92], Extrapolation.CLAMP) },
      ],
    }
  }, [progress])

  const createAccountTitleStyle = useAnimatedStyle(() => {
    const p = progress.value
    return {
      opacity: interpolate(p, [0, 0.55, 1], [0, 0, 1], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(p, [0, 1], [18, 0], Extrapolation.CLAMP) },
        { scale: interpolate(p, [0, 0.5, 1], [0.92, 0.94, 1], Extrapolation.CLAMP) },
      ],
    }
  }, [progress])

  const dotSignInStyle = useAnimatedStyle(() => {
    const p = progress.value
    return {
      width: interpolate(p, [0, 1], [18, 6], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(
        p,
        [0, 1],
        [KITSUNE_COLORS.kitsuneCoral, 'rgba(244, 127, 114, 0.28)']
      ),
    }
  }, [progress])

  const dotCreateStyle = useAnimatedStyle(() => {
    const p = progress.value
    return {
      width: interpolate(p, [0, 1], [6, 18], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(
        p,
        [0, 1],
        ['rgba(244, 127, 114, 0.28)', KITSUNE_COLORS.kitsuneCoral]
      ),
    }
  }, [progress])

  return (
    <View style={styles.topBar}>
      <Pressable
        onPress={onPressBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({ pressed }) => [
          styles.backHitArea,
          pressed && styles.pressedBack,
        ]}
      >
        <View style={styles.backChevronFlip}>
          <Icon
            name="chevron-right"
            size={20}
            strokeColor={KITSUNE_COLORS.plumInk}
          />
        </View>
      </Pressable>

      <View style={styles.centerColumn}>
        <View style={styles.titleStage}>
          <Animated.Text
            style={[styles.topBarTitle, styles.stackedTitle, signInTitleStyle]}
            numberOfLines={1}
          >
            Sign In
          </Animated.Text>
          <Animated.Text
            style={[
              styles.topBarTitle,
              styles.stackedTitle,
              createAccountTitleStyle,
            ]}
            numberOfLines={1}
          >
            Create Account
          </Animated.Text>
        </View>

        {showSwipeIndicator ? (
          <View style={styles.dotsRow} accessibilityRole="tablist">
            <Pressable
              onPress={() => onSelectStep?.(0)}
              hitSlop={10}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeStep === 0 }}
              accessibilityLabel="Switch to Sign In"
            >
              <Animated.View style={[styles.dotBase, dotSignInStyle]} />
            </Pressable>
            <Pressable
              onPress={() => onSelectStep?.(1)}
              hitSlop={10}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeStep === 1 }}
              accessibilityLabel="Switch to Create Account"
            >
              <Animated.View style={[styles.dotBase, dotCreateStyle]} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Intentionally blank balance spacer so title stays centered with zero top-right user icon */}
      <View style={styles.headerBalanceSpacer} />
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  backHitArea: {
    width: 44,
    height: 44,
    borderRadius: KITSUNE_RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevronFlip: {
    transform: [{ rotate: '180deg' }],
  },
  pressedBack: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStage: {
    width: 190,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stackedTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  topBarTitle: {
    fontSize: 17,
    lineHeight: 22,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_700Bold',
    textAlign: 'center',
  },
  dotsRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dotBase: {
    height: 4.5,
    borderRadius: KITSUNE_RADII.pill,
  },
  headerBalanceSpacer: {
    width: 44,
    height: 44,
  },
})
