// [S01] Splash - App Launch (01 - Splash - App Launch)
// Tuân thủ 1:1 ảnh mẫu PNG/SVG 01 & Deep Module Launch Orchestrator
import React, { useEffect } from 'react'
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
import { SPLASH_COPY, hydrateLaunchRoute } from '../modules/onboarding'
import { appStorage } from '../modules/storage'
import { getAuthSeam } from '../modules/auth'
import { KITSUNE_COLORS } from '../theme/tokens'

const PROGRESS_TRACK_WIDTH = 120

export default function SplashScreen() {
  const router = useRouter()
  const { width, height } = useWindowDimensions()

  const heroOpacity = useSharedValue(0)
  const heroScale = useSharedValue(0.94)
  const progressWidth = useSharedValue(PROGRESS_TRACK_WIDTH * 0.35)

  const frameWidth = width <= 440 ? width : 390
  const logoScale = height < 740 ? 0.88 : 1

  useEffect(() => {
    let isCancelled = false

    heroOpacity.set(
      withTiming(1, { duration: 480, easing: Easing.out(Easing.quad) })
    )
    heroScale.set(
      withTiming(1, { duration: 520, easing: Easing.out(Easing.back(1.2)) })
    )
    progressWidth.set(
      withTiming(PROGRESS_TRACK_WIDTH, {
        duration: SPLASH_COPY.minimumDisplayMs,
        easing: Easing.inOut(Easing.cubic),
      })
    )

    const minDelay = new Promise<void>((resolve) => {
      setTimeout(resolve, SPLASH_COPY.minimumDisplayMs)
    })

    Promise.all([
      hydrateLaunchRoute({
        storage: appStorage,
        authSeam: getAuthSeam(),
      }),
      minDelay,
    ]).then(([targetRoute]) => {
      if (!isCancelled) {
        router.replace(targetRoute as never)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [heroOpacity, heroScale, progressWidth, router])

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }))

  const progressBarStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
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
          <Text style={styles.statusText}>{SPLASH_COPY.status}</Text>
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
