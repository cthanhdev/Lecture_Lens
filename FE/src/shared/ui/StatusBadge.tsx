import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../core/theme';
import { Text } from './Text';

export type StatusType =
  | 'READY'
  | 'PROCESSING'
  | 'TRANSCRIBING'
  | 'LIVE'
  | 'DUE'
  | 'FAILED'
  | 'OFFLINE';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  style?: ViewStyle;
}

export function StatusBadge({ status, label, style }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'READY':
        return {
          bg: colors.status.ready.bg,
          text: colors.status.ready.text,
          dotColor: '#4A8B71',
          defaultLabel: 'Ready',
        };
      case 'LIVE':
        return {
          bg: colors.status.live.bg,
          text: colors.status.live.text,
          dotColor: '#FFFFFF',
          defaultLabel: 'Live',
        };
      case 'TRANSCRIBING':
      case 'PROCESSING':
        return {
          bg: colors.status.transcribing.bg,
          text: colors.status.transcribing.text,
          dotColor: colors.brand.primary,
          defaultLabel: status === 'TRANSCRIBING' ? 'Transcribing' : 'Processing',
        };
      case 'DUE':
        return {
          bg: colors.status.due.bg,
          text: colors.status.due.text,
          dotColor: colors.brand.primary,
          defaultLabel: 'Due today',
        };
      case 'FAILED':
        return {
          bg: colors.status.failed.bg,
          text: colors.status.failed.text,
          dotColor: colors.status.failed.text,
          defaultLabel: 'Failed · Retry',
        };
      case 'OFFLINE':
      default:
        return {
          bg: colors.bg.containerHigh,
          text: colors.text.muted,
          dotColor: colors.text.muted,
          defaultLabel: 'Offline',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
      <Text variant="caption" style={[styles.text, { color: config.text }]}>
        {label || config.defaultLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  text: {
    fontWeight: '700',
  },
});
