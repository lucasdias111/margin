import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import { webSocketService, type MessageHandler } from '$src/services/websocket/WebSocketService'
import { webSocketSessionAdapter } from '$src/services/websocket/sessionAdapter'
import { accountHandlers } from '$src/services/websocket/handlers/accountHandlers'
import { callHandlers } from '$src/services/websocket/handlers/callHandlers'
import { inviteHandlers } from '$src/services/websocket/handlers/inviteHandlers'
import { marginHandlers } from '$src/services/websocket/handlers/marginHandlers'
import { messageHandlers } from '$src/services/websocket/handlers/messageHandlers'
import { presenceHandlers } from '$src/services/websocket/handlers/presenceHandlers'
import { voiceHandlers } from '$src/services/websocket/handlers/voiceHandlers'

export const OUTBOUND_ONLY = [
  WebSocketMessageType.SEND_MESSAGE,
  WebSocketMessageType.SEND_EDIT_MESSAGE,
  WebSocketMessageType.SEND_DELETE_MESSAGE,
  WebSocketMessageType.SEND_ADD_REACTION,
  WebSocketMessageType.SEND_REMOVE_REACTION,
  WebSocketMessageType.SEND_TYPING_INDICATOR,
  WebSocketMessageType.CALL_REJECTED,
  WebSocketMessageType.PING,
  WebSocketMessageType.PONG
] as const

export type InboundMessageType = Exclude<WebSocketMessageType, (typeof OUTBOUND_ONLY)[number]>

export const inboundHandlers: Record<InboundMessageType, MessageHandler> = {
  ...messageHandlers,
  ...callHandlers,
  ...voiceHandlers,
  ...presenceHandlers,
  ...marginHandlers,
  ...inviteHandlers,
  ...accountHandlers
}

export function registerWebSocketHandlers(): () => void {
  webSocketService.configureSession(webSocketSessionAdapter)

  for (const [type, handler] of Object.entries(inboundHandlers)) {
    webSocketService.on(type, handler)
  }

  return () => {
    for (const [type, handler] of Object.entries(inboundHandlers)) {
      webSocketService.off(type, handler)
    }
  }
}
