// PaginationDots: Kitsune Coral animated pill progress indicators for Onboarding Carousel
import React, { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { KITSUNE_COLORS } from '../../theme/tokens'
import type { OnboardingStepIndex } from '../../modules/onboarding/types'

interface PaginationDotsProps {
  total?: number
  currentStep: OnboardingStepIndex
  onSelectStep: (step: OnboardingStepIndex) => void
}

function PaginationDotItem({
  index,
  total,
  isActive,
  onPress,
}: {
  index: number
  total: number
  isActive: boolean
  onPress: () => void
}) {
  const width = useSharedValue(isActive ? 24 : 8)

  useEffect(() => {
    width.set(withTiming(isActive ? 24 : 8, { duration: 180 }))
  }, [isActive, width])

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }))

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`Step ${index + 1} of ${total}`}
      style={styles.touchTarget}
    >
      <Animated.View
        style={[
          styles.dot,
          isActive ? styles.dotActive : styles.dotInactive,
          animatedStyle,
        ]}
      />
    </Pressable>
  )
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({
  total = 3,
  currentStep,
  onSelectStep,
}) => {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {Array.from({ length: total }).map((_, index) => {
        const step = index as OnboardingStepIndex
        return (
          <PaginationDotItem
            key={index}
            index={index}
            total={total}
            isActive={index === currentStep}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {})
              onSelectStep(step)
            }}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  touchTarget: {
    minHeight: 28,
    minWidth: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  dotInactive: {
    backgroundColor: 'rgba(38, 19, 51, 0.20)',
  },
})
