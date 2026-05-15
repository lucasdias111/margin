import type { Subscription } from '$src/interfaces/Subscription'

class SubscriptionState {
  subscription = $state<Subscription | null>(null)

  set(subscription: Subscription): void {
    this.subscription = subscription
  }

  clear(): void {
    this.subscription = null
  }
}

export const subscriptionState = new SubscriptionState()
