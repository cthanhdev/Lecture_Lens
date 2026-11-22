// ContinueListeningCard: Screen 08 (Online) & Screen 09 (Offline) Continue Listening hero card
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { ContinueListeningViewModel } from '../../modules/study/types'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'
import { MiniWaveformBars } from '../onboarding/MiniWaveformBars'
import { LectureStatusBadge } from '../study/LectureStatusBadge'
import { Chip } from '../ui/chip/Chip'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable/MochiPressable'

export interface ContinueListeningCardProps {
  readonly item: ContinueListeningViewModel
  readonly isOffline: boolean
  readonly isPlaying: boolean
  readonly onPressCard: () => void
  readonly onTogglePlay: () => void
  readonly onCycleSpeed: () => void
}

export const ContinueListeningCard: React.FC<ContinueListeningCardProps> = ({
  item,
  isOffline,
  isPlaying,
  onPressCard,
  onTogglePlay,
  onCycleSpeed,
}) => {
  const progressRatio =
    item.durationSeconds > 0
      ? Math.max(0, Math.min(1, item.currentTimeSeconds / item.durationSeconds))
      : 0

  const activeBarLimit = Math.min(
    item.waveformBars.length,
    Math.max(1, Math.round(progressRatio * item.waveformBars.length) + 1),
  )

  const dynamicBars = item.waveformBars.map((bar, index) => ({
    height: bar.height,
    highlighted: index < activeBarLimit,
  }))

  return (
    <MochiPressable
      accessibilityRole="button"
      accessibilityLabel={`Continue listening to ${item.title}`}
      onPress={onPressCard}
      style={styles.card}
    >
      {/* Eyebrow Row */}
      <View style={styles.eyebrowRow}>
        <View style={styles.eyebrowLeft}>
          {isOffline ? (
            <Icon
              name="waveform"
              size="sm"
              strokeColor={KITSUNE_COLORS.plumInkMuted}
            />
          ) : (
            <View style={styles.coralDot} />
          )}
          <Text style={styles.eyebrowText}>CONTINUE LISTENING</Text>
        </View>

        {!isOffline ? (
          <View pointerEvents="none">
            <Chip
              variant={item.subjectTone}
              style={styles.subjectChip}
              textStyle={styles.subjectChipText}
            >
              {item.subject}
            </Chip>
          </View>
        ) : null}
      </View>

      {/* Lecture Title */}
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      {/* Offline Subject + Downloaded Badges (Screen 09) */}
      {isOffline ? (
        <View pointerEvents="none" style={styles.offlineBadgesRow}>
          <Chip
            variant={item.subjectTone}
            style={styles.subjectChip}
            textStyle={styles.subjectChipText}
          >
            {item.subject}
          </Chip>
          {item.isDownloaded ? <LectureStatusBadge variant="downloaded" /> : null}
        </View>
      ) : null}

      {/* Waveform Strip */}
      <View style={isOffline ? styles.waveformOfflineWrap : styles.waveformOnlineBox}>
        <MiniWaveformBars
          bars={dynamicBars}
          barWidth={3}
          gap={7}
          inactiveColor="rgba(38, 19, 51, 0.16)"
          activeColor={KITSUNE_COLORS.kitsuneCoral}
          highlightZones={item.highlightZones}
          highlightZoneColor="rgba(255, 226, 122, 0.50)"
        />
      </View>

      {/* Timestamp, Speed Chip & Play/Pause Controls */}
      <View style={styles.controlsRow}>
        <View style={styles.metaLeft}>
          <Text style={styles.timeText}>
            <Text style={styles.timeCurrent}>{item.currentTimeLabel}</Text>
            <Text style={styles.timeSeparator}> / {item.durationLabel}</Text>
          </Text>

          <Chip
            variant="primary"
            onPress={onCycleSpeed}
            style={styles.speedChip}
            textStyle={styles.speedChipText}
          >
            {item.playbackRateLabel}
          </Chip>
        </View>

        <MochiPressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause lecture' : 'Play lecture'}
          onPress={onTogglePlay}
          haptic="medium"
          style={styles.playButton}
        >
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size="md"
            strokeColor="#FFFFFF"
          />
        </MochiPressable>
      </View>
    </MochiPressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: KITSUNE_RADII.squircleCard,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    padding: 18,
    gap: 12,
    ...KITSUNE_SHADOWS.miruku,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eyebrowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  coralDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  eyebrowText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.7,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  subjectChip: {
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  subjectChipText: {
    fontSize: 11.5,
  },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: KITSUNE_COLORS.plumInk,
  },
  offlineBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  waveformOnlineBox: {
    backgroundColor: 'rgba(246, 238, 245, 0.72)',
    borderRadius: KITSUNE_RADII.squircleSmall,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformOfflineWrap: {
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    fontSize: 13.5,
  },
  timeCurrent: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: KITSUNE_COLORS.plumInk,
  },
  timeSeparator: {
    fontFamily: 'PlusJakartaSans_500Medium',
    color: KITSUNE_COLORS.plumInkMuted,
  },
  speedChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  speedChipText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11.5,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.miruku,
  },
})
