import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type {
  CallOfferPayload,
  CallResponsePayload,
  ChannelCallInvitePayload,
  WebSocketMessage
} from '$src/interfaces/WebSocketMessages'
import type { CallMediaStatePayload } from '$src/interfaces/CallMediaStatePayload'
import type { MessageHandler } from '$src/services/websocket/WebSocketService'
import { callService } from '$src/services/call/CallService'
import { callState } from '$src/states/CallState.svelte'
import { incomingCallState } from '$src/states/IncomingCallState.svelte'

export const callHandlers = {
  [WebSocketMessageType.CALL_OFFER]: (data: WebSocketMessage<CallOfferPayload>) => {
    incomingCallState.setOffer(data.payload)
  },

  [WebSocketMessageType.CALL_CREATED]: (data: WebSocketMessage<{ callId: number }>) => {
    callState.setCallId(data.payload!.callId)
  },

  [WebSocketMessageType.CALL_RESPONSE]: (data: WebSocketMessage<CallResponsePayload>) => {
    void callService.handleCallResponse(data)
  },

  [WebSocketMessageType.CALL_CANDIDATE]: (data: WebSocketMessage<RTCIceCandidateInit>) => {
    void callService.handleCallCandidate(data)
  },

  [WebSocketMessageType.CALL_MEDIA_STATE]: (data: WebSocketMessage<CallMediaStatePayload>) => {
    callService.handleMediaState(data.payload!.video, data.payload!.screenShare)
  },

  [WebSocketMessageType.CALL_END]: (data: WebSocketMessage<{ callId: number }>) => {
    if (incomingCallState.isOfferFor(data.payload?.callId)) {
      incomingCallState.clearOffer()
      return
    }
    callService.endCall(true)
  },

  [WebSocketMessageType.CALL_NO_ANSWER]: () => {
    incomingCallState.clearOffer()
  },

  [WebSocketMessageType.CHANNEL_CALL_INVITE]: (
    data: WebSocketMessage<ChannelCallInvitePayload>
  ) => {
    const invite = data.payload
    if (!invite) return
    if (callState.isGroupCall && callState.groupCallState?.channelId === invite.channelId) return
    incomingCallState.setChannelInvite(invite)
  }
} satisfies Partial<Record<WebSocketMessageType, MessageHandler>>
