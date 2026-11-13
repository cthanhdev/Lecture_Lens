// OnboardingCarousel: Unified Horizontal Swipeable Wizard for Screens 02-04
// Syncs scrollProgress across 3 continuous morphing backdrop orbs at 60-120 FPS
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import Animated, {
  clamp,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Button } from '../ui/button/Button'
import { Icon } from '../ui/icons/Icon'
import { AmbientPastelBackdrop } from './AmbientPastelBackdrop'
import { PaginationDots } from './PaginationDots'
import { Step1SlideContent } from './Step1SlideContent'
import { Step2SlideContent } from './Step2SlideContent'
import { Step3SlideContent } from './Step3SlideContent'
import {
  ONBOARDING_MAX_PROGRESS,
  ONBOARDING_SLIDES,
  clampOnboardingStep,
  completeOnboarding,
  type OnboardingStepIndex,
} from '../../modules/onboarding'
import { appStorage } from '../../modules/storage'
import { getAuthSeam } from '../../modules/auth'
import { KITSUNE_COLORS } from '../../theme/tokens'

interface OnboardingCarouselProps {
  initialStep?: OnboardingStepIndex
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  initialStep = 0,
}) => {
  const router = useRouter()
  const { width, height } = useWindowDimensions()
  const scrollRef = useAnimatedRef<ScrollView>()
  const programmaticTargetRef = useRef<OnboardingStepIndex | null>(null)
  const didApplyInitialScrollRef = useRef(false)

  const [currentStep, setCurrentStep] = useState<OnboardingStepIndex>(initialStep)
  const [isCompleting, setIsCompleting] = useState(false)

  const scrollProgress = useSharedValue<number>(initialStep)
  const lastWorkletStep = useSharedValue<number>(initialStep)

  // Khung tham chiếu di động 390px (AGENTS.md) trên màn hình lớn, tràn viền trên điện thoại
  const frameWidth = width <= 440 ? width : 390
  const stageOffsetX = width <= 440 ? 0 : Math.round((width - frameWidth) / 2)
  const compactScale = height < 740 ? 0.84 : width < 370 ? 0.9 : 1

  const clearProgrammaticTarget = useCallback(() => {
    programmaticTargetRef.current = null
  }, [])

  const handleStepThresholdCrossed = useCallback((nextStep: number) => {
    const clamped = clampOnboardingStep(nextStep)
    if (programmaticTargetRef.current !== null) {
      if (clamped === programmaticTargetRef.current) {
        programmaticTargetRef.current = null
      }
      return
    }

    setCurrentStep((prev) => (prev === clamped ? prev : clamped))
    Haptics.selectionAsync().catch(() => {})
  }, [])

  const handleMomentumSettled = useCallback((settledStep: number) => {
    programmaticTargetRef.current = null
    const clamped = clampOnboardingStep(settledStep)
    setCurrentStep((prev) => (prev === clamped ? prev : clamped))
  }, [])

  const scrollToStep = useCallback(
    (targetStep: OnboardingStepIndex, animated = true) => {
      const clamped = clampOnboardingStep(targetStep)
      programmaticTargetRef.current = animated ? clamped : null
      setCurrentStep(clamped)
      if (!animated) {
        scrollProgress.set(clamped)
        lastWorkletStep.set(clamped)
      }
      scrollRef.current?.scrollTo({
        x: clamped * frameWidth,
        y: 0,
        animated,
      })
    },
    [frameWidth, lastWorkletStep, scrollProgress, scrollRef]
  )

  // Chặn Back hệ thống rớt về Splash tại Step 1; lùi trang mượt ở Step 2 & 3
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStep > 0) {
        scrollToStep((currentStep - 1) as OnboardingStepIndex)
        return true
      }
      return false
    })
    return () => subscription.remove()
  }, [currentStep, scrollToStep])

  const handleLayout = () => {
    if (didApplyInitialScrollRef.current) return
    didApplyInitialScrollRef.current = true
    if (initialStep > 0) {
      scrollProgress.set(initialStep)
      lastWorkletStep.set(initialStep)
      scrollRef.current?.scrollTo({
        x: initialStep * frameWidth,
        y: 0,
        animated: false,
      })
    }
  }

  const scrollHandler = useAnimatedScrollHandler(
    {
      onBeginDrag: () => {
        scheduleOnRN(clearProgrammaticTarget)
      },
      onScroll: (event) => {
        if (frameWidth <= 0) return
        const progress = clamp(
          event.contentOffset.x / frameWidth,
          0,
          ONBOARDING_MAX_PROGRESS
        )
        scrollProgress.set(progress)

        const roundedStep = Math.round(progress)
        if (roundedStep !== lastWorkletStep.get()) {
          lastWorkletStep.set(roundedStep)
          scheduleOnRN(handleStepThresholdCrossed, roundedStep)
        }
      },
      onMomentumEnd: (event) => {
        if (frameWidth <= 0) return
        const progress = clamp(
          event.contentOffset.x / frameWidth,
          0,
          ONBOARDING_MAX_PROGRESS
        )
        scrollProgress.set(progress)

        const settledStep = Math.round(progress)
        lastWorkletStep.set(settledStep)
        scheduleOnRN(handleMomentumSettled, settledStep)
      },
    },
    [
      frameWidth,
      scrollProgress,
      lastWorkletStep,
      clearProgrammaticTarget,
      handleStepThresholdCrossed,
      handleMomentumSettled,
    ]
  )

  const handleCtaPress = async () => {
    if (currentStep < 2) {
      scrollToStep((currentStep + 1) as OnboardingStepIndex, true)
      return
    }

    if (isCompleting) return
    setIsCompleting(true)
    try {
      const targetRoute = await completeOnboarding({
        storage: appStorage,
        authSeam: getAuthSeam(),
      })
      router.replace(targetRoute as never)
    } finally {
      setIsCompleting(false)
    }
  }

  const activeSlide = ONBOARDING_SLIDES[currentStep]

  return (
    <View style={styles.root}>
      <AmbientPastelBackdrop
        scrollProgress={scrollProgress}
        frameWidth={frameWidth}
        stageOffsetX={stageOffsetX}
      />

      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.safeContainer, { width: frameWidth }]}
      >
        <View style={styles.pagerContainer} onLayout={handleLayout}>
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={scrollHandler}
            style={styles.scrollView}
          >
            <View style={{ width: frameWidth, flex: 1 }}>
              <Step1SlideContent compactScale={compactScale} />
            </View>
            <View style={{ width: frameWidth, flex: 1 }}>
              <Step2SlideContent compactScale={compactScale} />
            </View>
            <View style={{ width: frameWidth, flex: 1 }}>
              <Step3SlideContent />
            </View>
          </Animated.ScrollView>
        </View>

        {/* Bottom Anchor (Thumb Zone) */}
        <View style={styles.bottomBar}>
          <PaginationDots
            total={ONBOARDING_SLIDES.length}
            currentStep={currentStep}
            onSelectStep={(step) => scrollToStep(step, true)}
          />

          <Button
            variant="primary"
            size="lg"
            isLoading={isCompleting}
            onPress={handleCtaPress}
            style={styles.ctaButton}
            rightIcon={
              activeSlide.showArrowRightIcon ? (
                <Icon name="arrow-right" size="sm" strokeColor="#FFFFFF" />
              ) : undefined
            }
          >
            {activeSlide.ctaLabel}
          </Button>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
    alignItems: 'center',
  },
  safeContainer: {
    flex: 1,
  },
  pagerContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 18,
  },
  ctaButton: {
    width: '100%',
    alignSelf: 'stretch',
  },
})
