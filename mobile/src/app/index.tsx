// [S01] Splash - App Launch (01 - Splash - App Launch)
// Runs Preflight Pipeline (Network + Server Health + Preparers + Session) with GPU translateX bar
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import {
  AmbientPastelBackdrop,
  FramedBrandLogo,
} from '../components/onboarding'
import { SPLASH_COPY } from '../modules/onboarding'
import { runLaunchPreflightRuntime } from '../modules/onboarding/startupRuntime'
import { KITSUNE_COLORS } from '../theme/tokens'

const PROGRESS_TRACK_WIDTH = 120
const FINAL_BAR_DURATION_MS = 220
const COMPLETE_HOLD_MS = 280

export default function SplashScreen() {
  const router = useRouter()
  const { width, height } = useWindowDimensions()

  const [statusText, setStatusText] = useState<string>('Checking connection...')

  const heroOpacity = useSharedValue(0)
  const heroScale = useSharedValue(0.94)
  // Start fully off-left (-120) so GPU translateX cleanly fills 0% -> 100% on Fabric
  const progressTranslateX = useSharedValue(-PROGRESS_TRACK_WIDTH)

  const frameWidth = width <= 440 ? width : 390
  const logoScale = height < 740 ? 0.88 : 1

  useEffect(() => {
    let isCancelled = false
    let holdTimerId: ReturnType<typeof setTimeout> | undefined

    heroOpacity.set(
      withTiming(1, { duration: 480, easing: Easing.out(Easing.quad) })
    )
    heroScale.set(
      withTiming(1, { duration: 520, easing: Easing.out(Easing.back(1.2)) })
    )

    runLaunchPreflightRuntime({
      minDisplayMs: SPLASH_COPY.minimumDisplayMs,
      onProgress: (event) => {
        if (isCancelled) return
        setStatusText(event.statusText)

        // Glide smoothly up to 92% while waiting out minimum splash display window
        const visualProgress =
          event.stage === 'prepare'
            ? 0.92
            : Math.max(0, Math.min(1, event.progress))
        const targetX = -(1 - visualProgress) * PROGRESS_TRACK_WIDTH
        const duration =
          event.stage === 'prepare'
            ? 750
            : event.stage === 'session'
              ? FINAL_BAR_DURATION_MS
              : 260

        progressTranslateX.set(
          withTiming(targetX, {
            duration,
            easing: Easing.out(Easing.cubic),
          })
        )
      },
    })
      .then((result) => {
        if (isCancelled) return
        holdTimerId = setTimeout(() => {
          if (!isCancelled) {
            router.replace(result.targetRoute as never)
          }
        }, COMPLETE_HOLD_MS)
      })
      .catch(() => {
        if (!isCancelled) {
          router.replace('/(onboarding)/step-1' as never)
        }
      })

    return () => {
      isCancelled = true
      if (holdTimerId !== undefined) {
        clearTimeout(holdTimerId)
      }
    }
  }, [heroOpacity, heroScale, progressTranslateX, router])

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }))

  const progressBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progressTranslateX.value }],
  }))

  return (
    <View style={styles.root}>
      <AmbientPastelBackdrop preset="splash" showPetals />

      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.safeContainer, { width: frameWidth }]}
      >
        <View style={styles.centerZone}>
          <Animated.View style={[styles.brandCluster, heroAnimatedStyle]}>
            <FramedBrandLogo variant="splash" scale={logoScale} />

            <Text style={styles.wordmark}>{SPLASH_COPY.wordmark}</Text>
            <Text style={styles.tagline}>{SPLASH_COPY.tagline}</Text>
          </Animated.View>
        </View>

        <View style={styles.bottomZone}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressBarStyle]} />
          </View>
          <Text style={styles.statusText}>{statusText}</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  centerZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCluster: {
    alignItems: 'center',
  },
  wordmark: {
    marginTop: 20,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.7,
    color: KITSUNE_COLORS.plumInk,
  },
  tagline: {
    marginTop: 6,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(38, 19, 51, 0.70)',
  },
  bottomZone: {
    alignItems: 'center',
    paddingBottom: 28,
    gap: 14,
  },
  progressTrack: {
    width: PROGRESS_TRACK_WIDTH,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(169, 212, 232, 0.40)',
    overflow: 'hidden',
  },
  progressFill: {
    width: PROGRESS_TRACK_WIDTH,
    height: 6,
    borderRadius: 3,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  statusText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12.5,
    color: 'rgba(38, 19, 51, 0.55)',
  },
})
