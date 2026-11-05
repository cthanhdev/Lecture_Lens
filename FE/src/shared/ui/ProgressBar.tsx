import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../../core/theme';

export interface ProgressBarProps {
  progress: number; // 0.0 to 1.0
  height?: number;
  trackColor?: string;
  fillColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 6,
  trackColor = colors.bg.containerHigh,
  fillColor = colors.brand.primary,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: radius.pill, backgroundColor: trackColor },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: fillColor,
            borderRadius: radius.pill,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
