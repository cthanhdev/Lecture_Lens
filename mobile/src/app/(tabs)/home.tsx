// [S08, S09] Home - Study Hub Dashboard & Offline State
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  View,
} from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DashboardBentoSkeleton } from '../../components/ui/feedback'
import { HomeDashboard } from '../../components/home'
import { useAppNavigation } from '../../navigation/NavigationContext'
import { useAudioPlayer } from '../../modules/audio/useAudioPlayer'
import { useNetworkStatus } from '../../services/networkMonitor'
import { parsePreviewOverrideParam } from '../../modules/resilience'
import {
  MockHomeDashboardSource,
  resolveHomeViewModel,
  shouldExitOnBack,
  type HomeDashboardSnapshot,
  type HomeHighlightViewModel,
  type HomeRecentCardViewModel,
} from '../../modules/home'
import { KITSUNE_COLORS } from '../../theme/tokens'

const dashboardSource = new MockHomeDashboardSource()

export default function HomeScreen() {
  const nav = useAppNavigation()
  const router = useRouter()
  const audio = useAudioPlayer()
  const network = useNetworkStatus()
  const params = useLocalSearchParams<{
    preview?: string | string[]
    offer?: string | string[]
  }>()

  const [snapshot, setSnapshot] = useState<HomeDashboardSnapshot | null>(null)
  const handledOfferRef = useRef(false)
  const lastBackPressRef = useRef<number | null>(null)

  const previewOverride = useMemo(
    () => parsePreviewOverrideParam(params.preview),
    [params.preview],
  )

  const isOffline =
    previewOverride === 'offline' ||
    (previewOverride === 'auto' &&
      (!network.isConnected || network.isInternetReachable === false))

  useEffect(() => {
    let mounted = true
    void dashboardSource.load().then((data) => {
      if (mounted) setSnapshot(data)
    })
    return () => {
      mounted = false
    }
  }, [])

  // Handle post-Create-Account upgrade offer (S06 -> S07 -> S08) once
  useEffect(() => {
    const offer = Array.isArray(params.offer) ? params.offer[0] : params.offer
    if (offer === 'plus' && !handledOfferRef.current) {
      handledOfferRef.current = true
      nav.openSheet('paywall')
      router.setParams({ offer: undefined })
    }
  }, [nav, params.offer, router])

  // Android Tab Anchor double-back exit guard (UX Law: Home never dead-ends)
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined

      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (nav.activeSheet) {
          nav.closeSheet()
          return true
        }
        const now = Date.now()
        if (shouldExitOnBack(lastBackPressRef.current, now)) {
          return false
        }
        lastBackPressRef.current = now
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT)
        return true
      })

      return () => sub.remove()
    }, [nav]),
  )

  const vm = useMemo(() => {
    if (!snapshot) return null
    return resolveHomeViewModel(snapshot, { isOffline })
  }, [snapshot, isOffline])

  if (!vm || previewOverride === 'skeleton') {
    return (
      <SafeAreaView style={styles.skeletonRoot} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.skeletonScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.skeletonStage}>
            <DashboardBentoSkeleton />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  const continueLecture = vm.continueListening.lecture
  const isContinueActive = audio.currentTrack?.id === continueLecture.id
  const isContinuePlaying = isContinueActive && audio.isPlaying

  const handleTogglePlayContinue = () => {
    if (isContinueActive) {
      audio.togglePlay()
      return
    }
    audio.play(
      {
        id: continueLecture.id,
        title: continueLecture.title,
        subject: continueLecture.subject,
        duration: continueLecture.durationSec,
      },
      vm.continueListening.positionSec,
    )
  }

  const handlePlayHighlight = (item: HomeHighlightViewModel) => {
    if (!item.available) return
    audio.play(
      {
        id: item.lectureId,
        title: `${item.subject} Highlight`,
        subject: item.subject,
        duration: continueLecture.durationSec,
      },
      item.timestampSec,
    )
  }

  const handleOpenHighlight = (item: HomeHighlightViewModel) => {
    if (!item.available) return
    nav.goTo(`/lectures/${item.lectureId}/highlights`)
  }

  const handlePressRecentCard = (item: HomeRecentCardViewModel) => {
    if (!item.available) return
    if (item.status === 'transcribing' && item.jobId) {
      nav.goTo(`/audio/processing/${item.jobId}`)
      return
    }
    nav.goTo(`/lectures/${item.id}/transcript`)
  }

  const handlePressNotifications = () => {
    if (Platform.OS === 'android') {
      ToastAndroid.show('All study reminders are up to date.', ToastAndroid.SHORT)
      return
    }
    Alert.alert('Study Reminders', 'All study reminders are up to date.')
  }

  return (
    <HomeDashboard
      vm={vm}
      isPlaying={isContinuePlaying}
      currentTimeSec={isContinueActive ? audio.currentTime : vm.continueListening.positionSec}
      hasActiveCapsulePlayer={Boolean(audio.currentTrack)}
      onPressNotifications={handlePressNotifications}
      onPressProfile={() => nav.goTo('/(tabs)/profile')}
      onPressSearch={() => nav.openSheet('search')}
      onOpenContinueLecture={() => nav.goTo(`/lectures/${continueLecture.id}/transcript`)}
      onTogglePlayContinue={handleTogglePlayContinue}
      onStartReview={() => nav.goTo('/(tabs)/review')}
      onSeeAllHighlights={() => nav.goTo('/(tabs)/library')}
      onOpenHighlight={handleOpenHighlight}
      onPlayHighlight={handlePlayHighlight}
      onPressRecentCard={handlePressRecentCard}
    />
  )
}

const styles = StyleSheet.create({
  skeletonRoot: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
  },
  skeletonScroll: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 120,
  },
  skeletonStage: {
    width: '100%',
    maxWidth: 390,
  },
})
