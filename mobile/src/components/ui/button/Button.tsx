// Kitsune Soft Pill Button System for React Native
// Theo đặc tả Section 6.1 trong docs/design-system.md và AGENTS.md
import React from 'react'
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import {
  KITSUNE_COLORS,
  KITSUNE_RADII,
  KITSUNE_SHADOWS,
} from '../../../theme/tokens'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'danger'
  | 'fab'

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps {
  children?: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  isLoading?: boolean
  disabled?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  accessibilityLabel?: string
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  disabled = false,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 150 })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 })
  }

  const isLightTextVariant =
    variant === 'primary' || variant === 'danger' || variant === 'fab'

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      disabled={disabled || isLoading}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={isLightTextVariant ? '#FFFFFF' : KITSUNE_COLORS.plumInk}
        />
      ) : (
        <>
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          {typeof children === 'string' ? (
            <Text
              style={[
                styles.text,
                styles[`${variant}Text`],
                styles[`${size}Text`],
                textStyle,
              ]}
            >
              {children}
            </Text>
          ) : (
            children
          )}
          {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
        </>
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: KITSUNE_RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    ...KITSUNE_SHADOWS.miruku,
  },
  secondary: {
    backgroundColor: KITSUNE_COLORS.mirukuCard,
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.12)',
  },
  tertiary: {
    backgroundColor: KITSUNE_COLORS.sakuraPink,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoralDark,
  },
  fab: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    ...KITSUNE_SHADOWS.plumModal,
  },
  sm: { height: 36, paddingHorizontal: 16 },
  md: { height: 44, paddingHorizontal: 20 },
  lg: { height: 52, paddingHorizontal: 28 },
  icon: { width: 44, height: 44, paddingHorizontal: 0, alignSelf: 'auto' },
  disabled: { opacity: 0.5 },
  text: {
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  primaryText: { color: '#FFFFFF' },
  secondaryText: { color: KITSUNE_COLORS.plumInk },
  tertiaryText: { color: KITSUNE_COLORS.plumInk },
  ghostText: { color: KITSUNE_COLORS.plumInkMuted },
  dangerText: { color: '#FFFFFF' },
  fabText: { color: '#FFFFFF' },
  smText: { fontSize: 12 },
  mdText: { fontSize: 14 },
  lgText: { fontSize: 16 },
  iconText: { fontSize: 0 },
})
