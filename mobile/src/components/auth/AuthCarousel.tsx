import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  BackHandler,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import * as Haptics from 'expo-haptics'
import {
  authKeyFromStep,
  authStepFromKey,
  clampAuthProgress,
  type AuthScreenKey,
  type AuthScreenStep,
  type LegalDocumentTab,
} from '../../modules/auth'
import { useAppNavigation } from '../../navigation'
import { KITSUNE_COLORS, KITSUNE_RADII } from '../../theme/tokens'
import { AuthFormSkeleton, ServiceStateCard } from '../ui/feedback'
import { Icon } from '../ui/icons'
import { AuthAmbientBackdrop } from './AuthAmbientBackdrop'
import {
  ConnectionInspectorModal,
  ForgotPasswordModal,
  TermsPrivacyModal,
} from './AuthSupportModals'
import { AuthTopBar } from './AuthTopBar'
import { CreateAccountPane } from './CreateAccountPane'
import { SignInPane } from './SignInPane'
import { useAuthScreenState } from './useAuthScreenState'
import { useWebAuthPager } from './useWebAuthPager'

export interface AuthCarouselProps {
  initialScreen: AuthScreenKey
}

/**
 * Unified 60-120 FPS interactive horizontal pager unifying Screen 05 (Sign In) & Screen 06 (Create Account).
 * Supports finger swipe gestures on mobile, desktop pointer drag on Web, button switches, synchronized
 * transparent header + title crossfade, falling Sakura petals, feathered glow clouds, parallax micro-elements,
 * and Resilience fallback states.
 */
