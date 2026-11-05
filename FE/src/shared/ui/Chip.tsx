import React from 'react';
import { TouchableOpacity, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, SubjectKey } from '../../core/theme';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  count?: number | string;
  subjectKey?: SubjectKey;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({
  label,
  count,
  subjectKey,
  selected = false,
  onPress,
  style,
}: ChipProps) {
  const subjectStyle = subjectKey ? colors.subjects[subjectKey] : null;

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.base,
        subjectStyle && {
          backgroundColor: subjectStyle.bg,
          borderColor: subjectStyle.border,
        },
        !subjectStyle && (selected ? styles.selected : styles.unselected),
        style,
      ]}
    >
      <Text
        variant="label"
        style={[
          styles.text,
          subjectStyle && { color: subjectStyle.text },
          !subjectStyle && (selected ? styles.selectedText : styles.unselectedText),
        ]}
      >
        {label}
      </Text>
      {count !== undefined && (
        <View
          style={[
            styles.countBadge,
            selected && styles.selectedCountBadge,
          ]}
        >
          <Text
            variant="caption"
            style={[
              styles.countText,
              selected ? styles.selectedCountText : styles.unselectedCountText,
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </Component>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  text: {
    fontWeight: '600',
  },
  unselected: {
    backgroundColor: colors.bg.container,
    borderColor: colors.border.subtle,
  },
  selected: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  unselectedText: {
    color: colors.text.secondary,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  countBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  selectedCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    fontWeight: '700',
  },
  unselectedCountText: {
    color: colors.text.secondary,
  },
  selectedCountText: {
    color: '#FFFFFF',
  },
});
