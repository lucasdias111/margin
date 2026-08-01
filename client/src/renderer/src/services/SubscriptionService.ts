import { authenticatedDelete, authenticatedGet, authenticatedPost } from '$src/services/api'
import type {
  CheckoutResponse,
  Subscription,
  SubscriptionTier,
  TierPrice
} from '$src/interfaces/Subscription'

class SubscriptionService {
  async fetchForMargin(marginId: number): Promise<Subscription> {
    const response = await authenticatedGet(`subscriptions/margin/${marginId}`)
    return response.json()
  }

  async fetchTiers(): Promise<TierPrice[]> {
    const response = await authenticatedGet('subscriptions/tiers')
    return response.json()
  }

  async startCheckout(marginId: number, tier: SubscriptionTier): Promise<CheckoutResponse> {
    const response = await authenticatedPost({ marginId, tier }, 'subscriptions/checkout')
    if (!response.ok) throw new Error(`Checkout failed: ${response.status}`)
    return response.json()
  }

  async changeTier(marginId: number, tier: SubscriptionTier): Promise<Subscription> {
    const response = await authenticatedPost({ tier }, `subscriptions/margin/${marginId}/tier`)
    if (!response.ok) throw new Error(`Tier change failed: ${response.status}`)
    return response.json()
  }

  async reconcilePending(marginId: number): Promise<Subscription> {
    const response = await authenticatedPost({}, `subscriptions/margin/${marginId}/reconcile`)
    if (!response.ok) throw new Error(`Reconcile failed: ${response.status}`)
    return response.json()
  }

  async cancelPending(marginId: number): Promise<Subscription> {
    const response = await authenticatedPost({}, `subscriptions/margin/${marginId}/cancel-pending`)
    if (!response.ok) throw new Error(`Cancel pending failed: ${response.status}`)
    return response.json()
  }

  async cancelSubscription(marginId: number): Promise<void> {
    const response = await authenticatedDelete({}, `subscriptions/margin/${marginId}`)
    if (!response.ok) throw new Error(`Cancel failed: ${response.status}`)
  }
}

export const subscriptionService = new SubscriptionService()
