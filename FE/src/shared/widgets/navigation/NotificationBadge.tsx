import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { AppColors } from '../../../core/theme/colors';
import { AppTypography } from '../../../core/theme/typography';

export const NotificationBadge = () => {
  const unreadCount = useNotificationStore((state) => state.unreadCount());

  if (unreadCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={[AppTypography.labelSmall, styles.badgeText]}>
        {unreadCount > 9 ? '9+' : unreadCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AppColors.coralDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
