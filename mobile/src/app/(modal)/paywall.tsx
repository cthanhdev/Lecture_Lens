// [S07] Paywall - Kitsune Plus Subscription
import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useAppNavigation } from '../../navigation/NavigationContext'
import { useNetworkStatus } from '../../services/networkMonitor'
import { TermsPrivacyModal } from '../../components/auth/AuthSupportModals'
import type { LegalDocumentTab } from '../../modules/auth'
import {
  getSubscriptionSeam,
  resolvePaywallViewModel,
  type FreeUsageQuota,
  type PlusPlanId,
} from '../../modules/subscription'
import {
  FeatureChecklist,
  PaywallBackdrop,
  PaywallFooter,
  PaywallHero,
  PlanOptionCard,
  UsageMeterCard,
} from '../../components/paywall'
import { KITSUNE_COLORS } from '../../theme/tokens'

export default function PaywallModal() {
  const nav = useAppNavigation()
  const network = useNetworkStatus()

  const [selectedPlanId, setSelectedPlanId] = useState<PlusPlanId>('yearly')
  const [usage, setUsage] = useState<FreeUsageQuota>({
    usedHours: 18.5,
    quotaHours: 20,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [legalTab, setLegalTab] = useState<LegalDocumentTab | null>(null)

  const isOffline =
    !network.isConnected || network.isInternetReachable === false

  useEffect(() => {
    let mounted = true
    void getSubscriptionSeam()
      .getUsage()
      .then((quota) => {
        if (mounted) setUsage(quota)
      })
    return () => {
      mounted = false
    }
  }, [])

  const vm = useMemo(
    () =>
      resolvePaywallViewModel({
        usage,
        selectedPlanId,
        isOffline,
      }),
    [usage, selectedPlanId, isOffline],
  )

  const handleStartTrial = async () => {
    if (vm.ctaDisabled || isSubmitting) return
    setStatusMessage(null)
    setIsSubmitting(true)
    try {
      const result = await getSubscriptionSeam().startTrial(selectedPlanId)
      if (result.success) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {})
        nav.closeSheet()
      } else {
        setStatusMessage(result.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRestorePurchases = async () => {
    if (isSubmitting) return
    setStatusMessage(null)
    setIsSubmitting(true)
    try {
      const result = await getSubscriptionSeam().restorePurchases()
      setStatusMessage(result.message)
      if (result.restored) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {})
        nav.closeSheet()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={styles.root}>
      <PaywallBackdrop />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mobileStage}>
            <PaywallHero
              badgeLabel={vm.badgeLabel}
              headline={vm.headline}
              subtitle={vm.subtitle}
              onClose={nav.closeSheet}
            />

            <Animated.View entering={FadeInDown.delay(80).duration(300)}>
              <UsageMeterCard
                planPillLabel={vm.planPillLabel}
                usageLabel={vm.usageLabel}
                usageSuffix={vm.usageSuffix}
                remainingLabel={vm.remainingLabel}
                usageRatio={vm.usageRatio}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(140).duration(300)}>
              <FeatureChecklist items={vm.features} />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(200).duration(300)}
              style={styles.plansRow}
            >
              {vm.plans.map((plan) => (
                <PlanOptionCard
                  key={plan.id}
                  plan={plan}
                  onSelect={() => {
                    setStatusMessage(null)
                    setSelectedPlanId(plan.id)
                  }}
                />
              ))}
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <PaywallFooter
        ctaLabel={vm.ctaLabel}
        ctaDisabled={vm.ctaDisabled}
        isSubmitting={isSubmitting}
        footnote={vm.footnote}
        statusMessage={statusMessage ?? vm.offlineNotice}
        onStartTrial={() => {
          void handleStartTrial()
        }}
        onRestorePurchases={() => {
          void handleRestorePurchases()
        }}
        onOpenTerms={() => setLegalTab('terms')}
        onOpenPrivacy={() => setLegalTab('privacy')}
      />

      <TermsPrivacyModal
        visible={legalTab !== null}
        initialTab={legalTab ?? 'terms'}
        onClose={() => setLegalTab(null)}
      />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
  },
  mobileStage: {
    width: '100%',
    maxWidth: 390,
    gap: 14,
  },
  plansRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    paddingTop: 8,
  },
})
