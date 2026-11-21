import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Button } from '../ui/button'
import { Icon } from '../ui/icons/Icon'
import { ProgressRing } from './ProgressRing'
import type { HomeViewModel } from '../../modules/home'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

export interface DueTodayCardProps {
  readonly data: HomeViewModel['dueToday']
  readonly onStartReview: () => void
}

export const DueTodayCard: React.FC<DueTodayCardProps> = ({
  data,
  onStartReview,
}) => {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(data.progressRatio, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    })
  }, [data.progressRatio, progress])

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%`,
  }))

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>DUE TODAY</Text>
        {data.headerVisual === 'progress-ring' ? (
          <ProgressRing progress={data.progressRatio} size={24} />
        ) : (
          <View style={styles.cardsBadge}>
            <Icon
              name="cards"
              size="xs"
              strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
            />
          </View>
        )}
      </View>

      <View style={styles.statBlock}>
        <View style={styles.statRow}>
          <Text style={styles.bigNumber}>{data.dueCount}</Text>
          <Text style={styles.unitLabel}>cards</Text>
        </View>
        {data.subtitle ? (
          <Text style={styles.subtitleText}>{data.subtitle}</Text>
        ) : null}
      </View>

      {data.showProgressBar ? (
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, fillStyle]} />
          </View>
          <Text style={styles.progressCount}>{data.progressText}</Text>
        </View>
      ) : null}

      <View style={styles.ctaWrap}>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onPress={onStartReview}
          rightIcon={
            data.showProgressBar ? (
              <Icon name="chevron-right" size={13} strokeColor="#FFFFFF" />
            ) : undefined
          }
          style={styles.ctaButton}
        >
          Start review
        </Button>

        {data.showWorksOfflineBadge ? (
          <View style={styles.offlineFootnote}>
            <Icon
              name="check-circle"
              size="xs"
              strokeColor={KITSUNE_COLORS.plumInkMuted}
            />
            <Text style={styles.offlineFootnoteText}>Works offline</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.mirukuCard,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.mirukuBorder,
    ...KITSUNE_SHADOWS.miruku,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  cardsBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(245, 195, 201, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBlock: {
    gap: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  bigNumber: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 30,
    lineHeight: 34,
    color: KITSUNE_COLORS.plumInk,
  },
  unitLabel: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  subtitleText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(245, 195, 201, 0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: KITSUNE_COLORS.matchaMint,
  },
  progressCount: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  ctaWrap: {
    gap: 8,
  },
  ctaButton: {
    height: 40,
  },
  offlineFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  offlineFootnoteText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkMuted,
  },
})
