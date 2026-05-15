export type SubscriptionTier = 'FREE' | 'SMALL' | 'MEDIUM' | 'CUSTOM'
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface SubscriptionLimits {
  maxMembers: number
  maxStorageGb: number
  maxCallParticipants: number
}

export interface Subscription {
  tier: SubscriptionTier
  status: SubscriptionStatus
  limits: SubscriptionLimits
  currentMembers: number
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  hasPendingPayment: boolean
  pendingTier: SubscriptionTier | null
}

export interface TierPrice {
  tier: SubscriptionTier
  price: number
  currency: string
}

export interface CheckoutResponse {
  checkoutUrl: string
}
