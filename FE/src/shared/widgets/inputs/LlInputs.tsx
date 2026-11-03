import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../../core/theme/ThemeContext';
import { AppTypography } from '../../../core/theme/typography';
import { LlIcon } from '../icons/LlIcon';
import { LlPressable } from '../interactive/LlPressable';

interface LlTextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const LlTextField = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}: LlTextFieldProps) => {
  const { colors, borderRadius } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[AppTypography.labelMedium, styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.card,
            borderRadius: borderRadius.md,
            borderColor: error
              ? colors.coralDark
              : isFocused
              ? colors.primary
              : colors.border,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={colors.onSurfaceVariant}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            AppTypography.bodyMedium,
            styles.input,
            { color: colors.text },
            style,
          ]}
          {...props}
        />
      </View>
      {error && (
        <Text style={[AppTypography.bodySmall, styles.errorText, { color: colors.coralDark }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

interface LlSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const LlSearchBar = ({
  value,
  onChangeText,
  placeholder = 'Tìm kiếm bài giảng, môn học, từ khóa...',
  onClear,
  style,
}: LlSearchBarProps) => {
  const { colors, borderRadius } = useAppTheme();

  return (
    <View
      style={[
        styles.searchContainer,
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.pill,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.searchIcon}>
        <LlIcon name="search" size={18} color={colors.primary} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        style={[AppTypography.bodyMedium, styles.searchInput, { color: colors.text }]}
      />
      {value.length > 0 && (
        <LlPressable onPress={onClear || (() => onChangeText(''))} style={styles.clearButton}>
          <LlIcon name="close" size={14} color={colors.textSecondary} />
        </LlPressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    height: 48,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
  },
  errorText: {
    marginTop: 4,
  },
  searchContainer: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
  },
  clearButton: {
    padding: 6,
  },
});
