import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../core/theme/ThemeContext';
import { AppColors } from '../../../core/theme/colors';
import { AppTypography } from '../../../core/theme/typography';
import { AppShadows } from '../../../core/theme/layout';
import { LlIcon } from '../icons/LlIcon';
import { LlPressable } from '../interactive/LlPressable';
import { NotificationBadge } from './NotificationBadge';

export const LlBottomNavBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useAppTheme();

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom, 12),
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.pillContainer, AppShadows.floatingPill]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 50 : 90}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.blurView,
            {
              backgroundColor: isDark
                ? 'rgba(30, 27, 46, 0.90)'
                : 'rgba(255, 255, 255, 0.92)',
              borderColor: colors.border,
            },
          ]}
        >
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const iconColor = isFocused ? '#FFFFFF' : colors.textSecondary;

            const renderIcon = () => {
              switch (route.name) {
                case 'Library':
                  return <LlIcon name="local_library" size={20} color={iconColor} filled={isFocused} />;
                case 'Search':
                  return <LlIcon name="search" size={20} color={iconColor} filled={isFocused} />;
                case 'Settings':
                  return <LlIcon name="settings" size={20} color={iconColor} filled={isFocused} />;
                default:
                  return <LlIcon name="auto_awesome" size={20} color={iconColor} filled={isFocused} />;
              }
            };

            const getLabel = () => {
              switch (route.name) {
                case 'Library':
                  return 'Thư viện';
                case 'Search':
                  return 'Tìm kiếm';
                case 'Settings':
                  return 'Cài đặt';
                default:
                  return route.name;
              }
            };

            return (
              <LlPressable
                key={route.key}
                onPress={onPress}
                style={[
                  styles.tabItem,
                  isFocused && [
                    styles.activeTabItem,
                    { backgroundColor: AppColors.primaryContainer },
                  ],
                ]}
                scaleFactor={0.96}
              >
                <View style={styles.iconWrapper}>
                  {renderIcon()}
                  {route.name === 'Library' && !isFocused && <NotificationBadge />}
                </View>
                <Text
                  style={[
                    AppTypography.labelMd,
                    styles.tabLabel,
                    {
                      color: isFocused ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isFocused ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {getLabel()}
                </Text>
              </LlPressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 99,
  },
  pillContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  blurView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderRadius: 9999,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  activeTabItem: {
    shadowColor: '#5445B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrapper: {
    position: 'relative',
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
  },
});
