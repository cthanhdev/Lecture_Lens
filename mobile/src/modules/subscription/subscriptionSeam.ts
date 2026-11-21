import type { FreeUsageQuota, PlusPlanId } from './paywallModel.ts'

export interface TrialActivationResult {
  readonly success: boolean
  readonly planId: PlusPlanId
  readonly message: string
}

export interface RestorePurchasesResult {
  readonly restored: boolean
  readonly message: string
}

export interface SubscriptionSeam {
  getUsage(): Promise<FreeUsageQuota>
  startTrial(planId: PlusPlanId): Promise<TrialActivationResult>
  restorePurchases(): Promise<RestorePurchasesResult>
}

export class MockSubscriptionAdapter implements SubscriptionSeam {
  private readonly latencyMs: number
  private readonly usage: FreeUsageQuota

  constructor(options?: { latencyMs?: number; usage?: FreeUsageQuota }) {
    this.latencyMs = options?.latencyMs ?? 300
    this.usage = options?.usage ?? { usedHours: 18.5, quotaHours: 20 }
  }

  private async wait(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs))
    }
  }

  async getUsage(): Promise<FreeUsageQuota> {
    return { ...this.usage }
  }

  async startTrial(planId: PlusPlanId): Promise<TrialActivationResult> {
    await this.wait()
    return {
      success: true,
      planId,
      message: '7-day Kitsune Plus trial activated.',
    }
  }

  async restorePurchases(): Promise<RestorePurchasesResult> {
    await this.wait()
    return {
      restored: false,
      message: 'No previous purchases found.',
    }
  }
}

let activeSubscriptionSeam: SubscriptionSeam = new MockSubscriptionAdapter()

export function getSubscriptionSeam(): SubscriptionSeam {
  return activeSubscriptionSeam
}

export function setSubscriptionSeam(seam: SubscriptionSeam): void {
  activeSubscriptionSeam = seam
}
