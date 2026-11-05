import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, layout } from '../../core/theme';
import { Text, IconButton } from '../ui';

export type HeaderVariant = 'tab' | 'detail' | 'modal';

export interface AppHeaderProps {
  variant?: HeaderVariant;
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
  onClosePress?: () => void;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  showBack?: boolean;
}

export function AppHeader({
  variant = 'detail',
  title,
  subtitle,
  onBackPress,
  onClosePress,
  rightAction,
  leftAction,
  showBack = true,
}: AppHeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleClose = () => {
    if (onClosePress) {
      onClosePress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  if (variant === 'tab') {
    return (
      <View style={[styles.headerContainer, styles.tabHeader]}>
        <View style={styles.tabLeft}>
          {leftAction || (
            <View>
              {subtitle && (
                <Text variant="label" color="muted" style={styles.uppercase}>
                  {subtitle}
                </Text>
              )}
              <Text variant="h2" color="primary">
                {title || 'LectureLens'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRight}>
          {rightAction || (
            <>
              <IconButton
                icon={<Feather name="bell" size={18} color={colors.text.primary} />}
                variant="glass"
                size={38}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => (navigation as any).navigate('Profile')}
                style={styles.avatarPill}
              >
                <Feather name="user" size={18} color={colors.text.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  if (variant === 'modal') {
    return (
      <View style={[styles.headerContainer, styles.detailHeader]}>
        <View style={styles.actionLeft}>
          {leftAction || (
            <IconButton
              icon={<Feather name="x" size={20} color={colors.text.primary} />}
              variant="glass"
              size={38}
              onPress={handleClose}
            />
          )}
        </View>

        <View style={styles.centerTitle}>
          <Text variant="title" color="primary" numberOfLines={1}>
            {title || ''}
          </Text>
          {subtitle && (
            <Text variant="caption" color="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.actionRight}>
          {rightAction || <View style={styles.placeholderAction} />}
        </View>
      </View>
    );
  }

  // Variant: detail
  return (
    <View style={[styles.headerContainer, styles.detailHeader]}>
      <View style={styles.actionLeft}>
        {showBack && (
          <IconButton
            icon={<Feather name="arrow-left" size={20} color={colors.text.primary} />}
            variant="glass"
            size={38}
            onPress={handleBack}
          />
        )}
      </View>

      <View style={styles.centerTitle}>
        <Text variant="title" color="primary" numberOfLines={1}>
          {title || ''}
        </Text>
        {subtitle && (
          <Text variant="caption" color="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.actionRight}>
        {rightAction || (
          <IconButton
            icon={<Feather name="more-horizontal" size={20} color={colors.text.primary} />}
            variant="glass"
            size={38}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.bg.canvas,
  },
  tabHeader: {
    height: layout.headerTabHeight,
  },
  detailHeader: {
    height: layout.headerDetailHeight,
  },
  tabLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bg.container,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLeft: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerTitle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRight: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  placeholderAction: {
    width: 38,
  },
});