export const AuthCarousel: React.FC<AuthCarouselProps> = ({ initialScreen }) => {
  const nav = useAppNavigation()
  const auth = useAuthScreenState()
  const { width } = useWindowDimensions()
  const frameWidth = width <= 440 ? width : 390

  const initialStep = authStepFromKey(initialScreen)
  const [trackedInitialScreen, setTrackedInitialScreen] =
    useState<AuthScreenKey>(initialScreen)
  const [activeStep, setActiveStep] = useState<AuthScreenStep>(initialStep)
  if (trackedInitialScreen !== initialScreen) {
    setTrackedInitialScreen(initialScreen)
    setActiveStep(authStepFromKey(initialScreen))
  }

  const activeStepRef = useRef<AuthScreenStep>(initialStep)
  const programmaticTargetRef = useRef<AuthScreenStep | null>(null)
  const lastFrameWidthRef = useRef<number>(frameWidth)
  const hasAlignedInitialRef = useRef<boolean>(initialStep === 0)
  const webSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scrollRef = useRef<Animated.ScrollView | null>(null)
  const scrollProgress = useSharedValue<number>(initialStep)

  const [forgotModalState, setForgotModalState] = useState<{
    open: boolean
    initialEmail: string
  }>({ open: false, initialEmail: '' })
  const [legalTab, setLegalTab] = useState<LegalDocumentTab | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [demoSignals, setDemoSignals] = useState({
    signIn: 0,
    createAccount: 0,
  })

  const isReady = auth.availability.status === 'ready'

  const alignPagerToStep = useCallback(
    (step: AuthScreenStep, animated: boolean) => {
      if (frameWidth <= 0) return
      scrollRef.current?.scrollTo({
        x: step * frameWidth,
        animated,
      })
    },
    [frameWidth]
  )

  useEffect(() => {
    const nextStep = authStepFromKey(initialScreen)
    activeStepRef.current = nextStep
    scrollProgress.set(nextStep)
    alignPagerToStep(nextStep, false)
  }, [initialScreen, alignPagerToStep, scrollProgress])

  useEffect(() => {
    if (lastFrameWidthRef.current !== frameWidth) {
      lastFrameWidthRef.current = frameWidth
      alignPagerToStep(activeStepRef.current, false)
    }
  }, [frameWidth, alignPagerToStep])

  useEffect(() => {
    return () => {
      if (webSettleTimerRef.current) {
        clearTimeout(webSettleTimerRef.current)
      }
    }
  }, [])

  const handleUserDragStart = useCallback(() => {
    Keyboard.dismiss()
    programmaticTargetRef.current = null
  }, [])

  const clearProgrammaticTarget = useCallback(() => {
    programmaticTargetRef.current = null
  }, [])

  const handleStepThresholdCrossed = useCallback((nextStep: AuthScreenStep) => {
    if (activeStepRef.current === nextStep) return
    activeStepRef.current = nextStep
    setActiveStep(nextStep)
    void Haptics.selectionAsync().catch(() => {})
  }, [])

  const handleMomentumSettled = useCallback((settledStep: AuthScreenStep) => {
    programmaticTargetRef.current = null
    if (activeStepRef.current !== settledStep) {
      activeStepRef.current = settledStep
      setActiveStep(settledStep)
    }
  }, [])

  const scrollToScreen = useCallback(
    (targetStep: AuthScreenStep) => {
      Keyboard.dismiss()
      if (!isReady) {
        activeStepRef.current = targetStep
        setActiveStep(targetStep)
        scrollProgress.set(targetStep)
        return
      }

      if (targetStep === activeStepRef.current) {
        alignPagerToStep(targetStep, true)
        return
      }

      programmaticTargetRef.current = targetStep
      activeStepRef.current = targetStep
      setActiveStep(targetStep)
      void Haptics.selectionAsync().catch(() => {})
      alignPagerToStep(targetStep, true)

      if (Platform.OS === 'web') {
        if (webSettleTimerRef.current) {
          clearTimeout(webSettleTimerRef.current)
        }
        // Guarantees final progress locks cleanly to target even if Web smooth scroll skips intermediate ticks
        webSettleTimerRef.current = setTimeout(() => {
          programmaticTargetRef.current = null
          scrollProgress.set(targetStep)
        }, 340)
      }
    },
    [alignPagerToStep, isReady, scrollProgress]
  )

  const handleWebProgressSync = useCallback(
    (_progress: number, roundedStep: AuthScreenStep) => {
      const target = programmaticTargetRef.current
      if (target === null || roundedStep === target) {
        if (target !== null && Math.abs(_progress - target) < 0.02) {
          programmaticTargetRef.current = null
        }
        handleStepThresholdCrossed(roundedStep)
      }
    },
    [handleStepThresholdCrossed]
  )

  const { hostRef: webPagerHostRef } = useWebAuthPager({
    enabled: isReady,
    frameWidth,
    scrollProgress,
    activeStepRef,
    onProgressSync: handleWebProgressSync,
    onRequestSnapToStep: (targetStep) => {
      programmaticTargetRef.current = targetStep
      activeStepRef.current = targetStep
      setActiveStep(targetStep)
      alignPagerToStep(targetStep, true)
      if (webSettleTimerRef.current) {
        clearTimeout(webSettleTimerRef.current)
      }
      webSettleTimerRef.current = setTimeout(() => {
        programmaticTargetRef.current = null
        scrollProgress.set(targetStep)
      }, 320)
    },
  })

  const handleBackNavigation = useCallback(() => {
    Keyboard.dismiss()
    if (activeStepRef.current === 1) {
      scrollToScreen(0)
      return true
    }
    nav.goBack()
    return true
  }, [nav, scrollToScreen])

  useEffect(() => {
    if (Platform.OS === 'web') return undefined
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackNavigation
    )
    return () => subscription.remove()
  }, [handleBackNavigation])

  const scrollHandler = useAnimatedScrollHandler(
    {
      onBeginDrag: () => {
        scheduleOnRN(handleUserDragStart)
      },
      onScroll: (event) => {
        if (frameWidth <= 0) return
        const nextProgress = clampAuthProgress(event.contentOffset.x / frameWidth)
        scrollProgress.set(nextProgress)

        const roundedStep: AuthScreenStep = nextProgress >= 0.5 ? 1 : 0
        const target = programmaticTargetRef.current

        if (target === null || roundedStep === target) {
          if (target !== null && Math.abs(nextProgress - target) < 0.02) {
            scheduleOnRN(clearProgrammaticTarget)
          }
          scheduleOnRN(handleStepThresholdCrossed, roundedStep)
        }
      },
      onMomentumEnd: (event) => {
        if (frameWidth <= 0) return
        const progress = clampAuthProgress(event.contentOffset.x / frameWidth)
        const settledStep: AuthScreenStep = progress >= 0.5 ? 1 : 0
        scrollProgress.set(settledStep)
        scheduleOnRN(handleMomentumSettled, settledStep)
      },
    },
    [
      frameWidth,
      scrollProgress,
      handleUserDragStart,
      clearProgrammaticTarget,
      handleStepThresholdCrossed,
      handleMomentumSettled,
    ]
  )

  const handleWebMomentumFallback = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (Platform.OS !== 'web' || frameWidth <= 0) return
      const offsetX = event.nativeEvent.contentOffset.x
      const progress = clampAuthProgress(offsetX / frameWidth)
      scrollProgress.set(progress)
      const settled: AuthScreenStep = progress >= 0.5 ? 1 : 0
      handleMomentumSettled(settled)
    },
    [frameWidth, handleMomentumSettled, scrollProgress]
  )

  const handlePagerContentSizeChange = useCallback(
    (contentWidth: number) => {
      if (hasAlignedInitialRef.current || frameWidth <= 0) return
      if (contentWidth >= frameWidth * 1.9) {
        hasAlignedInitialRef.current = true
        alignPagerToStep(activeStepRef.current, false)
      }
    },
    [alignPagerToStep, frameWidth]
  )

  const activeScreenKey = authKeyFromStep(activeStep)

  return (
    <View style={styles.viewport}>
      <View style={[styles.mobileFrame, { width: frameWidth }]}>
        <AuthAmbientBackdrop
          frameWidth={frameWidth}
          scrollProgress={scrollProgress}
          staticStep={activeStep}
        />

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <AuthTopBar
            scrollProgress={scrollProgress}
            activeStep={activeStep}
            onPressBack={() => {
              void handleBackNavigation()
            }}
            onSelectStep={scrollToScreen}
            showSwipeIndicator={isReady}
          />

          {auth.previewOverride !== 'auto' ? (
            <View style={styles.previewBannerHost}>
              <Pressable
                onPress={() => auth.setPreviewOverride('auto')}
                accessibilityRole="button"
                accessibilityLabel="Exit state preview and return to auto mode"
                style={styles.previewBanner}
              >
                <Icon
                  name="sparkles"
                  size={14}
                  strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
                />
                <Text style={styles.previewBannerText}>
                  Preview: {auth.previewOverride.replace('_', ' ')} — Tap to return to Auto
                </Text>
              </Pressable>
            </View>
          ) : null}

          {!isReady ? (
            <ScrollView
              style={styles.flexOne}
              contentContainerStyle={styles.resilienceScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {auth.availability.status === 'loading' && (
                <AuthFormSkeleton variant={activeScreenKey} />
              )}

              {auth.availability.status === 'offline' && (
                <ServiceStateCard
                  kind="offline"
                  onRetry={auth.handleRetry}
                  onContinueDemo={auth.handleContinueInDemo}
                  isRetrying={auth.isRetrying}
                />
              )}

              {auth.availability.status === 'server_error' && (
                <ServiceStateCard
                  kind="server_error"
                  onRetry={auth.handleRetry}
                  onContinueDemo={auth.handleContinueInDemo}
                  isRetrying={auth.isRetrying}
                  customSubtitle={auth.availability.detail}
                />
              )}
            </ScrollView>
          ) : (
            <View ref={webPagerHostRef} style={styles.flexOne}>
              <Animated.ScrollView
                ref={scrollRef}
                style={styles.flexOne}
                horizontal
                pagingEnabled
                contentOffset={{ x: initialStep * frameWidth, y: 0 }}
                snapToInterval={frameWidth}
                snapToAlignment="start"
                decelerationRate="fast"
                bounces={false}
                directionalLockEnabled
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={16}
                onScroll={Platform.OS === 'web' ? undefined : scrollHandler}
                onMomentumScrollEnd={handleWebMomentumFallback}
                onContentSizeChange={handlePagerContentSizeChange}
                accessibilityRole="adjustable"
                accessibilityLabel="Authentication pages"
              >
                <SignInPane
                  width={frameWidth}
                  scrollProgress={scrollProgress}
                  fillDemoSignal={demoSignals.signIn}
                  onSwitchToCreateAccount={() => scrollToScreen(1)}
                  onOpenLegal={(tab) => setLegalTab(tab)}
                  onOpenForgotPassword={(currentEmail) =>
                    setForgotModalState({
                      open: true,
                      initialEmail: currentEmail,
                    })
                  }
                  onOpenInspector={() => setInspectorOpen(true)}
                  onAuthSuccess={auth.navigateAfterAuth}
                  onServiceErrorCode={auth.setLastErrorCode}
                />

                <CreateAccountPane
                  width={frameWidth}
                  scrollProgress={scrollProgress}
                  fillDemoSignal={demoSignals.createAccount}
                  onSwitchToSignIn={() => scrollToScreen(0)}
                  onOpenLegal={(tab) => setLegalTab(tab)}
                  onOpenInspector={() => setInspectorOpen(true)}
                  onAuthSuccess={auth.navigateAfterAuth}
                  onServiceErrorCode={auth.setLastErrorCode}
                />
              </Animated.ScrollView>
            </View>
          )}
        </SafeAreaView>
      </View>

      <ForgotPasswordModal
        visible={forgotModalState.open}
        initialEmail={forgotModalState.initialEmail}
        onClose={() =>
          setForgotModalState((prev) => ({ ...prev, open: false }))
        }
      />

      <TermsPrivacyModal
        visible={legalTab !== null}
        initialTab={legalTab ?? 'terms'}
        onClose={() => setLegalTab(null)}
      />

      <ConnectionInspectorModal
        visible={inspectorOpen}
        isOnline={auth.isOnline}
        authMode={auth.authMode}
        gatewayUrl={auth.gatewayUrl}
        previewOverride={auth.previewOverride}
        onChangePreviewOverride={auth.setPreviewOverride}
        onChangeAuthMode={auth.changeAuthMode}
        onFillDemoCredentials={() =>
          setDemoSignals((prev) =>
            activeStepRef.current === 0
              ? { ...prev, signIn: prev.signIn + 1 }
              : { ...prev, createAccount: prev.createAccount + 1 }
          )
        }
        onTriggerSkeletonCheck={() => auth.replaySkeleton(900)}
        onClose={() => setInspectorOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
    alignItems: 'center',
  },
  mobileFrame: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
    position: 'relative',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flexOne: {
    flex: 1,
  },
  previewBannerHost: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(244, 127, 114, 0.35)',
    marginBottom: 8,
  },
  previewBannerText: {
    fontSize: 12,
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_700Bold',
    textTransform: 'capitalize',
  },
  resilienceScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
})
