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

  const pageWidth =
    windowWidth > 0 ? windowWidth : BOOK_MOTION.referenceViewportWidth
  const normalizedCurrent = normalizeNavigationRoute(nav.currentRoute || '/home')
  const previousNormalizedRef = useRef<string>(normalizedCurrent)

  // Shared animation & edge-touch tracking values (via .get() / .set())
  const pageProgress = useSharedValue(1)
  const transitionSign = useSharedValue(1) // +1 forward, -1 back
  const dragX = useSharedValue(0)
  const touchOriginX = useSharedValue(0)
  const touchOriginY = useSharedValue(0)
  const isEdgeTouch = useSharedValue(false)
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

  // Restrict horizontal swipe initiation to the 36px left/right edge zones so
  // nested horizontal ScrollViews (RecentlyAddedRail, LibraryFilterBar) scroll freely.
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .onTouchesDown((event, stateManager) => {
          const touch = event.allTouches[0]
          if (!touch) {
            isEdgeTouch.set(false)
            stateManager.fail()
            return
          }
          const inLeftEdge = touch.x <= BOOK_MOTION.edgeSwipeZonePx
          const inRightEdge =
            touch.x >= pageWidth - BOOK_MOTION.edgeSwipeZonePx
          if (!inLeftEdge && !inRightEdge) {
            isEdgeTouch.set(false)
            stateManager.fail()
            return
          }
          touchOriginX.set(touch.x)
          touchOriginY.set(touch.y)
          isEdgeTouch.set(true)
        })
        .onTouchesMove((event, stateManager) => {
          if (!isEdgeTouch.get()) {
            stateManager.fail()
            return
          }
          const touch = event.allTouches[0]
          if (!touch) {
            stateManager.fail()
            return
          }
          const dx = touch.x - touchOriginX.get()
          const dy = touch.y - touchOriginY.get()
          if (Math.abs(dy) >= BOOK_MOTION.verticalScrollFailOffsetPx) {
            isEdgeTouch.set(false)
            stateManager.fail()
            return
          }
          if (
            Math.abs(dx) >= BOOK_MOTION.swipeActivateOffsetPx &&
            Math.abs(dx) > Math.abs(dy)
          ) {
            stateManager.activate()
          }
        })
        .onTouchesCancelled(() => {
          isEdgeTouch.set(false)
        })
        .onUpdate((event) => {
          if (isReducedMotionSV.get()) {
            return
          }
          const rawDx = event.translationX
          const resistedDx =
            (rawDx > 0 && !canSwipeBack) || (rawDx < 0 && !canSwipeForward)
              ? rawDx * BOOK_MOTION.underlayParallaxFactor
              : rawDx
          const maxDrag = pageWidth * BOOK_MOTION.maxDragWidthRatio
          dragX.set(clamp(resistedDx, -maxDrag, maxDrag))
        })
        .onEnd((event) => {
          isEdgeTouch.set(false)
          const threshold = pageWidth * BOOK_MOTION.swipeCommitWidthRatio
          const swipedRight =
            event.translationX > threshold ||
            event.velocityX > BOOK_MOTION.swipeCommitVelocityPxS
          const swipedLeft =
            event.translationX < -threshold ||
            event.velocityX < -BOOK_MOTION.swipeCommitVelocityPxS

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
      isEdgeTouch,
      isReducedMotionSV,
      pageWidth,
      touchOriginX,
      touchOriginY,
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
