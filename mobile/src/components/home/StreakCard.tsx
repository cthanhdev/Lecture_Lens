import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { Icon } from '../ui/icons/Icon'
import type { HomeViewModel } from '../../modules/home'
import { KITSUNE_COLORS, KITSUNE_SHADOWS } from '../../theme/tokens'

export interface StreakCardProps {
  readonly data: HomeViewModel['streak']
  readonly isOffline: boolean
}

export const StreakCard: React.FC<StreakCardProps> = ({ data, isOffline }) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>STREAK</Text>
        <View style={styles.iconBadge}>
          <Icon
            name={data.icon}
            size="xs"
            strokeColor={isOffline ? KITSUNE_COLORS.plumInk : '#7B5400'}
          />
        </View>
      </View>

      <View style={styles.statRow}>
        <Text style={styles.bigNumber}>{data.days}</Text>
        <Text style={styles.unitLabel}>days</Text>
      </View>

      <Text
        numberOfLines={1}
        style={[styles.caption, isOffline && styles.offlineCaption]}
      >
        {data.caption}
      </Text>

      <View style={styles.weekRow}>
        {data.week.map((day, idx) => {
          const isDone = day.state === 'done'
          const isToday = day.state === 'today'
          return (
            <Animated.View
              key={day.key}
              entering={FadeIn.delay(idx * 40).duration(220)}
              style={styles.dayCol}
            >
              <View
                style={[
                  styles.dotBase,
                  isDone && styles.dotDone,
                  isToday && styles.dotToday,
                  day.state === 'upcoming' && styles.dotUpcoming,
                ]}
              >
                {isDone && !isOffline ? (
                  <Icon name="check" size={9} strokeColor="#FFFFFF" strokeWidth={2.4} />
                ) : isToday && !isOffline ? (
                  <View style={styles.todayInnerDot} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  isToday && styles.todayLabel,
                ]}
              >
                {day.label}
              </Text>
            </Animated.View>
          )
        })}
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
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 226, 122, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: KITSUNE_COLORS.plumInk,
  },
  caption: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  offlineCaption: {
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
  },
  dotBase: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  dotToday: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.75,
    borderColor: KITSUNE_COLORS.kitsuneCoral,
  },
  todayInnerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  dotUpcoming: {
    backgroundColor: 'rgba(38, 19, 51, 0.12)',
  },
  dayLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 9.5,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  todayLabel: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
})
