import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../../../core/theme/ThemeContext';
import { AppColors } from '../../../core/theme/colors';
import { AppTypography } from '../../../core/theme/typography';
import { LlIcon } from '../icons/LlIcon';
import { LlPressable } from '../interactive/LlPressable';

interface StatusChipProps {
  status: 'ready' | 'processing' | 'error';
  style?: StyleProp<ViewStyle>;
}

export const StatusChip = ({ status, style }: StatusChipProps) => {
  const isReady = status === 'ready';
  const isProcessing = status === 'processing';

  const bgColor = isReady
    ? AppColors.mintGreen
    : isProcessing
    ? AppColors.warningContainer
    : AppColors.softCoral;

  const textColor = isReady
    ? AppColors.mintGreenDark
    : isProcessing
    ? AppColors.warningDark
    : AppColors.coralDark;

  const label = isReady ? 'Đã sẵn sàng' : isProcessing ? 'Đang phân tích' : 'Lỗi xử lý';

  return (
    <View style={[styles.chip, { backgroundColor: bgColor }, style]}>
      {isReady ? (
        <LlIcon name="check_circle" size={12} color={textColor} filled />
      ) : (
        <LlIcon name="sync" size={12} color={textColor} />
      )}
      <Text style={[AppTypography.labelSmall, styles.text, { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
};

interface SubjectChipProps {
  label: string;
  isSelected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SubjectChip = ({ label, isSelected = false, onPress, style }: SubjectChipProps) => {
  const { colors, borderRadius } = useAppTheme();

  return (
    <LlPressable
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? colors.primary : colors.surfaceContainerLow,
          borderRadius: borderRadius.pill,
          borderWidth: 1,
          borderColor: isSelected ? colors.primary : colors.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          AppTypography.labelSmall,
          styles.text,
          { color: isSelected ? colors.onPrimary : colors.text },
        ]}
      >
        {label}
      </Text>
    </LlPressable>
  );
};

interface TimestampChipProps {
  timestamp: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const TimestampChip = ({ timestamp, onPress, style }: TimestampChipProps) => {
  return (
    <LlPressable
      disabled={!onPress}
      onPress={onPress}
      style={[styles.timestampChip, style]}
    >
      <LlIcon name="play_arrow" size={10} color={AppColors.mintGreenDark} filled />
      <Text style={[AppTypography.labelSmall, styles.timestampText]}>{timestamp}</Text>
    </LlPressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  text: {
    marginLeft: 5,
  },
  timestampChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.mintGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timestampText: {
    color: AppColors.mintGreenDark,
    marginLeft: 4,
  },
});
