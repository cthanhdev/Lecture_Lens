import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, radius, shadows, spacing } from '../../core/theme';

export interface GlassCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'frosted' | 'solid' | 'subtle';
  padding?: keyof typeof spacing;
  radiusSize?: keyof typeof radius;
}

export function GlassCard({
  children,
  onPress,
  style,
  variant = 'frosted',
  padding = 'xl',
  radiusSize = 'xl',
}: GlassCardProps) {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      activeOpacity={onPress ? 0.88 : 1}
      onPress={onPress}
      style={[
        styles.base,
        {
          padding: spacing[padding],
          borderRadius: radius[radiusSize],
        },
        variant === 'frosted' && styles.frosted,
        variant === 'solid' && styles.solid,
        variant === 'subtle' && styles.subtle,
        shadows.card,
        style,
      ]}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  frosted: {
    backgroundColor: colors.bg.glassStrong,
    borderWidth: 1,
    borderColor: colors.border.glass,
  },
  solid: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  subtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(244, 127, 114, 0.12)',
  },
});
