import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, spacing, radius } from '../../core/theme';
import { Text } from '../../shared/ui';

export interface OfflineBannerProps {
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export function OfflineBanner({
  message = 'Offline mode • Accessing cached lectures & flashcards',
  onRetry,
  onDismiss,
  style,
}: OfflineBannerProps) {
  return (
    <View style={[styles.banner, style]}>
      <View style={styles.leftRow}>
        <View style={styles.iconCircle}>
          <Feather name="cloud-off" size={14} color={palette.mochiGold} />
        </View>
        <Text variant="caption" color="secondary" style={styles.message}>
          {message}
        </Text>
      </View>

      <View style={styles.rightActions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text variant="label" color="primary" style={styles.actionText}>
              Retry
            </Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.dismissBtn}
          >
            <Feather name="x" size={14} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEA', // Soft honey warm tint
    borderWidth: 1,
    borderColor: '#F6E0A4',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(235, 169, 78, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 12,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionText: {
    fontWeight: '700',
  },
  dismissBtn: {
    paddingLeft: spacing.xs,
  },
});
