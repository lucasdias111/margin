import { push } from 'svelte-spa-router'
import { callService } from '$src/services/call/CallService'
import { channelCallService } from '$src/services/call/ChannelCallService'
import { incomingCallState } from '$src/states/IncomingCallState.svelte'

class IncomingCallService {
  acceptCall(): void {
    const offer = incomingCallState.offer
    if (!offer) return

    incomingCallState.clearOffer()
    callService.startCall(offer.callId, offer.caller, true, false, {
      type: 'offer' as const,
      sdp: offer.sdp
    })
  }

  declineCall(): void {
    const offer = incomingCallState.offer
    if (!offer) return

    callService.rejectCall(offer.callId, offer.caller.id)
    incomingCallState.clearOffer()
  }

  acceptChannelInvite(): void {
    const invite = incomingCallState.channelInvite
    incomingCallState.clearChannelInvite()
    if (!invite) return

    channelCallService.joinVoiceChannel(invite.channelId)
  }

  declineChannelInvite(): void {
    incomingCallState.clearChannelInvite()
  }

  acceptMeetingInvite(): void {
    const invite = incomingCallState.meetingInvite
    if (!invite) return
    incomingCallState.clearMeetingInvite()
    push(`/meet/${invite.code}`)
  }
}

export const incomingCallService = new IncomingCallService()
