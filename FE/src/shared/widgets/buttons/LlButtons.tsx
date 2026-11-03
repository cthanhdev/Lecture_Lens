import React, { ReactNode } from 'react';
import { Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme } from '../../../core/theme/ThemeContext';
import { AppTypography } from '../../../core/theme/typography';
import { LlPressable } from '../interactive/LlPressable';

interface LlSecondaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const LlSecondaryButton = ({
  title,
  onPress,
  icon,
  trailingIcon,
  disabled = false,
  style,
  textStyle,
}: LlSecondaryButtonProps) => {
  const { colors, borderRadius } = useAppTheme();

  return (
    <LlPressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderRadius: borderRadius.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          AppTypography.labelLarge,
          styles.text,
          { color: colors.primary },
          icon ? { marginLeft: 8 } : null,
          trailingIcon ? { marginRight: 8 } : null,
          textStyle,
        ]}
      >
        {title}
      </Text>
      {trailingIcon}
    </LlPressable>
  );
};

interface LlIconCircleButtonProps {
  icon: ReactNode;
  onPress: () => void;
  size?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const LlIconCircleButton = ({
  icon,
  onPress,
  size = 44,
  backgroundColor,
  style,
}: LlIconCircleButtonProps) => {
  const { colors } = useAppTheme();

  return (
    <LlPressable
      onPress={onPress}
      style={[
        styles.circleButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor || colors.surfaceContainerLow,
        },
        style,
      ]}
    >
      {icon}
    </LlPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  text: {
    letterSpacing: 0.2,
  },
  circleButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
