import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, radius, shadows, spacing } from '../../core/theme';
import { Text } from '../ui';

interface TabItemConfig {
  name: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

const TABS: TabItemConfig[] = [
  { name: 'HomeTab', label: 'Home', icon: 'home' },
  { name: 'LibraryTab', label: 'Library', icon: 'book-open' },
  { name: 'ReviewTab', label: 'Review', icon: 'layers' },
  { name: 'SearchTab', label: 'Search', icon: 'search' },
];

export function LlBottomNavBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const handleFabPress = () => {
    // Center Action Button navigates to Add Audio Bottom Sheet
    (navigation as any).navigate('AddAudioSheet');
  };

  const renderTabItem = (tab: TabItemConfig) => {
    const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
    const isFocused = state.index === routeIndex;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[routeIndex]?.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(tab.name);
      }
    };

    return (
      <TouchableOpacity
        key={tab.name}
        activeOpacity={0.75}
        onPress={onPress}
        style={[styles.tabButton, isFocused && styles.tabButtonActive]}
      >
        <Feather
          name={tab.icon}
          size={20}
          color={isFocused ? colors.brand.primaryDeep : colors.text.secondary}
        />
        <Text
          variant="caption"
          style={[
            styles.tabLabel,
            { color: isFocused ? colors.brand.primaryDeep : colors.text.secondary },
            isFocused && styles.tabLabelActive,
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: Math.max(insets.bottom, 12) },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.capsule, shadows.card]}>
        {/* Left Tabs */}
        <View style={styles.tabGroup}>
          {renderTabItem(TABS[0])}
          {renderTabItem(TABS[1])}
        </View>

        {/* Center Mic FAB */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleFabPress}
            style={[styles.fab, shadows.coralGlow]}
          >
            <Feather name="mic" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Right Tabs */}
        <View style={styles.tabGroup}>
          {renderTabItem(TABS[2])}
          {renderTabItem(TABS[3])}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 100,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.glassStrong,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.pill,
    height: 64,
    paddingHorizontal: spacing.sm,
    width: '100%',
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  tabButtonActive: {
    backgroundColor: colors.brand.primarySoft,
  },
  tabLabel: {
    marginTop: 2,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  fabContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
