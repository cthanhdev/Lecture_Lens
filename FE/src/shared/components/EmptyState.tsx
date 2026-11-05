import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, radius } from '../../core/theme';
import { Text, Button } from '../../shared/ui';

export interface EmptyStateProps {
  emoji?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  secondaryActionTitle?: string;
  onSecondaryAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  emoji = '🦊',
  icon,
  title,
  description,
  actionTitle,
  actionIcon,
  onAction,
  secondaryActionTitle,
  onSecondaryAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mascotCircle}>
        {icon ? (
          icon
        ) : (
          <Text variant="display" style={styles.emoji}>
            {emoji}
          </Text>
        )}
      </View>

      <Text variant="h2" center style={styles.title}>
        {title}
      </Text>

      <Text variant="body" color="secondary" center style={styles.description}>
        {description}
      </Text>

      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          variant="primary"
          size="md"
          icon={actionIcon}
          onPress={onAction}
          style={styles.primaryBtn}
        />
      )}

      {secondaryActionTitle && onSecondaryAction && (
        <Button
          title={secondaryActionTitle}
          variant="ghost"
          size="sm"
          onPress={onSecondaryAction}
          style={styles.secondaryBtn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  mascotCircle: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    borderWidth: 2,
    borderColor: colors.border.subtle,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    marginBottom: spacing.xs,
  },
  description: {
    maxWidth: 280,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  primaryBtn: {
    minWidth: 200,
  },
  secondaryBtn: {
    marginTop: spacing.sm,
  },
});
