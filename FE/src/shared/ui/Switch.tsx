import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../core/theme';

export interface SwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
}

export function Switch({ value, onValueChange, disabled = false }: SwitchProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        value ? styles.trackActive : styles.trackInactive,
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.thumb,
          value ? styles.thumbActive : styles.thumbInactive,
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: radius.pill,
    padding: 2,
    justifyContent: 'center',
  },
  trackActive: {
    backgroundColor: colors.brand.primary,
  },
  trackInactive: {
    backgroundColor: colors.bg.containerHigh,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#261333',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbActive: {
    alignSelf: 'flex-end',
  },
  thumbInactive: {
    alignSelf: 'flex-start',
  },
  disabled: {
    opacity: 0.5,
  },
});
