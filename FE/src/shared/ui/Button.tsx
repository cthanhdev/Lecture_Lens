import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../core/theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isGlass = variant === 'glass';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled || loading}
      style={[
        styles.base,
        styles[size],
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        isGlass && styles.glass,
        isGhost && styles.ghost,
        isPrimary && !disabled && shadows.coralGlow,
        isGlass && !disabled && shadows.soft,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? '#FFFFFF' : colors.brand.primary}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            variant={size === 'lg' ? 'title' : size === 'sm' ? 'label' : 'bodySemibold'}
            color={
              disabled
                ? 'muted'
                : isPrimary
                ? 'white'
                : isSecondary
                ? 'coralDeep'
                : 'primary'
            }
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  // Sizes
  sm: {
    height: 36,
    paddingHorizontal: spacing.base,
  },
  md: {
    height: 48,
    paddingHorizontal: spacing.xl,
  },
  lg: {
    height: 56,
    paddingHorizontal: spacing.xxl,
  },
  // Variants
  primary: {
    backgroundColor: colors.brand.primary,
  },
  secondary: {
    backgroundColor: colors.brand.primarySoft,
  },
  glass: {
    backgroundColor: colors.bg.glassStrong,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
});
