// Kitsune Soft Timestamp Seek Chip [MM:SS] for React Native
import React from 'react'
import {
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Icon } from '../icons/Icon'
import {
  KITSUNE_COLORS,
  KITSUNE_RADII,
  KITSUNE_SHADOWS,
} from '../../../theme/tokens'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface TimestampChipProps {
  /** Thời gian tính bằng giây hoặc chuỗi đã format sẵn (vd: '04:12' hoặc 252) */
  time: number | string
  /** Trạng thái đang phát đoạn âm thanh này */
  isPlaying?: boolean
  /** Màu nhấn: matcha (mặc định cho bài học) hoặc mochi (cho highlight thi cử) */
  accent?: 'matcha' | 'mochi' | 'coral'
  /** Hàm callback khi click để tua audio */
  onSeek?: (seconds: number) => void
  style?: StyleProp<ViewStyle>
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function parseSeconds(val: number | string): { formatted: string; seconds: number } {
  if (typeof val === 'number') {
    return { formatted: formatSeconds(val), seconds: val }
  }
  const parts = val.replace(/[[\]]/g, '').split(':')
  if (parts.length === 2) {
    const s = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
    return { formatted: val.replace(/[[\]]/g, ''), seconds: isNaN(s) ? 0 : s }
  }
  return { formatted: val, seconds: 0 }
}

export const TimestampChip: React.FC<TimestampChipProps> = ({
  time,
  isPlaying = false,
  accent = 'matcha',
  onSeek,
  style,
}) => {
  const { formatted, seconds } = parseSeconds(time)
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 150 })
    Haptics.selectionAsync().catch(() => {})
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 })
  }

  const handlePress = () => {
    if (onSeek) onSeek(seconds)
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Mốc thời gian ${formatted}`}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        styles[accent],
        isPlaying && styles.playing,
        animatedStyle,
        style,
      ]}
    >
      <Icon
        name="play"
        size="xs"
        strokeColor={isPlaying ? '#FFFFFF' : KITSUNE_COLORS.plumInk}
      />
      <Text style={[styles.text, styles[`${accent}Text`], isPlaying && styles.playingText]}>
        [{formatted}]
      </Text>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: KITSUNE_RADII.pill,
    alignSelf: 'flex-start',
  },
  matcha: {
    backgroundColor: 'rgba(190, 225, 208, 0.45)',
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.matchaMint,
  },
  mochi: {
    backgroundColor: 'rgba(255, 226, 122, 0.40)',
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.mochiYellow,
  },
  coral: {
    backgroundColor: 'rgba(244, 127, 114, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(244, 127, 114, 0.35)',
  },
  playing: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    borderColor: 'transparent',
    ...KITSUNE_SHADOWS.miruku,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  matchaText: { color: '#0A4325' },
  mochiText: { color: '#7B5400' },
  coralText: { color: KITSUNE_COLORS.kitsuneCoralDark },
  playingText: { color: '#FFFFFF' },
})
