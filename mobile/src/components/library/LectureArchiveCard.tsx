// LectureArchiveCard: Shared 24px Squircle Card for Screen 10 (Archive) & Screen 12 (Offline Study Vault)
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type {
  LibraryLectureItemViewModel,
  SubjectTone,
} from '../../modules/study/types'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'
import { LectureStatusBadge } from '../study/LectureStatusBadge'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable/MochiPressable'

export interface LectureArchiveCardProps {
  item: LibraryLectureItemViewModel
  mode: 'archive' | 'offline'
  isSelected?: boolean
  selectionMode?: boolean
  isPlaying?: boolean
  onPress: (item: LibraryLectureItemViewModel) => void
  onPlayPress?: (item: LibraryLectureItemViewModel) => void
  onRetryPress?: (item: LibraryLectureItemViewModel) => void
}

interface ToneVisual {
  pillBg: string
  pillText: string
  frameBg: string
  accentStroke: string
}

const SUBJECT_TONE_VISUAL: Record<SubjectTone, ToneVisual> = {
  mist: {
    pillBg: 'rgba(169, 212, 232, 0.44)',
    pillText: '#204C5C',
    frameBg: 'rgba(169, 212, 232, 0.45)',
    accentStroke: '#2D6B86',
  },
  sakura: {
    pillBg: 'rgba(245, 195, 201, 0.48)',
    pillText: '#794851',
    frameBg: 'rgba(245, 195, 201, 0.50)',
    accentStroke: KITSUNE_COLORS.kitsuneCoralDark,
  },
  matcha: {
    pillBg: 'rgba(190, 225, 208, 0.48)',
    pillText: '#0A4325',
    frameBg: 'rgba(190, 225, 208, 0.52)',
    accentStroke: '#1D6B45',
  },
  mochi: {
    pillBg: 'rgba(232, 224, 236, 0.72)',
    pillText: KITSUNE_COLORS.plumInkMuted,
    frameBg: 'rgba(222, 215, 234, 0.60)',
    accentStroke: KITSUNE_COLORS.plumInkMuted,
  },
}

