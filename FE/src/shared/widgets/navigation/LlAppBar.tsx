import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../core/theme/ThemeContext';
import { AppTypography } from '../../../core/theme/typography';
import { LlIcon } from '../icons/LlIcon';
import { LlPressable } from '../interactive/LlPressable';
import { NotificationBadge } from './NotificationBadge';

interface LlAppBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationPress?: () => void;
  actions?: ReactNode;
}

export const LlAppBar = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  showNotifications = false,
  notificationCount,
  onNotificationPress,
  actions,
}: LlAppBarProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 12 : 0) + 8,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.content}>
        {showBack && (
          <LlPressable onPress={onBackPress} style={styles.backButton}>
            <LlIcon name="arrow_back" size={24} color={colors.text} />
          </LlPressable>
        )}

        <View style={styles.titleContainer}>
          <Text style={[AppTypography.headlineMedium, styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[AppTypography.bodySmall, styles.subtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightActions}>
          {actions}

          {showNotifications && (
            <LlPressable onPress={onNotificationPress} style={styles.notifButton}>
              <LlIcon name="notifications" size={22} color={colors.text} />
              {(notificationCount === undefined || notificationCount > 0) && (
                <NotificationBadge />
              )}
            </LlPressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 6,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifButton: {
    position: 'relative',
    padding: 8,
    marginLeft: 6,
  },
});
