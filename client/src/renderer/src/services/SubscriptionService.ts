import { authenticatedGet } from '$src/services/api'
import type { Subscription } from '$src/interfaces/Subscription'

class SubscriptionService {
  async fetchForMargin(marginId: number): Promise<Subscription> {
    const response = await authenticatedGet(`subscriptions/margin/${marginId}`)
    return response.json()
  }
}

export const subscriptionService = new SubscriptionService()
