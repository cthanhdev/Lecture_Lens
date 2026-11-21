export type PlusPlanId = 'yearly' | 'monthly'

export interface PlusPlanSpec {
  readonly id: PlusPlanId
  readonly label: string
  readonly priceUsd: number
  readonly billingUnit: '/yr' | '/mo'
  readonly periodNoun: 'year' | 'month'
}

export interface FreeUsageQuota {
  readonly usedHours: number
  readonly quotaHours: number
}

export interface PaywallFeatureItem {
  readonly id: string
  readonly label: string
}

export interface PaywallPlanCardViewModel {
  readonly id: PlusPlanId
  readonly label: string
  readonly priceText: string
  readonly billingUnit: '/yr' | '/mo'
  readonly secondaryText: string
  readonly badgeText: string | null
  readonly selected: boolean
}

export interface PaywallViewModel {
  readonly badgeLabel: string
  readonly headline: string
  readonly subtitle: string
  readonly planPillLabel: string
  readonly usageLabel: string
  readonly usageSuffix: string
  readonly remainingLabel: string
  readonly usageRatio: number
  readonly bestValueBadge: string
  readonly features: readonly PaywallFeatureItem[]
  readonly plans: readonly PaywallPlanCardViewModel[]
  readonly ctaLabel: string
  readonly ctaDisabled: boolean
  readonly offlineNotice: string | null
  readonly footnote: string
}

export const PLUS_PLANS: readonly PlusPlanSpec[] = [
  {
    id: 'yearly',
    label: 'YEARLY',
    priceUsd: 39.99,
    billingUnit: '/yr',
    periodNoun: 'year',
  },
  {
    id: 'monthly',
    label: 'MONTHLY',
    priceUsd: 5.99,
    billingUnit: '/mo',
    periodNoun: 'month',
  },
] as const

export const PAYWALL_FEATURES: readonly PaywallFeatureItem[] = [
  { id: 'unlimited-asr', label: 'Unlimited transcription hours' },
  { id: 'ai-summaries', label: 'AI summaries and likely exam questions' },
  { id: 'offline-downloads', label: 'Offline downloads' },
  { id: 'export-pdf-notion', label: 'Export to PDF and Notion' },
] as const

export function computeSavingsPercent(
  yearlyPriceUsd: number,
  monthlyPriceUsd: number,
): number {
  const annualizedMonthly = monthlyPriceUsd * 12
  if (annualizedMonthly <= 0) return 0
  const ratio = 1 - yearlyPriceUsd / annualizedMonthly
  return Math.max(0, Math.round(ratio * 100))
}

export function perMonthPriceLabel(yearlyPriceUsd: number): string {
  const perMonth = yearlyPriceUsd / 12
  return `$${perMonth.toFixed(2)}/mo`
}

export interface ResolvePaywallInput {
  readonly usage: FreeUsageQuota
  readonly selectedPlanId: PlusPlanId
  readonly isOffline: boolean
}

export function resolvePaywallViewModel(
  input: ResolvePaywallInput,
): PaywallViewModel {
  const yearly = PLUS_PLANS.find((p) => p.id === 'yearly')!
  const monthly = PLUS_PLANS.find((p) => p.id === 'monthly')!
  const savings = computeSavingsPercent(yearly.priceUsd, monthly.priceUsd)
  const bestValueBadge = `Best value · Save ${savings}%`

  const safeQuota = Math.max(1, input.usage.quotaHours)
  const safeUsed = Math.min(safeQuota, Math.max(0, input.usage.usedHours))
  const remaining = Math.max(0, Number((safeQuota - safeUsed).toFixed(1)))
  const usageRatio = Math.min(1, Math.max(0, safeUsed / safeQuota))

  const selectedPlan =
    PLUS_PLANS.find((p) => p.id === input.selectedPlanId) ?? yearly

  const plans: PaywallPlanCardViewModel[] = PLUS_PLANS.map((plan) => ({
    id: plan.id,
    label: plan.label,
    priceText: `$${plan.priceUsd.toFixed(2)}`,
    billingUnit: plan.billingUnit,
    secondaryText:
      plan.id === 'yearly'
        ? perMonthPriceLabel(plan.priceUsd)
        : 'Billed monthly',
    badgeText: plan.id === 'yearly' ? bestValueBadge : null,
    selected: plan.id === input.selectedPlanId,
  }))

  return {
    badgeLabel: 'Kitsune Plus',
    headline: 'Never miss a word of lecture',
    subtitle: 'Unlock unlimited transcription and smarter review.',
    planPillLabel: 'Free plan',
    usageLabel: `${safeUsed} of ${safeQuota} free hours`,
    usageSuffix: 'used',
    remainingLabel: `${remaining} hours left`,
    usageRatio,
    bestValueBadge,
    features: PAYWALL_FEATURES,
    plans,
    ctaLabel: 'Start 7-day free trial',
    ctaDisabled: input.isOffline,
    offlineNotice: input.isOffline ? 'Connect to the internet to subscribe.' : null,
    footnote: `7 days free, then $${selectedPlan.priceUsd.toFixed(2)}/${selectedPlan.periodNoun}. Cancel anytime in Settings.`,
  }
}
