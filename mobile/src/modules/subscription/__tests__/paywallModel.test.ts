import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  PLUS_PLANS,
  PAYWALL_FEATURES,
  computeSavingsPercent,
  perMonthPriceLabel,
  resolvePaywallViewModel,
} from '../paywallModel.ts'
import { MockSubscriptionAdapter } from '../subscriptionSeam.ts'

describe('Subscription Paywall Model & Seam (S07 Kitsune Plus)', () => {
  it('computes annual savings percent and per-month price accurately', () => {
    const yearly = PLUS_PLANS.find((p) => p.id === 'yearly')!
    const monthly = PLUS_PLANS.find((p) => p.id === 'monthly')!

    assert.equal(computeSavingsPercent(yearly.priceUsd, monthly.priceUsd), 44)
    assert.equal(perMonthPriceLabel(yearly.priceUsd), '$3.33/mo')
  })

  it('resolves Paywall view model with usage progress, checklist, and plan-dependent footnote', () => {
    const yearlyVm = resolvePaywallViewModel({
      usage: { usedHours: 18.5, quotaHours: 20 },
      selectedPlanId: 'yearly',
      isOffline: false,
    })

    assert.equal(yearlyVm.usageLabel, '18.5 of 20 free hours')
    assert.equal(yearlyVm.remainingLabel, '1.5 hours left')
    assert.equal(yearlyVm.usageRatio, 0.925)
    assert.equal(yearlyVm.bestValueBadge, 'Best value · Save 44%')
    assert.equal(yearlyVm.ctaLabel, 'Start 7-day free trial')
    assert.equal(
      yearlyVm.footnote,
      '7 days free, then $39.99/year. Cancel anytime in Settings.',
    )
    assert.equal(yearlyVm.ctaDisabled, false)
    assert.equal(yearlyVm.offlineNotice, null)
    assert.equal(PAYWALL_FEATURES.length, 4)

    const monthlyVm = resolvePaywallViewModel({
      usage: { usedHours: 18.5, quotaHours: 20 },
      selectedPlanId: 'monthly',
      isOffline: true,
    })

    assert.equal(
      monthlyVm.footnote,
      '7 days free, then $5.99/month. Cancel anytime in Settings.',
    )
    assert.equal(monthlyVm.ctaDisabled, true)
    assert.equal(monthlyVm.offlineNotice, 'Connect to the internet to subscribe.')
  })

  it('provides MockSubscriptionAdapter for trial activation and restore purchases', async () => {
    const seam = new MockSubscriptionAdapter({ latencyMs: 0 })
    const initialUsage = await seam.getUsage()
    assert.equal(initialUsage.usedHours, 18.5)
    assert.equal(initialUsage.quotaHours, 20)

    const restore = await seam.restorePurchases()
    assert.equal(restore.restored, false)
    assert.equal(restore.message, 'No previous purchases found.')

    const trial = await seam.startTrial('yearly')
    assert.equal(trial.success, true)
    assert.equal(trial.planId, 'yearly')
  })
})
