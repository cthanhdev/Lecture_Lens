import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, typography } from '../../core/theme';

export type TextVariant = keyof typeof typography;
export type TextColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'subtle'
  | 'white'
  | 'accent'
  | 'coralDeep'
  | 'inherit';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  center?: boolean;
  children?: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'primary',
  center = false,
  style,
  children,
  ...props
}: TextProps) {
  const textColorMap: Record<TextColor, string | undefined> = {
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    muted: colors.text.muted,
    subtle: colors.text.subtle,
    white: '#FFFFFF',
    accent: colors.brand.primary,
    coralDeep: colors.brand.primaryDeep,
    inherit: undefined,
  };

  const resolvedColor = textColorMap[color];

  return (
    <RNText
      style={[
        typography[variant],
        resolvedColor ? { color: resolvedColor } : undefined,
        center && styles.center,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
});
