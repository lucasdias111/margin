import type { CallOfferPayload, ChannelCallInvitePayload } from '$src/interfaces/WebSocketMessages'

const CHANNEL_CALL_INVITE_TIMEOUT_MS = 20_000

class IncomingCallState {
  offer = $state<CallOfferPayload | null>(null)
  channelInvite = $state<ChannelCallInvitePayload | null>(null)

  private channelInviteTimer: ReturnType<typeof setTimeout> | null = null

  get isRinging(): boolean {
    return this.offer !== null || this.channelInvite !== null
  }

  setOffer(offer: CallOfferPayload): void {
    this.offer = offer
  }

  clearOffer(): void {
    this.offer = null
  }

  isOfferFor(callId: number | undefined): boolean {
    return this.offer !== null && this.offer.callId === callId
  }

  setChannelInvite(invite: ChannelCallInvitePayload): void {
    this.channelInvite = invite
    this.clearChannelInviteTimer()
    this.channelInviteTimer = setTimeout(
      () => this.clearChannelInvite(),
      CHANNEL_CALL_INVITE_TIMEOUT_MS
    )
  }

  clearChannelInvite(): void {
    this.clearChannelInviteTimer()
    this.channelInvite = null
  }

  clear(): void {
    this.clearOffer()
    this.clearChannelInvite()
  }

  private clearChannelInviteTimer(): void {
    if (this.channelInviteTimer) {
      clearTimeout(this.channelInviteTimer)
      this.channelInviteTimer = null
    }
  }
}

export const incomingCallState = new IncomingCallState()
