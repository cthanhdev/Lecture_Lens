import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated'
import { getFloatingTabBarClearance } from '../navigation/tabBarModel'
import { HomeHeader } from './HomeHeader'
import { GreetingRow } from './GreetingRow'
import { OfflineBanner } from './OfflineBanner'
import { HomeSearchBar } from './HomeSearchBar'
import { ContinueListeningCard } from './ContinueListeningCard'
import { DueTodayCard } from './DueTodayCard'
import { StreakCard } from './StreakCard'
import { RecentHighlightsSection } from './RecentHighlightsSection'
import { RecentlyAddedRail } from './RecentlyAddedRail'
import type {
  HomeHighlightViewModel,
  HomeRecentCardViewModel,
  HomeViewModel,
} from '../../modules/home'
import { KITSUNE_COLORS } from '../../theme/tokens'

export interface HomeDashboardProps {
  readonly vm: HomeViewModel
  readonly isPlaying: boolean
  readonly currentTimeSec: number
  readonly hasActiveCapsulePlayer: boolean
  readonly onPressNotifications: () => void
  readonly onPressProfile: () => void
  readonly onPressSearch: () => void
  readonly onOpenContinueLecture: () => void
  readonly onTogglePlayContinue: () => void
  readonly onStartReview: () => void
  readonly onSeeAllHighlights: () => void
  readonly onOpenHighlight: (item: HomeHighlightViewModel) => void
  readonly onPlayHighlight: (item: HomeHighlightViewModel) => void
  readonly onPressRecentCard: (item: HomeRecentCardViewModel) => void
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  vm,
  isPlaying,
  currentTimeSec,
  hasActiveCapsulePlayer,
  onPressNotifications,
  onPressProfile,
  onPressSearch,
  onOpenContinueLecture,
  onTogglePlayContinue,
  onStartReview,
  onSeeAllHighlights,
  onOpenHighlight,
  onPlayHighlight,
  onPressRecentCard,
}) => {
  const insets = useSafeAreaInsets()
  const bottomClearance =
    getFloatingTabBarClearance(insets.bottom) +
    (hasActiveCapsulePlayer ? 68 : 20)

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(245, 195, 201, 0.28)', KITSUNE_COLORS.washiCream, KITSUNE_COLORS.washiCream]}
        locations={[0, 0.28, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomClearance },
          ]}
        >
          <View style={styles.mobileStage}>
            <HomeHeader
              header={vm.header}
              isOffline={vm.isOffline}
              onPressNotifications={onPressNotifications}
              onPressProfile={onPressProfile}
            />

            <Animated.View
              entering={FadeInDown.delay(40).duration(280)}
              layout={LinearTransition.duration(220)}
            >
              <GreetingRow
                greeting={vm.greeting}
                dateLabel={vm.dateLabel}
                showOnlineDot={vm.showAvatarOnlineDot}
                onPressAvatar={onPressProfile}
              />
            </Animated.View>

            <OfflineBanner message={vm.offlineBannerText} />

            <Animated.View
              entering={FadeInDown.delay(90).duration(300)}
              layout={LinearTransition.duration(220)}
            >
              <HomeSearchBar
                placeholder={vm.search.placeholder}
                trailingIcon={vm.search.trailingIcon}
                hint={vm.search.hint}
                isOffline={vm.isOffline}
                onPress={onPressSearch}
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(140).duration(320)}
              layout={LinearTransition.duration(220)}
            >
              <ContinueListeningCard
                data={vm.continueListening}
                isOffline={vm.isOffline}
                isPlaying={isPlaying}
                currentTimeSec={currentTimeSec}
                onOpenLecture={onOpenContinueLecture}
                onTogglePlay={onTogglePlayContinue}
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(200).duration(320)}
              layout={LinearTransition.duration(220)}
              style={styles.bentoRow}
            >
              <DueTodayCard data={vm.dueToday} onStartReview={onStartReview} />
              <StreakCard data={vm.streak} isOffline={vm.isOffline} />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(260).duration(320)}
              layout={LinearTransition.duration(220)}
            >
              <RecentHighlightsSection
                items={vm.highlights}
                isOffline={vm.isOffline}
                onPressSeeAll={onSeeAllHighlights}
                onOpenHighlight={onOpenHighlight}
                onPlayHighlight={onPlayHighlight}
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(320).duration(320)}
              layout={LinearTransition.duration(220)}
            >
              <RecentlyAddedRail
                items={vm.recentlyAdded}
                countLabel={vm.recentlyAddedCountLabel}
                isOffline={vm.isOffline}
                onPressCard={onPressRecentCard}
              />
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  mobileStage: {
    width: '100%',
    maxWidth: 390,
    gap: 16,
  },
  bentoRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
})
