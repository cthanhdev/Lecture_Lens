// OnboardingCarousel: Unified Horizontal Swipeable Wizard for Screens 02-04
// Không dùng Skip — hỗ trợ thao tác lướt ngang mượt mà + Continue / Get started
import React, { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react'
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Button } from '../ui/button/Button'
import { Icon } from '../ui/icons/Icon'
import { AmbientPastelBackdrop, type BackdropPreset } from './AmbientPastelBackdrop'
import { PaginationDots } from './PaginationDots'
import { Step1SlideContent } from './Step1SlideContent'
import { Step2SlideContent } from './Step2SlideContent'
import { Step3SlideContent } from './Step3SlideContent'
import {
  ONBOARDING_SLIDES,
  clampOnboardingStep,
  completeOnboarding,
  type OnboardingStepIndex,
} from '../../modules/onboarding'
import { appStorage } from '../../modules/storage'
import { getAuthSeam } from '../../modules/auth'
import { KITSUNE_COLORS } from '../../theme/tokens'

const BACKDROP_PRESETS: readonly BackdropPreset[] = ['step1', 'step2', 'step3']

interface OnboardingCarouselProps {
  initialStep?: OnboardingStepIndex
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  initialStep = 0,
}) => {
  const router = useRouter()
  const { width, height } = useWindowDimensions()
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null)
  const programmaticTargetRef = useRef<OnboardingStepIndex | null>(null)
  const didApplyInitialScrollRef = useRef(false)

  const [currentStep, setCurrentStep] = useState<OnboardingStepIndex>(initialStep)
  const [isCompleting, setIsCompleting] = useState(false)

  // Khung tham chiếu di động 390px (AGENTS.md) trên màn hình lớn, tràn viền trên điện thoại
  const frameWidth = width <= 440 ? width : 390
  const compactScale = height < 740 ? 0.84 : width < 370 ? 0.9 : 1

  const scrollToStep = useCallback(
    (targetStep: OnboardingStepIndex, animated = true) => {
      const clamped = clampOnboardingStep(targetStep)
      programmaticTargetRef.current = animated ? clamped : null
      setCurrentStep(clamped)
      scrollRef.current?.scrollTo({
        x: clamped * frameWidth,
        y: 0,
        animated,
      })
    },
    [frameWidth]
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
      scrollRef.current?.scrollTo({
        x: initialStep * frameWidth,
        y: 0,
        animated: false,
      })
    }
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x
    if (frameWidth <= 0) return
    const nextStep = clampOnboardingStep(Math.round(offsetX / frameWidth))

    if (programmaticTargetRef.current !== null) {
      if (nextStep === programmaticTargetRef.current) {
        programmaticTargetRef.current = null
      }
      return
    }

    if (nextStep !== currentStep) {
      setCurrentStep(nextStep)
      Haptics.selectionAsync().catch(() => {})
    }
  }

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    programmaticTargetRef.current = null
    if (frameWidth <= 0) return
    const settled = clampOnboardingStep(
      Math.round(event.nativeEvent.contentOffset.x / frameWidth)
    )
    if (settled !== currentStep) {
      setCurrentStep(settled)
    }
  }

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
  const activePreset = BACKDROP_PRESETS[currentStep]

  return (
    <View style={styles.root}>
      <AmbientPastelBackdrop preset={activePreset} />

      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.safeContainer, { width: frameWidth }]}
      >
        <View style={styles.pagerContainer} onLayout={handleLayout}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScrollBeginDrag={() => {
              programmaticTargetRef.current = null
            }}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumScrollEnd}
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
          </ScrollView>
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
