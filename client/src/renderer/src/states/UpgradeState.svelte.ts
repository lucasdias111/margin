export type SubscriptionTier = 'FREE' | 'SMALL' | 'MEDIUM' | 'CUSTOM'
export type LimitType = 'MEMBERS' | 'STORAGE' | 'CALL_PARTICIPANTS'

export interface UpgradePromptPayload {
  tier: SubscriptionTier | null
  limit: LimitType | null
  message: string
}

class UpgradeState {
  open = $state<boolean>(false)
  tier = $state<SubscriptionTier | null>(null)
  limit = $state<LimitType | null>(null)
  message = $state<string>('')

  show(payload: UpgradePromptPayload): void {
    this.tier = payload.tier
    this.limit = payload.limit
    this.message = payload.message
    this.open = true
  }

  close(): void {
    this.open = false
  }
}

export const upgradeState = new UpgradeState()
