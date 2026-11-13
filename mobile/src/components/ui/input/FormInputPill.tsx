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
import { Icon } from '../icons'

export type InputBadgeTone = 'none' | 'sakura' | 'coral' | 'sky' | 'plum'
export type InputValidBadgeTone = 'coral' | 'sky'
export type InputSurfaceTone = 'glass' | 'tint'

export interface FormInputPillProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  leftIconBadgeTone?: InputBadgeTone
  isValid?: boolean
  validBadgeTone?: InputValidBadgeTone
  surfaceTone?: InputSurfaceTone
  containerStyle?: StyleProp<ViewStyle>
}

export const FormInputPill: React.FC<FormInputPillProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  leftIconBadgeTone = 'none',
  isValid = false,
  validBadgeTone = 'coral',
  surfaceTone = 'glass',
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

  const renderedRight =
    rightIcon ??
    (isValid ? (
      <View
        style={[
          styles.validBadge,
          validBadgeTone === 'sky' ? styles.validBadgeSky : styles.validBadgeCoral,
        ]}
      >
        <Icon
          name="check"
          size={12}
          strokeColor={
            validBadgeTone === 'sky' ? KITSUNE_COLORS.plumInk : '#FFFFFF'
          }
          strokeWidth={2.4}
        />
      </View>
    ) : null)

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          surfaceTone === 'tint' && styles.inputTintSurface,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {leftIcon &&
          (leftIconBadgeTone !== 'none' ? (
            <View
              style={[
                styles.leftBadge,
                leftBadgeToneStyle[leftIconBadgeTone],
              ]}
            >
              {leftIcon}
            </View>
          ) : (
            <View style={styles.icon}>{leftIcon}</View>
          ))}
        <TextInput
          placeholderTextColor={KITSUNE_COLORS.plumInkSubtle}
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {renderedRight && <View style={styles.icon}>{renderedRight}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const leftBadgeToneStyle: Record<Exclude<InputBadgeTone, 'none'>, ViewStyle> = {
  sakura: { backgroundColor: 'rgba(245, 195, 201, 0.48)' },
  coral: { backgroundColor: 'rgba(244, 127, 114, 0.16)' },
  sky: { backgroundColor: 'rgba(169, 212, 232, 0.45)' },
  plum: { backgroundColor: 'rgba(38, 19, 51, 0.06)' },
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(38, 19, 51, 0.08)',
    borderRadius: KITSUNE_RADII.pill,
    height: 52,
    paddingHorizontal: 14,
    gap: 10,
    ...KITSUNE_SHADOWS.miruku,
  },
  inputTintSurface: {
    backgroundColor: 'rgba(247, 237, 244, 0.92)',
    borderColor: 'rgba(38, 19, 51, 0.04)',
    shadowOpacity: 0.02,
  },
  inputFocused: {
    borderColor: KITSUNE_COLORS.kitsuneCoral,
    backgroundColor: '#FFFFFF',
    shadowColor: KITSUNE_COLORS.kitsuneCoral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: KITSUNE_COLORS.kitsuneCoralDark,
  },
  leftBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validBadgeCoral: {
    backgroundColor: '#9E4237',
  },
  validBadgeSky: {
    backgroundColor: KITSUNE_COLORS.mistSky,
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
