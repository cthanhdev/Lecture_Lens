import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../core/theme';
import { Text } from './Text';

export interface SegmentOption<T extends string = string> {
  key: T;
  label: string;
  badge?: number | string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  selectedKey: T;
  onSelect: (key: T) => void;
  style?: ViewStyle;
}

export function SegmentedControl<T extends string = string>({
  options,
  selectedKey,
  onSelect,
  style,
}: SegmentedControlProps<T>) {
  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isSelected = option.key === selectedKey;
        return (
          <TouchableOpacity
            key={option.key}
            activeOpacity={0.8}
            onPress={() => onSelect(option.key)}
            style={[styles.segment, isSelected && styles.selectedSegment]}
          >
            <Text
              variant="label"
              style={[
                styles.label,
                isSelected ? styles.selectedLabel : styles.unselectedLabel,
              ]}
            >
              {option.label}
            </Text>
            {option.badge !== undefined && (
              <View
                style={[
                  styles.badge,
                  isSelected ? styles.selectedBadge : styles.unselectedBadge,
                ]}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.badgeText,
                    isSelected ? styles.selectedBadgeText : styles.unselectedBadgeText,
                  ]}
                >
                  {option.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.bg.container,
    borderRadius: radius.pill,
    padding: spacing.xxs + 1,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  selectedSegment: {
    backgroundColor: colors.text.primary,
  },
  label: {
    fontWeight: '700',
  },
  selectedLabel: {
    color: '#FFFFFF',
  },
  unselectedLabel: {
    color: colors.text.secondary,
  },
  badge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  selectedBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  unselectedBadge: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  badgeText: {
    fontWeight: '700',
  },
  selectedBadgeText: {
    color: '#FFFFFF',
  },
  unselectedBadgeText: {
    color: colors.text.secondary,
  },
});
