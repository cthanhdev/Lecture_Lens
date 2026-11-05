import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radius } from '../../core/theme';

export interface WaveformVisualizerProps {
  progress?: number; // 0.0 to 1.0
  barCount?: number;
  height?: number;
  activeColor?: string;
  inactiveColor?: string;
  onSeek?: (ratio: number) => void;
  style?: ViewStyle;
}

// Fixed pseudo-random amplitude heights mimicking human speech
const SPEECH_AMPLITUDES = [
  0.25, 0.4, 0.6, 0.35, 0.75, 0.9, 0.65, 0.45, 0.8, 1.0, 0.85, 0.5,
  0.3, 0.65, 0.7, 0.95, 0.8, 0.4, 0.6, 0.75, 0.88, 0.55, 0.35, 0.7,
  0.9, 0.6, 0.45, 0.8, 0.75, 0.5, 0.35, 0.6, 0.7, 0.85, 0.4, 0.25,
];

export function WaveformVisualizer({
  progress = 0.5,
  barCount = 36,
  height = 36,
  activeColor = colors.brand.primary,
  inactiveColor = colors.brand.primarySoft,
  onSeek,
  style,
}: WaveformVisualizerProps) {
  const bars = SPEECH_AMPLITUDES.slice(0, barCount);
  const activeBarIndex = Math.floor(progress * barCount);

  const handleBarPress = (index: number) => {
    if (onSeek) {
      onSeek(index / barCount);
    }
  };

  return (
    <View style={[styles.container, { height }, style]}>
      {bars.map((amp, idx) => {
        const isActive = idx <= activeBarIndex;
        const barHeight = Math.max(height * amp, 4);

        return (
          <TouchableOpacity
            key={idx}
            activeOpacity={onSeek ? 0.7 : 1}
            disabled={!onSeek}
            onPress={() => handleBarPress(idx)}
            style={styles.barTouchArea}
          >
            <View
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: isActive ? activeColor : inactiveColor,
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  barTouchArea: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  bar: {
    width: 3.5,
    borderRadius: radius.pill,
  },
});
