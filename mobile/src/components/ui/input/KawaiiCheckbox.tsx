// Kitsune Soft KawaiiCheckbox Component for React Native
import React from 'react'
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Icon } from '../icons/Icon'
import {
  KITSUNE_COLORS,
  KITSUNE_SHADOWS,
} from '../../../theme/tokens'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface KawaiiCheckboxProps {
  checked: boolean
  onChange: (next: boolean) => void
  label?: React.ReactNode
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export const KawaiiCheckbox: React.FC<KawaiiCheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  style,
}) => {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.set(withTiming(0.92, { duration: 120 }))
  }

  const handlePressOut = () => {
    scale.set(withTiming(1, { duration: 120 }))
  }

  const handlePress = () => {
    if (disabled) return
    Haptics.selectionAsync().catch(() => {})
    onChange(!checked)
  }

  return (
    <AnimatedPressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle, style]}
    >
      <Animated.View
        style={[
          styles.box,
          checked ? styles.boxChecked : styles.boxUnchecked,
          disabled && styles.disabled,
        ]}
      >
        {checked && (
          <Icon name="check" size="xs" strokeColor="#FFFFFF" strokeWidth={2.5} />
        )}
      </Animated.View>
      {label != null &&
        (typeof label === 'string' || typeof label === 'number' ? (
          <Text style={[styles.label, disabled && styles.disabledText]}>
            {label}
          </Text>
        ) : (
          <View style={styles.customLabelWrapper}>{label}</View>
        ))}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  boxChecked: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    borderColor: KITSUNE_COLORS.kitsuneCoral,
    ...KITSUNE_SHADOWS.miruku,
  },
  boxUnchecked: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(38, 19, 51, 0.20)',
  },
  label: {
    fontSize: 13,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: KITSUNE_COLORS.plumInkSubtle,
  },
  customLabelWrapper: {
    flexShrink: 1,
    justifyContent: 'center',
  },
})
