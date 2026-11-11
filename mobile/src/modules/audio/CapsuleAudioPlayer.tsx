// CapsuleAudioPlayer Component for React Native
import React from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useAudioPlayer } from './useAudioPlayer'
import { useAppNavigation } from '../../navigation/NavigationContext'
import { Icon } from '../../components/ui/icons/Icon'
import {
  KITSUNE_COLORS,
  KITSUNE_RADII,
  KITSUNE_SHADOWS,
} from '../../theme/tokens'

const { width } = Dimensions.get('window')
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function CapsuleAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playbackRate,
    setRate,
  } = useAudioPlayer()
  const nav = useAppNavigation()

  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const route = nav.currentRoute

  // Ẩn player nếu không có bài giảng hoặc đang ở màn hình ghi âm / làm thẻ
  if (
    !currentTrack ||
    route.includes('/record') ||
    route.includes('/session') ||
    route.includes('/onboarding') ||
    route.includes('/auth')
  ) {
    return null
  }

  // Nếu đang ở màn hình Lecture Detail thì thu nhỏ hoặc ẩn vì trang đã có player lớn
  const isInsideAudioDetail = route.includes('/lectures/')

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleRateCycle = () => {
    Haptics.selectionAsync().catch(() => {})
    const rates = [1.0, 1.25, 1.5, 2.0]
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length
    setRate(rates[nextIdx])
  }

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    togglePlay()
  }

  const handlePressCard = () => {
    if (!isInsideAudioDetail) {
      nav.goTo(`/lectures/${currentTrack.id}/transcript`)
    }
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Trình phát bài giảng ${currentTrack.title}`}
      onPress={handlePressCard}
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 120 })
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 })
      }}
      style={[styles.container, animatedStyle]}
    >
      <BlurView intensity={28} tint="light" style={styles.blurBar}>
        {/* Progress bar line ở đáy viên thuốc */}
        <View
          style={[
            styles.progressBar,
            { width: `${Math.min(100, Math.max(0, progressPercent))}%` },
          ]}
        />

        {/* Cụm Icon & Info */}
        <View style={styles.infoCol}>
          <View style={styles.iconCircle}>
            <Icon name="headphones" size="sm" strokeColor={KITSUNE_COLORS.kitsuneCoral} />
          </View>
          <View style={styles.metaCol}>
            <Text numberOfLines={1} style={styles.trackTitle}>
              {currentTrack.title}
            </Text>
            <View style={styles.timeRow}>
              <Text style={styles.currentTimeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.dividerText}>/</Text>
              <Text style={styles.durationText}>{formatTime(duration)}</Text>
            </View>
          </View>
        </View>

        {/* Cụm Nút Điều Khiển */}
        <View style={styles.controlsRow}>
          {/* Nút đổi tốc độ */}
          <Pressable onPress={handleRateCycle} style={styles.rateBtn}>
            <Text style={styles.rateText}>{playbackRate}x</Text>
          </Pressable>

          {/* Nút Play/Pause */}
          <Pressable onPress={handleToggle} style={styles.playBtn}>
            <Icon
              name={isPlaying ? 'pause' : 'play'}
              size="xs"
              strokeColor="#FFFFFF"
            />
          </Pressable>
        </View>
      </BlurView>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 96 : 88,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 45,
  },
  blurBar: {
    width: Math.min(width - 40, 400),
    height: 52,
    borderRadius: KITSUNE_RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.90)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    ...KITSUNE_SHADOWS.miruku,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    borderRadius: KITSUNE_RADII.pill,
  },
  infoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(244, 127, 114, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaCol: {
    flex: 1,
    gap: 1,
  },
  trackTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentTimeText: {
    fontSize: 10,
    fontWeight: '700',
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  dividerText: {
    fontSize: 10,
    color: KITSUNE_COLORS.plumInkSubtle,
  },
  durationText: {
    fontSize: 10,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rateBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(38, 19, 51, 0.06)',
  },
  rateText: {
    fontSize: 10,
    fontWeight: '700',
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.miruku,
  },
})