export const LectureArchiveCard: React.FC<LectureArchiveCardProps> = ({
  item,
  mode,
  isSelected = false,
  selectionMode = false,
  isPlaying = false,
  onPress,
  onPlayPress,
  onRetryPress,
}) => {
  const tone = SUBJECT_TONE_VISUAL[item.subjectTone]
  const isOfflineCard = mode === 'offline'
  const isLocked = item.isLockedOffline
  const isTranscribing = item.badgeVariant === 'transcribing'
  const isFailed = item.badgeVariant === 'failed'
  const progressPct = Math.max(
    6,
    Math.min(100, Math.round(item.transcribeProgress ?? 0)),
  )

  if (isOfflineCard && isLocked) {
    return (
      <MochiPressable
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={`${item.title}, Needs connection`}
        pressedScale={0.99}
        haptic="selection"
        onPress={() => onPress(item)}
        style={styles.lockedCard}
      >
        <View style={styles.rowMain}>
          <View style={styles.lockedIconFrame}>
            <Icon
              name="wifi-off"
              size="md"
              strokeColor={KITSUNE_COLORS.plumInkSubtle}
            />
          </View>

          <View style={styles.contentCol}>
            <Text style={styles.lockedTitle} numberOfLines={2}>
              {item.title}
            </Text>

            <View style={styles.offlineLockedMetaRow}>
              <View style={styles.lockedSubjectPill}>
                <Text style={styles.lockedSubjectText}>{item.subject}</Text>
              </View>
              <Text style={styles.lockedMetaText}>{item.metaLabel}</Text>
            </View>

            <View style={styles.needsConnRow}>
              <Icon
                name="wifi-off"
                size={12}
                strokeColor={KITSUNE_COLORS.plumInkSubtle}
              />
              <Text style={styles.needsConnText}>Needs connection</Text>
            </View>
          </View>

          <View style={styles.lockTrailingWrap}>
            <Icon
              name="lock"
              size="sm"
              strokeColor={KITSUNE_COLORS.plumInkSubtle}
            />
          </View>
        </View>
      </MochiPressable>
    )
  }

  if (isOfflineCard) {
    return (
      <MochiPressable
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.subject}, ${item.durationLabel}`}
        onPress={() => onPress(item)}
        style={styles.card}
      >
        <View style={styles.rowMain}>
          <MochiPressable
            accessibilityRole="button"
            accessibilityLabel={
              isPlaying ? `Pause ${item.title}` : `Play ${item.title}`
            }
            haptic="light"
            onPress={() => (onPlayPress ? onPlayPress(item) : onPress(item))}
            style={[styles.offlinePlayFrame, { backgroundColor: tone.frameBg }]}
          >
            <View style={styles.offlinePlayInner}>
              <Icon
                name={isPlaying ? 'pause' : 'play'}
                size="md"
                strokeColor={tone.accentStroke}
              />
            </View>
          </MochiPressable>

          <View style={styles.contentCol}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>

            <View style={styles.badgeLine}>
              <LectureStatusBadge variant={item.badgeVariant} />
            </View>

            <View style={styles.offlineMetaRow}>
              <View style={[styles.subjectPill, { backgroundColor: tone.pillBg }]}>
                <Text style={[styles.subjectPillText, { color: tone.pillText }]}>
                  {item.subject}
                </Text>
              </View>
              <Text style={styles.metaText}>{`· ${item.durationLabel}`}</Text>
            </View>
          </View>

          <View style={styles.offlineChevronCircle}>
            <Icon
              name="chevron-right"
              size={14}
              strokeColor={KITSUNE_COLORS.plumInkMuted}
            />
          </View>
        </View>
      </MochiPressable>
    )
  }

  const leadingIconName = isFailed
    ? 'wifi-off'
    : isTranscribing
    ? 'cloud-upload'
    : 'mic'
  const leadingFrameBg = isFailed
    ? 'rgba(244, 127, 114, 0.24)'
    : tone.frameBg
  const leadingStrokeColor = isFailed
    ? KITSUNE_COLORS.kitsuneCoralDark
    : KITSUNE_COLORS.plumInk

  return (
    <MochiPressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.subject}, ${item.metaLabel}`}
      accessibilityState={selectionMode ? { selected: isSelected } : undefined}
      onPress={() => onPress(item)}
      style={[styles.card, isSelected && styles.cardSelected]}
    >
      <View style={styles.rowMain}>
        <View style={[styles.leadingIconFrame, { backgroundColor: leadingFrameBg }]}>
          <View style={styles.leadingIconInner}>
            <Icon
              name={leadingIconName}
              size="md"
              strokeColor={leadingStrokeColor}
            />
          </View>
        </View>

        <View style={styles.contentCol}>
          <View style={styles.topMetaRow}>
            <View style={[styles.subjectPill, { backgroundColor: tone.pillBg }]}>
              <Text
                style={[styles.subjectPillText, { color: tone.pillText }]}
                numberOfLines={1}
              >
                {item.subject}
              </Text>
            </View>

            <LectureStatusBadge
              variant={item.badgeVariant}
              progress={item.transcribeProgress}
              onPress={
                item.canRetry && onRetryPress
                  ? () => onRetryPress(item)
                  : undefined
              }
            />
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.bottomMetaRow}>
            <View style={styles.timeMetaLeft}>
              <Icon
                name="clock"
                size={13}
                strokeColor={KITSUNE_COLORS.plumInkMuted}
              />
              <Text style={styles.metaText}>{item.metaLabel}</Text>
            </View>

            {selectionMode ? (
              <View
                style={[
                  styles.selectCircle,
                  isSelected && styles.selectCircleActive,
                ]}
              >
                {isSelected ? (
                  <Icon name="check" size={12} strokeColor="#FFFFFF" />
                ) : null}
              </View>
            ) : (
              <Icon
                name="chevron-right"
                size={15}
                strokeColor={KITSUNE_COLORS.plumInkMuted}
              />
            )}
          </View>
        </View>
      </View>

      {isTranscribing ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
      ) : null}
    </MochiPressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    padding: 16,
    gap: 12,
    ...KITSUNE_SHADOWS.miruku,
  },
  cardSelected: {
    borderColor: KITSUNE_COLORS.kitsuneCoral,
    backgroundColor: 'rgba(255, 249, 251, 0.96)',
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  leadingIconFrame: {
    width: 54,
    height: 54,
    borderRadius: 18,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
    gap: 6,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  subjectPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: KITSUNE_RADII.pill,
    alignSelf: 'flex-start',
  },
  subjectPillText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    lineHeight: 14,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15.5,
    lineHeight: 21,
    color: KITSUNE_COLORS.plumInk,
  },
  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  timeMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12.5,
    lineHeight: 17,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  progressTrack: {
    height: 5,
    width: '100%',
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(169, 212, 232, 0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  selectCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: KITSUNE_COLORS.plumInkSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCircleActive: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    borderColor: KITSUNE_COLORS.kitsuneCoral,
  },
  offlinePlayFrame: {
    width: 54,
    height: 54,
    borderRadius: 18,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlinePlayInner: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  offlineChevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 195, 201, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.06)',
    padding: 16,
  },
  lockedIconFrame: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(38, 19, 51, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(38, 19, 51, 0.56)',
  },
  offlineLockedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  lockedSubjectPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(38, 19, 51, 0.06)',
  },
  lockedSubjectText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  lockedMetaText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: KITSUNE_COLORS.plumInkSubtle,
  },
  needsConnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  needsConnText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11.5,
    lineHeight: 15,
    color: KITSUNE_COLORS.plumInkSubtle,
  },
  lockTrailingWrap: {
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
