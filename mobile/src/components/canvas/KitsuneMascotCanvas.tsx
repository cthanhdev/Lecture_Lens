// KitsuneMascotCanvas Component: Người bạn đồng hành Cáo Kitsune Pixel Art
import React, { useEffect } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Icon } from '../ui/icons/Icon'
import { KITSUNE_COLORS } from '../../theme/tokens'

interface KitsuneMascotCanvasProps {
  size?: number
  onPet?: () => void
}

export const KitsuneMascotCanvas: React.FC<KitsuneMascotCanvasProps> = ({
  size = 72,
  onPet,
}) => {
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    // Chuyển động lơ lửng nhịp nhàng (Kawaii floating)
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    )
  }, [translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    scale.value = withSequence(
      withTiming(1.15, { duration: 120 }),
      withTiming(1, { duration: 150 })
    )
    onPet?.()
  }

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Animated.View style={[styles.mascotBox, animatedStyle]}>
        <Icon
          name="kitsune-fox"
          size={size}
          strokeColor={KITSUNE_COLORS.kitsuneCoral}
          blob="sakura"
        />
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
