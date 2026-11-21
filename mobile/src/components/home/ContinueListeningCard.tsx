import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../ui/button'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable'
import { LectureWaveform } from './LectureWaveform'
import type { HomeViewModel } from '../../modules/home'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

export interface ContinueListeningCardProps {
  readonly data: HomeViewModel['continueListening']
  readonly isOffline: boolean
  readonly isPlaying: boolean
  readonly currentTimeSec: number
  readonly onOpenLecture: () => void
  readonly onTogglePlay: () => void
}

function formatClockInline(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export const ContinueListeningCard: React.FC<ContinueListeningCardProps> = ({
  data,
  isOffline,
  isPlaying,
  currentTimeSec,
  onOpenLecture,
  onTogglePlay,
}) => {
  const effectiveTime = currentTimeSec > 0 ? currentTimeSec : data.positionSec
  const progressRatio =
    data.durationSec > 0 ? Math.min(1, Math.max(0, effectiveTime / data.durationSec)) : 0

  return (
    <View style={styles.card}>
      <MochiPressable
        accessibilityLabel={`Continue listening to ${data.lecture.title}`}
        onPress={onOpenLecture}
        style={styles.cardTapArea}
      >
        {/* Top eyebrow row */}
        <View style={styles.topRow}>
          <View style={styles.eyebrowGroup}>
            {isOffline ? (
              <Icon
                name="waveform"
                size="sm"
                strokeColor={KITSUNE_COLORS.plumInkMuted}
              />
            ) : (
              <View style={styles.coralDot} />
            )}
            <Text style={styles.eyebrow}>CONTINUE LISTENING</Text>
          </View>

          {!isOffline ? (
            <View style={styles.mistBadge}>
              <Text style={styles.mistBadgeText}>{data.lecture.subject}</Text>
            </View>
          ) : null}
        </View>

        {/* Lecture Title */}
        <Text numberOfLines={2} style={styles.title}>
          {data.lecture.title}
        </Text>

        {/* Offline chips row placed under title per S09 design */}
        {isOffline ? (
          <View style={styles.offlineChipsRow}>
            <View style={styles.mistBadge}>
              <Text style={styles.mistBadgeText}>{data.lecture.subject}</Text>
            </View>
            {data.showDownloadedBadge ? (
              <View style={styles.matchaBadge}>
                <Icon name="check" size={12} strokeColor="#0A4325" />
                <Text style={styles.matchaBadgeText}>Downloaded</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Waveform strip */}
        <LectureWaveform
          mode={data.waveformMode}
          progressRatio={progressRatio}
          isPlaying={isPlaying}
        />
      </MochiPressable>

      {/* Footer row kept as sibling outside MochiPressable to prevent nested interactive elements */}
      <View style={styles.footerRow}>
        <View style={styles.timeGroup}>
          <Text style={styles.timeCurrent}>{formatClockInline(effectiveTime)}</Text>
          <Text style={styles.timeSeparator}>/</Text>
          <Text style={styles.timeTotal}>{data.durationLabel}</Text>

          {data.showPlaybackRateChip ? (
            <View style={styles.ratePill}>
              <Text style={styles.rateText}>{data.playbackRateLabel}</Text>
            </View>
          ) : null}
        </View>

        <Button
          variant="fab"
          size="icon"
          accessibilityLabel={isPlaying ? 'Pause lecture' : 'Play lecture'}
          onPress={onTogglePlay}
          style={styles.playFab}
        >
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size="md"
            strokeColor="#FFFFFF"
          />
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: KITSUNE_COLORS.mirukuCard,
    borderRadius: KITSUNE_RADII.squircleCard,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.mirukuBorder,
    ...KITSUNE_SHADOWS.miruku,
  },
  cardTapArea: {
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eyebrowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coralDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  eyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.7,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  mistBadge: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(169, 212, 232, 0.38)',
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.mistSky,
  },
  mistBadgeText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11.5,
    color: '#204C5C',
  },
  matchaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(190, 225, 208, 0.45)',
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.matchaMint,
  },
  matchaBadgeText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11.5,
    color: '#0A4325',
  },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.3,
    color: KITSUNE_COLORS.plumInk,
  },
  offlineChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeCurrent: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: KITSUNE_COLORS.plumInk,
    fontVariant: ['tabular-nums'],
  },
  timeSeparator: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: KITSUNE_COLORS.plumInkSubtle,
  },
  timeTotal: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: KITSUNE_COLORS.plumInkMuted,
    fontVariant: ['tabular-nums'],
  },
  ratePill: {
    marginLeft: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: '#F3EAF6',
  },
  rateText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInk,
  },
  playFab: {
    width: 50,
    height: 50,
    shadowColor: KITSUNE_COLORS.kitsuneCoral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
})
