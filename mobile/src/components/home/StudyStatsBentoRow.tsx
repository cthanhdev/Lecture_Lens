// StudyStatsBentoRow: Dual Bento cards (Due Today + Streak) for Screens 08 & 09
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { DueTodayViewModel, StreakViewModel } from '../../modules/study/types'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'
import { Button } from '../ui/button/Button'
import { Icon } from '../ui/icons/Icon'

export interface StudyStatsBentoRowProps {
  readonly dueToday: DueTodayViewModel
  readonly streak: StreakViewModel
  readonly isOffline: boolean
  readonly onStartReview: () => void
}

export const StudyStatsBentoRow: React.FC<StudyStatsBentoRowProps> = ({
  dueToday,
  streak,
  isOffline,
  onStartReview,
}) => {
  const clampedRatio = Math.max(0, Math.min(1, dueToday.progressRatio))

  return (
    <View style={styles.row}>
      {/* Left Tile: Due Today */}
      <View style={styles.tile}>
        <View style={styles.tileHeader}>
          <Text style={styles.eyebrow}>{dueToday.eyebrow}</Text>
          {isOffline ? (
            <View style={styles.offlineRingBadge} />
          ) : (
            <View style={styles.dueIconBadge}>
              <Icon
                name="cards"
                size="sm"
                strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
              />
            </View>
          )}
        </View>

        <View style={styles.dueBody}>
          <View style={styles.statLine}>
            <Text style={styles.statNumber}>{dueToday.dueCount}</Text>
            <Text style={styles.statUnit}> cards</Text>
          </View>

          {isOffline ? (
            <Text style={styles.toReviewLabel}>to review</Text>
          ) : (
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(clampedRatio * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>{dueToday.progressLabel}</Text>
            </View>
          )}
        </View>

        <View style={styles.dueFooter}>
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onPress={onStartReview}
            rightIcon={
              !isOffline ? (
                <Icon name="arrow-right" size="xs" strokeColor="#FFFFFF" />
              ) : undefined
            }
            accessibilityLabel={dueToday.ctaLabel}
            style={styles.reviewButton}
          >
            {dueToday.ctaLabel}
          </Button>

          {isOffline && dueToday.offlineHint ? (
            <View style={styles.worksOfflineRow}>
              <Icon
                name="check-circle"
                size={12}
                strokeColor={KITSUNE_COLORS.plumInkMuted}
              />
              <Text style={styles.worksOfflineText}>{dueToday.offlineHint}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Right Tile: Streak */}
      <View style={styles.tile}>
        <View style={styles.tileHeader}>
          <Text style={styles.eyebrow}>{streak.eyebrow}</Text>
          <View style={styles.streakIconBadge}>
            <Icon
              name={isOffline ? 'star' : 'flame'}
              size="sm"
              strokeColor="#8A5A00"
            />
          </View>
        </View>

        <View style={styles.streakBody}>
          <View style={styles.statLine}>
            <Text style={styles.statNumber}>{streak.days}</Text>
            <Text style={styles.streakUnit}> days</Text>
          </View>
          <Text
            style={[
              styles.streakSubtitle,
              isOffline && styles.streakSubtitleOffline,
            ]}
            numberOfLines={1}
          >
            {streak.subtitle}
          </Text>
        </View>

        <View style={styles.weekRow}>
          {streak.weekDays.map((day, index) => (
            <View key={`${day.label}-${index}`} style={styles.dayColumn}>
              <View
                style={[
                  styles.dayDot,
                  day.completed
                    ? styles.dayDotCompleted
                    : day.isToday
                      ? styles.dayDotToday
                      : styles.dayDotUpcoming,
                ]}
              >
                {day.completed && !isOffline ? (
                  <Icon
                    name="check"
                    size={10}
                    strokeColor="#FFFFFF"
                    strokeWidth={2.4}
                  />
                ) : null}
                {day.isToday && !isOffline ? (
                  <View style={styles.todayInnerDot} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  day.isToday && styles.dayLabelToday,
                ]}
              >
                {day.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: KITSUNE_RADII.squircleCard,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    padding: 15,
    justifyContent: 'space-between',
    gap: 10,
    ...KITSUNE_SHADOWS.miruku,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  eyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.6,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  dueIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(244, 127, 114, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineRingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: KITSUNE_COLORS.matchaMint,
    backgroundColor: 'rgba(190, 225, 208, 0.16)',
  },
  streakIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 226, 122, 0.56)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueBody: {
    gap: 6,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statNumber: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: KITSUNE_COLORS.plumInk,
  },
  statUnit: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  toReviewLabel: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12.5,
    color: KITSUNE_COLORS.plumInkMuted,
    marginTop: -4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(38, 19, 51, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: KITSUNE_COLORS.matchaMint,
  },
  progressLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  dueFooter: {
    gap: 6,
  },
  reviewButton: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  worksOfflineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  worksOfflineText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  streakBody: {
    gap: 3,
  },
  streakUnit: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: KITSUNE_COLORS.plumInk,
  },
  streakSubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  streakSubtitleOffline: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
  },
  dayDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotCompleted: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  dayDotToday: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: KITSUNE_COLORS.kitsuneCoral,
  },
  dayDotUpcoming: {
    backgroundColor: 'rgba(38, 19, 51, 0.12)',
  },
  todayInnerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  dayLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  dayLabelToday: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
})
