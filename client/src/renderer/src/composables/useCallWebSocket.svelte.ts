import { useWebsocketSvelte } from '$src/composables/useWebsocket.svelte'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { CallResponsePayload, WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import type { CallMediaStatePayload } from '$src/interfaces/CallMediaStatePayload'

export function onCallResponse(
  handler: (data: WebSocketMessage<CallResponsePayload>) => void
): void {
  useWebsocketSvelte({ [WebSocketMessageType.CALL_RESPONSE]: handler })
}

export function onCallCandidate(
  handler: (data: WebSocketMessage<RTCIceCandidateInit>) => void
): void {
  useWebsocketSvelte({ [WebSocketMessageType.CALL_CANDIDATE]: handler })
}

export function onCallCreated(handler: (data: WebSocketMessage<{ callId: number }>) => void): void {
  useWebsocketSvelte({ [WebSocketMessageType.CALL_CREATED]: handler })
}

export function onCallEnd(
  handler: (data: WebSocketMessage<{ callId: number; callDuration: number }>) => void
): void {
  useWebsocketSvelte({ [WebSocketMessageType.CALL_END]: handler })
}

export function onCallNoAnswer(handler: (data: WebSocketMessage<string>) => void): void {
  useWebsocketSvelte({ [WebSocketMessageType.CALL_NO_ANSWER]: handler })
}

export function onCallMediaState(
  handler: (data: WebSocketMessage<CallMediaStatePayload>) => void
): void {
  useWebsocketSvelte({ [WebSocketMessageType.CALL_MEDIA_STATE]: handler })
}
