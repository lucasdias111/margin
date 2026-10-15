import { webSocketService } from '$src/services/websocket/WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import { callState } from '$src/states/CallState.svelte'
import type { CallResponsePayload } from '$src/interfaces/WebSocketMessages'

class CallSignalingService {
  sendOffer(recipientId: number, offer: RTCSessionDescriptionInit): void {
    webSocketService.send({ type: WebSocketMessageType.CALL_OFFER, recipientId, payload: offer })
  }

  sendAnswer(recipientId: number, answer: RTCSessionDescriptionInit): void {
    webSocketService.send<CallResponsePayload>({
      type: WebSocketMessageType.CALL_RESPONSE,
      recipientId,
      payload: { callId: callState.callId, callerId: recipientId, response: answer }
    })
  }

  sendCandidate(recipientId: number, candidate: RTCIceCandidate): void {
    webSocketService.send({
      type: WebSocketMessageType.CALL_CANDIDATE,
      recipientId,
      payload: candidate
    })
  }

  sendCallEnd(userId: number, callId: number, duration: number): void {
    webSocketService.send({
      type: WebSocketMessageType.CALL_END,
      recipientId: userId,
      payload: { callId, callDuration: duration }
    })
  }

  sendNoAnswer(): void {
    webSocketService.send({
      type: WebSocketMessageType.CALL_NO_ANSWER,
      recipientId: callState.p2pCallState!.user.id,
      payload: String(callState.callId!)
    })
  }

  sendMediaState(recipientId: number, video: boolean, audio: boolean, screenShare: boolean): void {
    webSocketService.send({
      type: WebSocketMessageType.CALL_MEDIA_STATE,
      recipientId,
      payload: { video, audio, screenShare }
    })
  }
}

export const callSignalingService = new CallSignalingService()
