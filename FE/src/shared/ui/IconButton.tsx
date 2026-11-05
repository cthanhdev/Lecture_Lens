import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, shadows } from '../../core/theme';

export type IconButtonVariant = 'glass' | 'filled' | 'ghost' | 'coral';

export interface IconButtonProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  size?: number;
  variant?: IconButtonVariant;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  size = 40,
  variant = 'glass',
  style,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        variant === 'glass' && styles.glass,
        variant === 'filled' && styles.filled,
        variant === 'coral' && styles.coral,
        variant === 'ghost' && styles.ghost,
        variant === 'glass' && shadows.soft,
        variant === 'coral' && shadows.coralGlow,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glass: {
    backgroundColor: colors.bg.glassStrong,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  filled: {
    backgroundColor: colors.bg.container,
  },
  coral: {
    backgroundColor: colors.brand.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.45,
  },
});
