import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { KITSUNE_COLORS } from '../../theme/tokens'

const ONLINE_HEIGHTS = [
  14, 22, 18, 28, 16, 32, 24, 34, 22, 30, 36, 26, 20, 32, 28, 34,
  24, 30, 18, 26, 34, 28, 20, 24, 16, 28, 22, 18, 24, 14, 20, 12,
] as const

const OFFLINE_HEIGHTS = [
  14, 22, 28, 18, 26, 34, 24, 30, 18, 26, 20, 14, 22, 16, 12,
] as const

export interface LectureWaveformProps {
  readonly mode: 'online-highlighted' | 'offline-chunked'
  readonly progressRatio: number
  readonly isPlaying: boolean
}

interface AnimatedBarProps {
  readonly height: number
  readonly width: number
  readonly color: string
  readonly isPlaying: boolean
  readonly phaseDelay: number
}

const AnimatedWaveBar: React.FC<AnimatedBarProps> = ({
  height,
  width,
  color,
  isPlaying,
  phaseDelay,
}) => {
  const scaleY = useSharedValue(1)

  useEffect(() => {
    if (!isPlaying) {
      scaleY.value = withTiming(1, { duration: 180 })
      return
    }
    const min = 0.72 + (phaseDelay % 3) * 0.06
    const max = 1.15 - (phaseDelay % 2) * 0.05
    scaleY.value = withRepeat(
      withSequence(
        withTiming(max, {
          duration: 360 + phaseDelay * 45,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(min, {
          duration: 360 + phaseDelay * 45,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    )
  }, [isPlaying, phaseDelay, scaleY])

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }))

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: width / 2,
          backgroundColor: color,
        },
        barStyle,
      ]}
    />
  )
}

export const LectureWaveform: React.FC<LectureWaveformProps> = ({
  mode,
  progressRatio,
  isPlaying,
}) => {
  if (mode === 'offline-chunked') {
    const playedCutoff = Math.round(progressRatio * OFFLINE_HEIGHTS.length)
    return (
      <View style={styles.offlineContainer}>
        {OFFLINE_HEIGHTS.map((height, idx) => {
          const isPlayed = idx < playedCutoff
          const isHighlightCluster = idx >= 3 && idx <= 5
          const color = !isPlayed
            ? 'rgba(86, 66, 63, 0.16)'
            : isHighlightCluster
              ? KITSUNE_COLORS.mochiYellow
              : KITSUNE_COLORS.kitsuneCoral
          return (
            <AnimatedWaveBar
              key={idx}
              height={height}
              width={5.5}
              color={color}
              isPlaying={isPlaying && isPlayed}
              phaseDelay={idx % 5}
            />
          )
        })}
      </View>
    )
  }

  const playedCutoff = Math.round(progressRatio * ONLINE_HEIGHTS.length)

  return (
    <View style={styles.onlineContainer}>
      {/* Two warm Mochi Yellow highlight halos matching S08 */}
      <View style={[styles.highlightHalo, styles.haloLeft]} />
      <View style={[styles.highlightHalo, styles.haloRight]} />

      <View style={styles.onlineBarsRow}>
        {ONLINE_HEIGHTS.map((height, idx) => {
          const isPlayed = idx < playedCutoff
          const color = isPlayed
            ? KITSUNE_COLORS.kitsuneCoral
            : 'rgba(86, 66, 63, 0.24)'
          return (
            <AnimatedWaveBar
              key={idx}
              height={height}
              width={3}
              color={color}
              isPlaying={isPlaying && isPlayed}
              phaseDelay={idx % 6}
            />
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  onlineContainer: {
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 247, 253, 0.92)',
    justifyContent: 'center',
    paddingHorizontal: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  highlightHalo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 226, 122, 0.44)',
  },
  haloLeft: {
    left: '26%',
  },
  haloRight: {
    left: '64%',
  },
  onlineBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  offlineContainer: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
})
