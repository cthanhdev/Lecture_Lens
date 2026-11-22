import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  clamp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import * as Haptics from 'expo-haptics'
import { useAppNavigation } from '../../navigation/NavigationContext'
import { normalizeNavigationRoute } from '../../navigation/navigationHistory'
import { KITSUNE_COLORS, KITSUNE_MOTION } from '../../theme/tokens'
import { FLOATING_TAB_SLOTS, type FloatingTabId } from './tabBarModel'

const ORDERED_TAB_ROUTES: readonly {
  readonly id: FloatingTabId
  readonly route: string
  readonly normalized: string
}[] = [...FLOATING_TAB_SLOTS.left, ...FLOATING_TAB_SLOTS.right].map((tab) => ({
  id: tab.id,
  route: tab.route,
  normalized: normalizeNavigationRoute(tab.route),
}))

const SWIPE_ACTIVATE_OFFSET_PX = 20
const VERTICAL_SCROLL_FAIL_OFFSET_PX = 12
const SWIPE_COMMIT_WIDTH_RATIO = 0.22
const SWIPE_COMMIT_VELOCITY_PX_S = 450

const BOOK_MOTION = KITSUNE_MOTION.bookPageTurn
const REDUCED_DURATION_MS = KITSUNE_MOTION.reducedMotion.durationMs
const BOOK_EASING = Easing.bezier(
  BOOK_MOTION.easingBezier[0],
  BOOK_MOTION.easingBezier[1],
  BOOK_MOTION.easingBezier[2],
  BOOK_MOTION.easingBezier[3],
)

interface BookPagePagerProps {
  readonly children: React.ReactNode
}

