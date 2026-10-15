import type {
  CallOfferPayload,
  ChannelCallInvitePayload,
  MeetingInvitePayload
} from '$src/interfaces/WebSocketMessages'

const CHANNEL_CALL_INVITE_TIMEOUT_MS = 20_000

class IncomingCallState {
  offer = $state<CallOfferPayload | null>(null)
  channelInvite = $state<ChannelCallInvitePayload | null>(null)
  meetingInvite = $state<MeetingInvitePayload | null>(null)

  private channelInviteTimer: ReturnType<typeof setTimeout> | null = null
  private meetingInviteTimer: ReturnType<typeof setTimeout> | null = null

  get isRinging(): boolean {
    return this.offer !== null || this.channelInvite !== null || this.meetingInvite !== null
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

  setMeetingInvite(invite: MeetingInvitePayload): void {
    this.meetingInvite = invite
    if (this.meetingInviteTimer) clearTimeout(this.meetingInviteTimer)
    this.meetingInviteTimer = setTimeout(
      () => this.clearMeetingInvite(),
      CHANNEL_CALL_INVITE_TIMEOUT_MS
    )
  }

  clearMeetingInvite(): void {
    if (this.meetingInviteTimer) clearTimeout(this.meetingInviteTimer)
    this.meetingInviteTimer = null
    this.meetingInvite = null
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
