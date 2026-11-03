import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { AppColors } from '../../../core/theme/colors';
import { AppTypography } from '../../../core/theme/typography';

export type WashiTapeColor = 'sakura' | 'mint' | 'yellow' | 'lavender';

interface WashiTapeAccentProps {
  color?: WashiTapeColor;
  width?: number;
  height?: number;
  rotation?: string; // e.g. '-2deg', '1.5deg'
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export const WashiTapeAccent = ({
  color = 'sakura',
  width = 64,
  height = 14,
  rotation = '-1deg',
  label,
  style,
}: WashiTapeAccentProps) => {
  const getBackgroundColor = () => {
    switch (color) {
      case 'mint':
        return AppColors.tertiaryFixed;
      case 'yellow':
        return AppColors.secondaryContainer;
      case 'lavender':
        return AppColors.primaryFixed;
      case 'sakura':
      default:
        return AppColors.secondaryFixed;
    }
  };

  const getTextColor = () => {
    switch (color) {
      case 'mint':
        return AppColors.onTertiaryFixedVariant;
      case 'yellow':
        return AppColors.onSecondaryContainer;
      case 'lavender':
        return AppColors.primary;
      case 'sakura':
      default:
        return AppColors.onSecondaryContainer;
    }
  };

  return (
    <View
      style={[
        styles.tape,
        {
          width: label ? Math.max(width, 100) : width,
          height: label ? Math.max(height, 22) : height,
          backgroundColor: getBackgroundColor(),
          transform: [{ rotate: rotation }],
        },
        style,
      ]}
    >
      {label && (
        <Text
          style={[
            AppTypography.labelSm,
            { color: getTextColor(), textAlign: 'center', opacity: 0.9 },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tape: {
    borderRadius: 4,
    opacity: 0.88,
    shadowColor: '#3B3550',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
});
