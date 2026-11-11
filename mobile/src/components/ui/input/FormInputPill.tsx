// Kitsune Soft FormInputPill Component for React Native
import React, { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native'
import {
  KITSUNE_COLORS,
  KITSUNE_RADII,
  KITSUNE_SHADOWS,
} from '../../../theme/tokens'

export interface FormInputPillProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerStyle?: StyleProp<ViewStyle>
}

export const FormInputPill: React.FC<FormInputPillProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = (e: any) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e: any) => {
    setIsFocused(false)
    onBlur?.(e)
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={KITSUNE_COLORS.plumInkSubtle}
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(38, 19, 51, 0.12)',
    borderRadius: KITSUNE_RADII.pill,
    height: 48,
    paddingHorizontal: 16,
    gap: 10,
    ...KITSUNE_SHADOWS.miruku,
  },
  inputFocused: {
    borderColor: KITSUNE_COLORS.kitsuneCoral,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: KITSUNE_COLORS.kitsuneCoralDark,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  errorText: {
    fontSize: 11,
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginLeft: 12,
  },
})
