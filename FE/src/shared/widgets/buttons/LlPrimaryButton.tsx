import React, { ReactNode } from 'react';
import { Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme } from '../../../core/theme/ThemeContext';
import { AppTypography } from '../../../core/theme/typography';
import { AppShadows } from '../../../core/theme/layout';
import { LlPressable } from '../interactive/LlPressable';

interface LlPrimaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const LlPrimaryButton = ({
  title,
  onPress,
  icon,
  trailingIcon,
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}: LlPrimaryButtonProps) => {
  const { colors, borderRadius } = useAppTheme();

  return (
    <LlPressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? colors.outlineVariant : colors.primary,
          borderRadius: borderRadius.card,
        },
        !disabled && AppShadows.buttonPrimary,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.onPrimary} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              AppTypography.labelLarge,
              styles.text,
              { color: colors.onPrimary },
              icon ? { marginLeft: 8 } : null,
              trailingIcon ? { marginRight: 8 } : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {trailingIcon}
        </>
      )}
    </LlPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: {
    letterSpacing: 0.3,
  },
});
