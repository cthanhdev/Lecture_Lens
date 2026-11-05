import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../core/theme';
import { Text } from './Text';

export interface TimestampPillProps {
  timeStr: string; // e.g. "12:41"
  onPress?: () => void;
  variant?: 'primary' | 'subtle';
  style?: ViewStyle;
}

export function TimestampPill({
  timeStr,
  onPress,
  variant = 'primary',
  style,
}: TimestampPillProps) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.pill,
        isPrimary ? styles.primary : styles.subtle,
        style,
      ]}
    >
      <Feather
        name="play"
        size={11}
        color={isPrimary ? '#FFFFFF' : colors.brand.primary}
        style={styles.icon}
      />
      <Text
        variant="label"
        style={[styles.text, { color: isPrimary ? '#FFFFFF' : colors.brand.primaryDeep }]}
      >
        {timeStr}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.pill,
  },
  primary: {
    backgroundColor: colors.brand.primary,
  },
  subtle: {
    backgroundColor: colors.brand.primarySoft,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '700',
  },
});