export function BookPagePager({ children }: BookPagePagerProps) {
  const nav = useAppNavigation()
  const reducedMotion = useReducedMotion()
  const { width: windowWidth } = useWindowDimensions()

  const pageWidth = windowWidth > 0 ? windowWidth : 390
  const normalizedCurrent = normalizeNavigationRoute(nav.currentRoute || '/home')
  const previousNormalizedRef = useRef<string>(normalizedCurrent)

  // Shared animation values (driven via .get() / .set() for Reanimated + React Compiler safety)
  const pageProgress = useSharedValue(1)
  const transitionSign = useSharedValue(1) // +1 forward, -1 back
  const dragX = useSharedValue(0)
  const isReducedMotionSV = useSharedValue(Boolean(reducedMotion))

  useEffect(() => {
    isReducedMotionSV.set(Boolean(reducedMotion))
  }, [isReducedMotionSV, reducedMotion])

  // Trigger page-turn animation on route changes using NavigationHistoryTracker direction
  useEffect(() => {
    if (normalizedCurrent === previousNormalizedRef.current) {
      return
    }
    previousNormalizedRef.current = normalizedCurrent

    const dirSign = nav.transitionDirection === 'back' ? -1 : 1
    transitionSign.set(dirSign)
    dragX.set(0)

    if (reducedMotion) {
      pageProgress.set(1)
      return
    }

    pageProgress.set(0)
    pageProgress.set(
      withTiming(1, {
        duration: BOOK_MOTION.durationMs,
        easing: BOOK_EASING,
      }),
    )
  }, [
    dragX,
    nav.transitionDirection,
    normalizedCurrent,
    pageProgress,
    reducedMotion,
    transitionSign,
  ])

  const currentTabIndex = ORDERED_TAB_ROUTES.findIndex(
    (tab) => tab.normalized === normalizedCurrent,
  )
  const nextTabRoute =
    currentTabIndex >= 0 && currentTabIndex < ORDERED_TAB_ROUTES.length - 1
      ? (ORDERED_TAB_ROUTES[currentTabIndex + 1]?.route ?? null)
      : null

  const canSwipeBack = nav.canGoBack || normalizedCurrent !== '/home'
  const canSwipeForward = nextTabRoute !== null

  const handleSwipeBack = useCallback(() => {
    if (!canSwipeBack) return
    Haptics.selectionAsync().catch(() => {})
    nav.goBack()
  }, [canSwipeBack, nav])

  const handleSwipeForward = useCallback(() => {
    if (!nextTabRoute) return
    Haptics.selectionAsync().catch(() => {})
    nav.goTo(nextTabRoute)
  }, [nav, nextTabRoute])

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-SWIPE_ACTIVATE_OFFSET_PX, SWIPE_ACTIVATE_OFFSET_PX])
        .failOffsetY([
          -VERTICAL_SCROLL_FAIL_OFFSET_PX,
          VERTICAL_SCROLL_FAIL_OFFSET_PX,
        ])
        .onUpdate((event) => {
          if (isReducedMotionSV.get()) {
            return
          }
          const rawDx = event.translationX
          const resistedDx =
            (rawDx > 0 && !canSwipeBack) || (rawDx < 0 && !canSwipeForward)
              ? rawDx * BOOK_MOTION.underlayParallaxFactor
              : rawDx
          dragX.set(clamp(resistedDx, -pageWidth * 0.6, pageWidth * 0.6))
        })
        .onEnd((event) => {
          const threshold = pageWidth * SWIPE_COMMIT_WIDTH_RATIO
          const swipedRight =
            event.translationX > threshold ||
            event.velocityX > SWIPE_COMMIT_VELOCITY_PX_S
          const swipedLeft =
            event.translationX < -threshold ||
            event.velocityX < -SWIPE_COMMIT_VELOCITY_PX_S

          if (swipedRight && canSwipeBack) {
            dragX.set(0)
            scheduleOnRN(handleSwipeBack)
            return
          }

          if (swipedLeft && canSwipeForward) {
            dragX.set(0)
            scheduleOnRN(handleSwipeForward)
            return
          }

          const settleDuration = isReducedMotionSV.get()
            ? REDUCED_DURATION_MS
            : BOOK_MOTION.durationMs
          dragX.set(
            withTiming(0, {
              duration: settleDuration,
              easing: BOOK_EASING,
            }),
          )
        }),
    [
      canSwipeBack,
      canSwipeForward,
      dragX,
      handleSwipeBack,
      handleSwipeForward,
      isReducedMotionSV,
      pageWidth,
    ],
  )

  const pageAnimatedStyle = useAnimatedStyle(() => {
    if (isReducedMotionSV.get()) {
      return {
        opacity: pageProgress.value,
      }
    }

    const progress = pageProgress.value
    const remaining = 1 - progress
    const dragOffset = dragX.value
    const dragRatio = pageWidth > 0 ? clamp(dragOffset / pageWidth, -1, 1) : 0

    const routeTranslateX = transitionSign.value * remaining * pageWidth
    const routeRotateYDeg =
      transitionSign.value * remaining * BOOK_MOTION.incomingRotateYDeg
    const dragRotateYDeg =
      dragRatio * Math.abs(BOOK_MOTION.incomingRotateYDeg)

    const scaleFloor = BOOK_MOTION.underlayMinScale
    const routeScale = scaleFloor + progress * (1 - scaleFloor)
    const dragScale = 1 - Math.abs(dragRatio) * (1 - scaleFloor)

    return {
      transform: [
        { perspective: BOOK_MOTION.perspective },
        { translateX: routeTranslateX + dragOffset },
        { rotateY: `${routeRotateYDeg + dragRotateYDeg}deg` },
        { scale: routeScale * dragScale },
      ],
    }
  }, [pageWidth])

  const spineShadowAnimatedStyle = useAnimatedStyle(() => {
    if (isReducedMotionSV.get()) {
      return { opacity: 0 }
    }

    const progress = pageProgress.value
    const dragRatio = pageWidth > 0 ? Math.abs(dragX.value / pageWidth) : 0
    const turnShadow =
      Math.sin(Math.PI * progress) * BOOK_MOTION.spineShadowMaxOpacity
    const dragShadow = dragRatio * BOOK_MOTION.spineShadowMaxOpacity

    return {
      opacity: Math.max(turnShadow, dragShadow),
    }
  }, [pageWidth])

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.stage}>
        <Animated.View style={[styles.pageSurface, pageAnimatedStyle]}>
          {children}
          <Animated.View
            pointerEvents="none"
            style={[styles.spineShadow, spineShadowAnimatedStyle]}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
    overflow: 'hidden',
  },
  pageSurface: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
  },
  spineShadow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: KITSUNE_COLORS.plumInk,
  },
})
