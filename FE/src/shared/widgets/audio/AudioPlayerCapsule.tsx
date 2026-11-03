import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../../core/theme/ThemeContext';
import { AppColors } from '../../../core/theme/colors';
import { AppTypography } from '../../../core/theme/typography';
import { AppShadows } from '../../../core/theme/layout';
import { useAudioPlayerStore } from '../../stores/useAudioPlayerStore';
import { formatDuration } from '../../../core/utils/formatters';
import { LlIcon } from '../icons/LlIcon';

interface AudioPlayerCapsuleProps {
  title: string;
  subject: string;
}

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0];

export const AudioPlayerCapsule = ({ title, subject }: AudioPlayerCapsuleProps) => {
  const { colors, borderRadius, isDark } = useAppTheme();
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);

  const {
    isPlaying,
    positionSeconds,
    durationSeconds,
    playbackRate,
    togglePlay,
    seekTo,
    skipBackward,
    skipForward,
    setPlaybackRate,
  } = useAudioPlayerStore();

  const progressPercent = durationSeconds > 0
    ? Math.min(100, Math.max(0, (positionSeconds / durationSeconds) * 100))
    : 0;

  return (
    <View
      style={[
        styles.capsuleCard,
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.modal,
          borderColor: colors.border,
        },
        AppShadows.floatingPill,
      ]}
    >
      {/* Scrubber Bar with Topic Markers on Track */}
      <View style={styles.scrubberArea}>
        <TouchableOpacity
          activeOpacity={0.9}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          accessibilityRole="adjustable"
          accessibilityLabel="Thanh tua thời gian bài giảng"
          accessibilityValue={{ min: 0, max: durationSeconds, now: positionSeconds }}
          onLayout={(e) => {
            const { width } = e.nativeEvent.layout;
            if (width > 0) {
              setTrackWidth(width);
            }
          }}
          onPress={(e) => {
            const { locationX } = e.nativeEvent;
            const currentWidth = trackWidth > 0 ? trackWidth : 300;
            const ratio = Math.max(0, Math.min(1, locationX / currentWidth));
            seekTo(Math.round(ratio * durationSeconds));
          }}
          style={[styles.scrubberTrack, { backgroundColor: colors.surfaceContainerHigh }]}
        >
          {/* Active fill */}
          <View
            pointerEvents="none"
            style={[
              styles.scrubberFill,
              { width: `${progressPercent}%`, backgroundColor: colors.primaryContainer },
            ]}
          />

          {/* Key Topic Bookmark Dots on Track */}
          <View pointerEvents="none" style={[styles.topicDot, { left: '10%', backgroundColor: colors.tertiaryContainer }]} />
          <View pointerEvents="none" style={[styles.topicDot, { left: '35%', backgroundColor: colors.tertiaryContainer }]} />
          <View pointerEvents="none" style={[styles.topicDot, { left: '60%', backgroundColor: colors.secondary }]} />
          <View pointerEvents="none" style={[styles.topicDot, { left: '85%', backgroundColor: colors.tertiaryContainer }]} />
        </TouchableOpacity>

        {/* Timers Row */}
        <View style={styles.timersRow}>
          <View style={styles.currentTimeWrapper}>
            <View style={[styles.pulsingDot, { backgroundColor: colors.primary }]} />
            <Text style={[AppTypography.labelSm, { color: colors.primary, fontWeight: '700' }]}>
              {formatDuration(positionSeconds)}
            </Text>
          </View>
          <Text style={[AppTypography.labelSm, { color: colors.textSecondary }]}>
            {formatDuration(durationSeconds)}
          </Text>
        </View>
      </View>

      {/* Playback Controls Row */}
      <View style={styles.controlsRow}>
        {/* Replay 10s */}
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => skipBackward(10)}
          style={[styles.skipRoundBtn, { backgroundColor: colors.surfaceContainer }]}
        >
          <LlIcon name="replay_10" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Main Play/Pause Capsule Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={togglePlay}
          style={[
            styles.mainPlayCapsule,
            { backgroundColor: colors.primaryContainer },
            AppShadows.buttonPrimary,
          ]}
        >
          <LlIcon
            name={isPlaying ? 'pause' : 'play_arrow'}
            size={18}
            color="#FFFFFF"
            filled
            style={{ marginRight: 6 }}
          />
          <Text style={[AppTypography.labelMd, { color: '#FFFFFF', fontWeight: '700' }]}>
            {isPlaying ? 'Đang nghe' : 'Tiếp tục'}
          </Text>
        </TouchableOpacity>

        {/* Forward 10s */}
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => skipForward(10)}
          style={[styles.skipRoundBtn, { backgroundColor: colors.surfaceContainer }]}
        >
          <LlIcon name="forward_10" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Speed Selector Pill */}
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            activeOpacity={0.85}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => setShowSpeedMenu(!showSpeedMenu)}
            style={[
              styles.speedPill,
              {
                backgroundColor: isDark ? colors.surfaceContainerHighest : AppColors.secondaryFixed,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text
                style={[
                  AppTypography.labelSm,
                  {
                    color: isDark ? colors.text : AppColors.onSecondaryFixed,
                    fontWeight: '700',
                  },
                ]}
              >
                {playbackRate}x
              </Text>
              <LlIcon
                name="arrow_drop_down"
                size={14}
                color={isDark ? colors.textSecondary : AppColors.onSecondaryFixed}
                filled
              />
            </View>
          </TouchableOpacity>

          {/* Speed popup menu */}
          {showSpeedMenu && (
            <View
              style={[
                styles.speedMenu,
                { backgroundColor: colors.card, borderColor: colors.border },
                AppShadows.card,
              ]}
            >
              {SPEED_OPTIONS.map((rate) => (
                <TouchableOpacity
                  key={rate}
                  onPress={() => {
                    setPlaybackRate(rate);
                    setShowSpeedMenu(false);
                  }}
                  style={[
                    styles.speedOption,
                    playbackRate === rate && {
                      backgroundColor: colors.surfaceContainerHigh,
                    },
                  ]}
                >
                  <Text
                    style={[
                      AppTypography.labelSm,
                      {
                        color: playbackRate === rate ? colors.primary : colors.text,
                        fontWeight: playbackRate === rate ? '700' : '500',
                      },
                    ]}
                  >
                    {rate}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  capsuleCard: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    zIndex: 30,
  },
  scrubberArea: {
    marginBottom: 12,
  },
  scrubberTrack: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  scrubberFill: {
    height: '100%',
    borderRadius: 4,
  },
  topicDot: {
    position: 'absolute',
    top: 1,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  currentTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  skipRoundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayCapsule: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  speedPill: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedMenu: {
    position: 'absolute',
    bottom: 46,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    minWidth: 70,
    zIndex: 50,
  },
  speedOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
