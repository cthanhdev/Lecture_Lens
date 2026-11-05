import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../core/theme';

export interface DividerProps {
  style?: ViewStyle;
  vertical?: boolean;
}

export function Divider({ style, vertical = false }: DividerProps) {
  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.sm,
  },
  vertical: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.sm,
  },
});
