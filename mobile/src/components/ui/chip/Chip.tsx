// Kitsune Soft Pill Chip Component for React Native
import React from 'react'
import {
  Text,
  StyleSheet,
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

export type ChipVariant =
  | 'default'
  | 'primary'
  | 'sakura'
  | 'mist'
  | 'mochi'
  | 'matcha'

export interface ChipProps {
  children: React.ReactNode
  active?: boolean
  variant?: ChipVariant
  icon?: React.ReactNode
  disabled?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export const Chip: React.FC<ChipProps> = ({
  children,
  active = false,
  variant = 'default',
  icon,
  disabled = false,
  onPress,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 150 })
    Haptics.selectionAsync().catch(() => {})
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 })
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        styles[variant],
        active && styles.active,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      {typeof children === 'string' ? (
        <Text
          style={[
            styles.text,
            styles[`${variant}Text`],
            active && styles.activeText,
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
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
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  default: {
    backgroundColor: KITSUNE_COLORS.mirukuCard,
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.10)',
  },
  primary: {
    backgroundColor: 'rgba(244, 127, 114, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 127, 114, 0.20)',
  },
  sakura: {
    backgroundColor: 'rgba(245, 195, 201, 0.40)',
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.sakuraPink,
  },
  mist: {
    backgroundColor: 'rgba(169, 212, 232, 0.35)',
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.mistSky,
  },
  mochi: {
    backgroundColor: 'rgba(255, 226, 122, 0.40)',
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.mochiYellow,
  },
  matcha: {
    backgroundColor: 'rgba(190, 225, 208, 0.40)',
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.matchaMint,
  },
  active: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    borderColor: 'transparent',
    ...KITSUNE_SHADOWS.miruku,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  defaultText: { color: KITSUNE_COLORS.plumInkMuted },
  primaryText: { color: KITSUNE_COLORS.kitsuneCoralDark },
  sakuraText: { color: '#795358' },
  mistText: { color: '#204C5C' },
  mochiText: { color: '#7B5400' },
  matchaText: { color: '#0A4325' },
  activeText: { color: '#FFFFFF' },
})
