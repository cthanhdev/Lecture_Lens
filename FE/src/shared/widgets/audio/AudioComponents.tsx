import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../core/theme/ThemeContext';
import { AppColors } from '../../../core/theme/colors';
import { AppTypography } from '../../../core/theme/typography';
import { formatDuration } from '../../../core/utils/formatters';
import { LlPressable } from '../interactive/LlPressable';

interface AudioProgressBarProps {
  positionSeconds: number;
  durationSeconds: number;
  onSeek: (seconds: number) => void;
}

export const AudioProgressBar = ({
  positionSeconds,
  durationSeconds,
  onSeek,
}: AudioProgressBarProps) => {
  const { colors } = useAppTheme();
  const progressRatio = durationSeconds > 0 ? Math.min(positionSeconds / durationSeconds, 1) : 0;
  const progressPercent = progressRatio * 100;

  return (
    <View style={styles.container}>
      {/* Progress Track */}
      <View style={[styles.track, { backgroundColor: colors.surfaceContainer }]}>
        <View style={[styles.fill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
        <View style={[styles.thumb, { left: `${progressPercent}%`, backgroundColor: colors.primary }]} />
      </View>

      {/* Time Labels */}
      <View style={styles.timeRow}>
        <Text style={[AppTypography.labelSmall, { color: colors.textSecondary }]}>
          {formatDuration(positionSeconds)}
        </Text>
        <Text style={[AppTypography.labelSmall, { color: colors.textSecondary }]}>
          {formatDuration(durationSeconds)}
        </Text>
      </View>
    </View>
  );
};

export const AudioWaveform = ({ isPlaying = false }: { isPlaying?: boolean }) => {
  const { colors } = useAppTheme();
  // Mô phỏng 24 cột sóng âm thanh
  const barHeights = [
    8, 14, 22, 16, 28, 36, 20, 12, 26, 32, 18, 24, 38, 20, 14, 30, 22, 16, 28, 34, 18, 12, 22, 10,
  ];

  return (
    <View style={styles.waveformContainer}>
      {barHeights.map((h, i) => (
        <View
          key={i}
          style={[
            styles.waveformBar,
            {
              height: isPlaying ? h : Math.max(h * 0.4, 4),
              backgroundColor: i < 10 ? colors.primary : colors.outlineVariant,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  track: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    paddingHorizontal: 8,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
});
